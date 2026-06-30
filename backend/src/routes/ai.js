const express = require('express');
const prisma = require('../services/prisma');
const { auth } = require('../middleware/auth');
const { getAIHint, getAICodeReview, getAIDebugHelp } = require('../services/aiService');
const { callAI } = require('../services/aiService');
const crypto = require('crypto');

const router = express.Router();

const hashPayload = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

// POST /api/ai/hint — get a targeted hint for a problem
router.post('/hint', auth, async (req, res) => {
  try {
    const { problemSlug, code, language } = req.body;
    if (!problemSlug || !code || !language) {
      return res.status(400).json({ error: 'problemSlug, code, and language are required' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const result = await getAIHint({
      problemTitle: problem.title,
      problemDescription: problem.description,
      constraints: problem.constraints,
      difficulty: problem.difficulty,
      code,
      language,
      cacheKey: `hint:${problemSlug}:${language}:${hashPayload(code)}`,
    });

    if (!result.ok) return res.status(503).json({ error: result.text });
    res.json({ hint: result.text });
  } catch (err) {
    req.log?.error({ err: err.message }, '[AI Hint]');
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

// POST /api/ai/review — get code review after run/submit
router.post('/review', auth, async (req, res) => {
  try {
    const { problemSlug, code, language, verdict, score, passedCases, totalCases, complexityEstimate } = req.body;
    if (!problemSlug || !code || !language || !verdict) {
      return res.status(400).json({ error: 'problemSlug, code, language, and verdict are required' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const result = await getAICodeReview({
      problemTitle: problem.title,
      difficulty: problem.difficulty,
      code,
      language,
      verdict,
      score: score || 0,
      passedCases: passedCases || 0,
      totalCases: totalCases || 0,
      complexityEstimate,
      cacheKey: `review:${problemSlug}:${language}:${verdict}:${score || 0}:${hashPayload(code)}`,
    });

    if (!result.ok) return res.status(503).json({ error: result.text });
    res.json({ review: result.text });
  } catch (err) {
    req.log?.error({ err: err.message }, '[AI Review]');
    res.status(500).json({ error: 'Failed to generate review' });
  }
});

// POST /api/ai/debug — explain why a test case failed
router.post('/debug', auth, async (req, res) => {
  try {
    const { problemSlug, code, language, input, expectedOutput, actualOutput, stderr } = req.body;
    if (!problemSlug || !code || !language) {
      return res.status(400).json({ error: 'problemSlug, code, and language are required' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const result = await getAIDebugHelp({
      problemTitle: problem.title,
      code,
      language,
      input: input || '',
      expectedOutput: expectedOutput || '',
      actualOutput: actualOutput || '',
      stderr: stderr || '',
      cacheKey: `debug:${problemSlug}:${language}:${hashPayload([code, input || '', expectedOutput || ''].join('::'))}`,
    });

    if (!result.ok) return res.status(503).json({ error: result.text });
    res.json({ analysis: result.text });
  } catch (err) {
    req.log?.error({ err: err.message }, '[AI Debug]');
    res.status(500).json({ error: 'Failed to generate debug analysis' });
  }
});

// POST /api/ai/explain-complexity — explain why complexity is what it is (Phase 3.4)
router.post('/explain-complexity', auth, async (req, res) => {
  try {
    const { problemSlug, code, language, complexityEstimate, optimalComplexity } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'code and language are required' });
    }

    const problem = problemSlug ? await prisma.problem.findUnique({ where: { slug: problemSlug } }) : null;

    const systemPrompt = `You are a DSA complexity analyst. Given code and a complexity estimate, explain concisely why the code runs at that complexity. Focus on the specific loops, recursion, or data structures causing it. Then suggest the optimal approach if it differs. Be technical and precise. Use plain text, no markdown headers. Max 5 lines.`;

    const userPrompt = `Problem: "${problem?.title || 'Custom'}"
Language: ${language}
Detected complexity: ${complexityEstimate || 'Unknown'}
Optimal complexity: ${optimalComplexity || problem?.optimalComplexity || 'Unknown'}

Code:
\`\`\`
${code.slice(0, 1500)}
\`\`\`

Explain the complexity and suggest improvements if needed.`;

    const cacheKey = `complexity:${language}:${complexityEstimate}:${hashPayload(code)}`;
    const result = await callAI(systemPrompt, userPrompt, cacheKey);

    if (!result.ok) return res.status(503).json({ error: result.text });
    res.json({ explanation: result.text });
  } catch (err) {
    req.log?.error({ err: err.message }, '[AI Complexity]');
    res.status(500).json({ error: 'Failed to explain complexity' });
  }
});

// GET /api/ai/recommend — recommend next problem after a solve (Phase 3.6)
router.get('/recommend', auth, async (req, res) => {
  try {
    // Get user's recent submissions and weakness topics
    const recentSubs = await prisma.submission.findMany({
      where: { userId: req.user.id, verdict: { not: 'PENDING' } },
      orderBy: { submittedAt: 'desc' },
      take: 20,
      include: { problem: { select: { title: true, slug: true, difficulty: true, topic: { select: { name: true } } } } },
    });

    const solvedSlugs = new Set(
      recentSubs.filter((s) => s.verdict === 'ACCEPTED').map((s) => s.problem.slug)
    );

    // Count failures per topic to find weak areas
    const topicFailCounts = {};
    for (const sub of recentSubs) {
      if (sub.verdict !== 'ACCEPTED') {
        const topic = sub.problem.topic?.name || 'Unknown';
        topicFailCounts[topic] = (topicFailCounts[topic] || 0) + 1;
      }
    }

    const weakTopics = Object.entries(topicFailCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);

    // Get unsolvedproblems from weak topics
    const candidates = await prisma.problem.findMany({
      where: {
        slug: { notIn: [...solvedSlugs] },
        ...(weakTopics.length > 0 ? { topic: { name: { in: weakTopics } } } : {}),
      },
      select: { id: true, slug: true, title: true, difficulty: true, topic: { select: { name: true } } },
      take: 10,
    });

    if (candidates.length === 0) {
      return res.json({ recommendations: [], message: 'You have solved all problems in your weak areas! Try a new topic.' });
    }

    const systemPrompt = `You are a DSA learning advisor. Given a student's recent solving history and weak topics, recommend 3 specific problems from the candidate list. Prioritize weaker topics and appropriate difficulty progression. Return ONLY a JSON array of slugs, e.g. ["two-sum", "best-time-to-buy-stock"]. No other text.`;

    const userPrompt = `Student weak topics: ${weakTopics.join(', ') || 'none identified yet'}
Recent solved: ${[...solvedSlugs].slice(0, 5).join(', ') || 'none'}
Candidate problems:
${candidates.map((p) => `- ${p.slug} (${p.topic?.name}, ${p.difficulty})`).join('\n')}

Return JSON array of 3 recommended slugs.`;

    const result = await callAI(systemPrompt, userPrompt, `recommend:${req.user.id}:${Date.now()}`);

    let recommendedSlugs = [];
    try {
      const match = result.text.match(/\[.*?\]/s);
      if (match) recommendedSlugs = JSON.parse(match[0]);
    } catch {
      recommendedSlugs = candidates.slice(0, 3).map((c) => c.slug);
    }

    const recommended = candidates.filter((c) => recommendedSlugs.includes(c.slug)).slice(0, 3);
    res.json({ recommendations: recommended, weakTopics });
  } catch (err) {
    req.log?.error({ err: err.message }, '[AI Recommend]');
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ── Phase 3: AI Interview Simulator ──────────────────────────────────────────

// POST /api/ai/interview/start — start an interview session
router.post('/interview/start', auth, async (req, res) => {
  try {
    const { problemSlug } = req.body;

    let problemContext = '';
    if (problemSlug) {
      const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
      if (problem) {
        problemContext = `Problem: "${problem.title}" [${problem.difficulty}]\n${problem.description.slice(0, 600)}`;
      }
    }

    const systemPrompt = `You are a technical interviewer at a top tech company conducting a DSA interview. 
You will ask the candidate about a coding problem, probe their thinking, and evaluate their approach.
Start by introducing yourself and the problem. Ask about their initial thoughts, then probe edge cases, complexity, and optimizations.
Be professional, encouraging but rigorous. Keep responses concise (3-5 lines max).`;

    const userPrompt = problemContext
      ? `Start the interview with this problem:\n${problemContext}`
      : 'Start a DSA interview with a medium-difficulty problem of your choice.';

    const result = await callAI(systemPrompt, userPrompt, null);
    if (!result.ok) return res.status(503).json({ error: result.text });

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: result.text },
    ];

    const session = await prisma.interviewSession.create({
      data: {
        userId: req.user.id,
        problemId: null,
        messages,
      },
    });

    res.status(201).json({ sessionId: session.id, message: result.text });
  } catch (err) {
    req.log?.error({ err: err.message }, '[AI Interview Start]');
    res.status(500).json({ error: 'Failed to start interview session' });
  }
});

// POST /api/ai/interview/:sessionId/message — send a message in an interview
router.post('/interview/:sessionId/message', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const session = await prisma.interviewSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const messages = Array.isArray(session.messages) ? session.messages : [];
    const systemMsg = messages.find((m) => m.role === 'system');

    // Build conversation context (last 6 messages to stay within token limits)
    const recentMessages = messages.filter((m) => m.role !== 'system').slice(-6);
    const conversationHistory = recentMessages
      .map((m) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const userPrompt = `${conversationHistory}\nCandidate: ${message}\n\nContinue the interview. Probe deeper or move to the next aspect.`;
    const result = await callAI(systemMsg?.content || 'You are a technical interviewer.', userPrompt, null);

    if (!result.ok) return res.status(503).json({ error: result.text });

    // Append messages and save
    const updatedMessages = [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: result.text },
    ];

    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { messages: updatedMessages },
    });

    res.json({ message: result.text, sessionId: session.id });
  } catch (err) {
    req.log?.error({ err: err.message }, '[AI Interview Message]');
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/ai/interview/:sessionId/end — end session and get scored feedback
router.post('/interview/:sessionId/end', auth, async (req, res) => {
  try {
    const session = await prisma.interviewSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const messages = Array.isArray(session.messages) ? session.messages : [];
    const conversation = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are a senior engineer scoring a mock DSA interview. Based on the conversation, provide a structured evaluation.`;
    const userPrompt = `Interview transcript:\n${conversation.slice(0, 3000)}\n\nProvide evaluation as:
Score: X/10
Communication: (1 sentence)
Approach: (1 sentence)
Edge Cases: (1 sentence)
Complexity Awareness: (1 sentence)
Overall: (1 sentence with key advice)`;

    const result = await callAI(systemPrompt, userPrompt, null);

    // Parse score from response
    const scoreMatch = result.text.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? Number(scoreMatch[1]) : null;

    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { score, feedback: result.text },
    });

    res.json({ feedback: result.text, score, sessionId: session.id });
  } catch (err) {
    req.log?.error({ err: err.message }, '[AI Interview End]');
    res.status(500).json({ error: 'Failed to end interview session' });
  }
});

// GET /api/ai/interview/history — user's past interview sessions
router.get('/interview/history', auth, async (req, res) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, score: true, feedback: true, createdAt: true, updatedAt: true },
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
