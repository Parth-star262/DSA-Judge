const express = require('express');
const prisma = require('../services/prisma');
const { auth } = require('../middleware/auth');
const { callAI } = require('../services/aiService');
const crypto = require('crypto');

const router = express.Router();

const hashPayload = (v) => crypto.createHash('sha256').update(String(v || '')).digest('hex');

// All 22 DSA topics tracked by the coach
const ALL_TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Hashing',
  'Binary Search', 'Recursion', 'Backtracking', 'Trees', 'BST', 'Heap',
  'Graphs', 'Trie', 'Greedy', 'Dynamic Programming', 'Bit Manipulation',
  'Sliding Window', 'Two Pointers', 'Prefix Sum', 'Segment Tree', 'Disjoint Set Union',
];

const DIFFICULTY_MAP = { EASY: 1, MEDIUM: 2, HARD: 3, MIXED: 2 };

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Onboarding & Profile API
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/coach/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const profile = await prisma.interviewProfile.findUnique({ where: { userId: req.user.id } });
    res.json(profile || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coach/profile  — create or update the user's interview profile
router.post('/profile', auth, async (req, res) => {
  try {
    const {
      skillLevel = 'BEGINNER',
      targetCompanies = [],
      preferredLanguage = 'python',
      preferredDifficulty = 'MIXED',
      weakTopics = [],
      strongTopics = [],
    } = req.body;

    const profile = await prisma.interviewProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        skillLevel,
        targetCompanies,
        preferredLanguage,
        preferredDifficulty,
        weakTopics,
        strongTopics,
      },
      update: {
        skillLevel,
        targetCompanies,
        preferredLanguage,
        preferredDifficulty,
        weakTopics,
        strongTopics,
      },
    });

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coach/assess  — AI-driven 5-question skill assessment
router.post('/assess', auth, async (req, res) => {
  try {
    const { answers } = req.body;

    // Phase A: Generate questions (no answers provided yet)
    if (!answers) {
      const profile = await prisma.interviewProfile.findUnique({ where: { userId: req.user.id } });
      const level = profile?.skillLevel || 'BEGINNER';

      const systemPrompt = `You are a DSA assessment engine. Generate exactly 5 multiple-choice questions to assess a ${level} programmer across different DSA topics. Cover a variety of topics from: Arrays, Strings, Hashing, Binary Search, Trees, Graphs, DP, Recursion, Greedy.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "topic": "Arrays",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctIndex": 0
    }
  ]
}`;
      const userPrompt = `Generate 5 DSA assessment questions for a ${level} programmer. Vary topics. Return JSON only.`;
      const result = await callAI(systemPrompt, userPrompt, `assess:${req.user.id}:${level}`, { maxTokens: 900, maxLines: 60 });

      if (!result.ok) return res.status(503).json({ error: result.text });

      let parsed;
      try {
        const match = result.text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : result.text);
      } catch {
        return res.status(500).json({ error: 'Failed to parse assessment questions' });
      }

      return res.json({ questions: parsed.questions || [] });
    }

    // Phase B: Evaluate answers and identify weak/strong topics
    const { questions, answers: userAnswers } = req.body;
    if (!questions || !userAnswers) return res.status(400).json({ error: 'questions and answers are required' });

    const topicResults = {};
    questions.forEach((q, i) => {
      const correct = userAnswers[i] === q.correctIndex;
      topicResults[q.topic] = topicResults[q.topic] || { correct: 0, total: 0 };
      topicResults[q.topic].total++;
      if (correct) topicResults[q.topic].correct++;
    });

    const weakTopics = Object.entries(topicResults).filter(([, v]) => v.correct / v.total < 0.5).map(([t]) => t);
    const strongTopics = Object.entries(topicResults).filter(([, v]) => v.correct / v.total >= 0.5).map(([t]) => t);

    // Update profile with assessment results
    await prisma.interviewProfile.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, weakTopics, strongTopics, assessmentDone: true },
      update: { weakTopics, strongTopics, assessmentDone: true },
    });

    res.json({ weakTopics, strongTopics, topicResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coach/plan  — personalized learning plan
router.get('/plan', auth, async (req, res) => {
  try {
    const profile = await prisma.interviewProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'No profile found. Complete onboarding first.' });

    const cacheKey = `plan:${req.user.id}:${hashPayload(JSON.stringify(profile.weakTopics))}`;

    const systemPrompt = `You are a DSA learning advisor. Create a 4-week structured learning plan in JSON. Each week has 1-2 topics with specific goals.

Return ONLY valid JSON:
{
  "weeks": [
    {
      "week": 1,
      "topics": ["Arrays", "Strings"],
      "goal": "Master sliding window and two-pointer patterns",
      "problems": ["easy: 3, medium: 2"],
      "focus": "Description of what to focus on"
    }
  ],
  "priorityOrder": ["topic1", "topic2"],
  "estimatedWeeks": 4
}`;

    const userPrompt = `Skill level: ${profile.skillLevel}
Weak topics: ${profile.weakTopics.join(', ') || 'None identified'}
Strong topics: ${profile.strongTopics.join(', ') || 'None identified'}
Preferred difficulty: ${profile.preferredDifficulty}
Create a personalized 4-week DSA learning plan. JSON only.`;

    const result = await callAI(systemPrompt, userPrompt, cacheKey, { maxTokens: 900, maxLines: 60 });
    if (!result.ok) return res.status(503).json({ error: result.text });

    let plan;
    try {
      const match = result.text.match(/\{[\s\S]*\}/);
      plan = JSON.parse(match ? match[0] : result.text);
    } catch {
      plan = { weeks: [], priorityOrder: profile.weakTopics, estimatedWeeks: 4 };
    }

    res.json({ plan, profile: { skillLevel: profile.skillLevel, weakTopics: profile.weakTopics, strongTopics: profile.strongTopics } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Enhanced Interview Session API
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/coach/session/start
router.post('/session/start', auth, async (req, res) => {
  try {
    const { problemSlug, mode = 'standard', topicFocus, difficulty } = req.body;

    const profile = await prisma.interviewProfile.findUnique({ where: { userId: req.user.id } });
    const skillLevel = profile?.skillLevel || 'INTERMEDIATE';
    const lang = profile?.preferredLanguage || 'python';
    const diff = difficulty || profile?.preferredDifficulty || 'MIXED';
    const weak = profile?.weakTopics?.join(', ') || 'not assessed yet';

    let problemContext = '';
    if (problemSlug) {
      const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
      if (problem) {
        problemContext = `\nProblem: "${problem.title}" [${problem.difficulty}]\n${problem.description.slice(0, 500)}`;
      }
    }

    const modeInstructions = {
      standard: `Conduct a full DSA interview. Start with an introduction and a problem appropriate for ${skillLevel} level at ${diff} difficulty. The candidate prefers ${lang}.`,
      'topic-focus': `Focus this entire interview on the topic: ${topicFocus || 'Arrays'}. Start with a ${diff}-difficulty problem in that topic.`,
      theory: `The candidate wants to understand DSA concepts deeply. They are at ${skillLevel} level. Start by asking what concept they want to explore.`,
      'code-review': `The candidate wants code review feedback. Ask them to share code for any problem. Evaluate correctness, complexity, and style.`,
    };

    const systemPrompt = `You are an expert DSA interviewer and coach at a top tech company.
Candidate profile:
- Skill level: ${skillLevel}
- Preferred language: ${lang}
- Weak topics: ${weak}
- Interview mode: ${mode}
- Target difficulty: ${diff}

Behavior rules:
1. Ask ONE question at a time. Never reveal the full solution immediately.
2. Always ask for brute force first, then optimization.
3. Ask about time and space complexity after each solution attempt.
4. Ask about edge cases.
5. Give progressive hints only if the candidate asks or is stuck.
6. Be professional, encouraging, and rigorous.
7. Keep responses to 4-6 lines max unless explaining a concept.
8. Teach the thinking process, not just answers.

${modeInstructions[mode] || modeInstructions.standard}`;

    const userPrompt = problemContext
      ? `Start the interview with this problem:${problemContext}`
      : (modeInstructions[mode] || 'Start the interview now.');

    const result = await callAI(systemPrompt, userPrompt, null, { maxTokens: 700, maxLines: 15 });
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
        difficulty: diff,
        mode,
        topicsCovered: topicFocus ? [topicFocus] : [],
      },
    });

    res.status(201).json({ sessionId: session.id, message: result.text, mode, difficulty: diff });
  } catch (err) {
    console.error('[Coach Start]', err.message);
    res.status(500).json({ error: 'Failed to start interview session' });
  }
});

// POST /api/coach/session/:sessionId/message
router.post('/session/:sessionId/message', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const session = await prisma.interviewSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (session.reportGenerated) return res.status(400).json({ error: 'Session has ended' });

    const messages = Array.isArray(session.messages) ? session.messages : [];
    const systemMsg = messages.find((m) => m.role === 'system');
    const recentMessages = messages.filter((m) => m.role !== 'system').slice(-8);

    const conversationHistory = recentMessages
      .map((m) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const turnCount = recentMessages.filter((m) => m.role === 'user').length;
    const coachingHint = turnCount >= 4
      ? '\n[Coaching note: This is turn ' + (turnCount + 1) + '. If you have covered brute force and optimization, ask about complexity and edge cases, or move to a follow-up question.]'
      : '';

    const userPrompt = `${conversationHistory}\nCandidate: ${message}\n\nContinue the interview naturally. Probe deeper, ask follow-ups, or move to the next aspect.${coachingHint}`;
    const result = await callAI(
      systemMsg?.content || 'You are a technical DSA interviewer.',
      userPrompt,
      null,
      { maxTokens: 600, maxLines: 14 }
    );

    if (!result.ok) return res.status(503).json({ error: result.text });

    const updatedMessages = [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: result.text },
    ];

    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { messages: updatedMessages, updatedAt: new Date() },
    });

    res.json({ message: result.text, sessionId: session.id, turnCount: turnCount + 1 });
  } catch (err) {
    console.error('[Coach Message]', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/coach/session/:sessionId/hint  — progressive hints (level 1/2/3)
router.post('/session/:sessionId/hint', auth, async (req, res) => {
  try {
    const { hintLevel = 1 } = req.body; // 1=nudge, 2=approach, 3=walkthrough

    const session = await prisma.interviewSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const messages = Array.isArray(session.messages) ? session.messages : [];
    const systemMsg = messages.find((m) => m.role === 'system');
    const recentMessages = messages.filter((m) => m.role !== 'system').slice(-6);
    const conversationSoFar = recentMessages.map((m) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');

    const hintInstructions = {
      1: 'Give a very small nudge — just point to the right data structure or concept to think about. 1-2 sentences maximum.',
      2: 'Give a medium hint — describe the high-level approach or algorithm pattern without showing code. 2-3 sentences.',
      3: 'Give a detailed walkthrough — explain the step-by-step approach clearly. Still no code, but describe the algorithm completely. 4-5 sentences.',
    };

    const systemPrompt = systemMsg?.content || 'You are a DSA interviewer.';
    const userPrompt = `The candidate is stuck and asked for a hint (level ${hintLevel}/3).
${hintInstructions[hintLevel] || hintInstructions[1]}

Conversation so far:
${conversationSoFar}

Provide the hint now.`;

    const result = await callAI(systemPrompt, userPrompt, null, { maxTokens: 350, maxLines: 8 });
    if (!result.ok) return res.status(503).json({ error: result.text });

    res.json({ hint: result.text, hintLevel, maxLevel: 3 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get hint' });
  }
});

// POST /api/coach/session/:sessionId/score-question  — score one Q&A pair
router.post('/session/:sessionId/score-question', auth, async (req, res) => {
  try {
    const { questionText, userAnswer, topic = 'General', startedAt } = req.body;
    if (!questionText || !userAnswer) return res.status(400).json({ error: 'questionText and userAnswer are required' });

    const session = await prisma.interviewSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const timeTaken = startedAt ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000) : 0;

    const systemPrompt = `You are a senior engineer scoring a DSA interview answer. Evaluate the candidate's response across 9 dimensions and return ONLY valid JSON.

Return this exact structure:
{
  "score": 7,
  "strengths": ["clear brute force explanation", "identified time complexity correctly"],
  "mistakes": ["did not consider edge case of empty input", "space complexity was O(n) but could be O(1)"],
  "betterApproach": "A two-pointer approach would reduce space to O(1)...",
  "interviewerFeedback": "Good overall thinking. You verbalized your logic well...",
  "conceptsToRevise": ["Two Pointers", "In-place algorithms"]
}`;

    const userPrompt = `Question: ${questionText}
Topic: ${topic}
Candidate's answer: ${userAnswer.slice(0, 2000)}

Score this answer out of 10 based on: correctness, logic, code quality, optimization, time complexity, space complexity, variable naming, readability, communication. Return JSON only.`;

    const result = await callAI(systemPrompt, userPrompt, null, { maxTokens: 600, maxLines: 30 });
    if (!result.ok) return res.status(503).json({ error: result.text });

    let scored;
    try {
      const match = result.text.match(/\{[\s\S]*\}/);
      scored = JSON.parse(match ? match[0] : result.text);
    } catch {
      return res.status(500).json({ error: 'Failed to parse scoring result' });
    }

    // Save to DB
    const qResult = await prisma.interviewQuestionResult.create({
      data: {
        sessionId: session.id,
        userId: req.user.id,
        questionText,
        userAnswer: userAnswer.slice(0, 3000),
        topic,
        difficulty: session.difficulty || 'MEDIUM',
        score: scored.score || 0,
        strengths: scored.strengths || [],
        mistakes: scored.mistakes || [],
        betterApproach: scored.betterApproach || '',
        interviewerFeedback: scored.interviewerFeedback || '',
        conceptsToRevise: scored.conceptsToRevise || [],
        timeTakenSeconds: timeTaken,
      },
    });

    // Add topic to session's topicsCovered
    const currentTopics = session.topicsCovered || [];
    if (!currentTopics.includes(topic)) {
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: { topicsCovered: [...currentTopics, topic] },
      });
    }

    res.json({ ...scored, resultId: qResult.id, timeTakenSeconds: timeTaken });
  } catch (err) {
    console.error('[Score Question]', err.message);
    res.status(500).json({ error: 'Failed to score question' });
  }
});

// POST /api/coach/session/:sessionId/end  — end session and generate full report
router.post('/session/:sessionId/end', auth, async (req, res) => {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: req.params.sessionId },
      include: { questionResults: true },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const messages = Array.isArray(session.messages) ? session.messages : [];
    const conversation = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const qResults = session.questionResults || [];
    const avgScore = qResults.length > 0 ? Math.round(qResults.reduce((s, r) => s + r.score, 0) / qResults.length) : null;

    const topicScores = {};
    qResults.forEach((r) => {
      if (!topicScores[r.topic]) topicScores[r.topic] = { total: 0, count: 0 };
      topicScores[r.topic].total += r.score;
      topicScores[r.topic].count++;
    });
    const strongAreas = Object.entries(topicScores).filter(([, v]) => v.total / v.count >= 7).map(([t]) => t);
    const weakAreas = Object.entries(topicScores).filter(([, v]) => v.total / v.count < 5).map(([t]) => t);
    const allMistakes = [...new Set(qResults.flatMap((r) => r.mistakes))];
    const allRevise = [...new Set(qResults.flatMap((r) => r.conceptsToRevise))];

    const systemPrompt = `You are a senior engineer evaluating a mock DSA interview. Generate a structured interview report.`;
    const userPrompt = `Interview transcript:
${conversation.slice(0, 3000)}

Scored questions: ${qResults.length}
Average question score: ${avgScore ?? 'N/A'}/10
Strong areas: ${strongAreas.join(', ') || 'None yet'}
Weak areas: ${weakAreas.join(', ') || 'None yet'}

Generate evaluation in EXACTLY this format (keep the dashes and labels):
----------------------------------
Interview Report
----------------------------------
Overall Score: X/10
Difficulty: ${session.difficulty}
Topics Covered: ${session.topicsCovered.join(', ') || 'General DSA'}
Strong Areas: list here
Weak Areas: list here
Mistakes: list top 3 mistakes
Recommended Revision: list 2-3 concepts
Recommended Questions: list 3 problem types to practice
Next Interview Difficulty: recommend EASY/MEDIUM/HARD based on performance
Overall Feedback: 2-3 sentence overall assessment
----------------------------------`;

    const result = await callAI(systemPrompt, userPrompt, null, { maxTokens: 800, maxLines: 25 });

    // Parse score from the report
    const scoreMatch = (result.text || '').match(/Overall Score:\s*(\d+)/i);
    const finalScore = scoreMatch ? Number(scoreMatch[1]) : (avgScore || null);

    // Parse next difficulty
    const nextDiffMatch = (result.text || '').match(/Next Interview Difficulty:\s*(EASY|MEDIUM|HARD|MIXED)/i);
    const nextDiff = nextDiffMatch ? nextDiffMatch[1].toUpperCase() : null;

    // Calculate duration
    const durationSeconds = Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000);

    // Update session as complete
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        score: finalScore,
        feedback: result.text,
        reportGenerated: true,
        durationSeconds,
      },
    });

    // Update user's InterviewProfile stats
    const profile = await prisma.interviewProfile.findUnique({ where: { userId: req.user.id } });
    if (profile) {
      const newTotal = profile.totalSessions + 1;
      const newAvg = finalScore !== null
        ? Math.round(((profile.avgScore * profile.totalSessions) + finalScore) / newTotal)
        : profile.avgScore;

      // Re-calculate weak/strong topics from all question results
      const allUserResults = await prisma.interviewQuestionResult.findMany({
        where: { userId: req.user.id },
      });
      const topicAggs = {};
      allUserResults.forEach((r) => {
        if (!topicAggs[r.topic]) topicAggs[r.topic] = { total: 0, count: 0 };
        topicAggs[r.topic].total += r.score;
        topicAggs[r.topic].count++;
      });
      const newWeak = Object.entries(topicAggs).filter(([, v]) => v.total / v.count < 5).map(([t]) => t);
      const newStrong = Object.entries(topicAggs).filter(([, v]) => v.total / v.count >= 7).map(([t]) => t);

      await prisma.interviewProfile.update({
        where: { userId: req.user.id },
        data: {
          totalSessions: newTotal,
          avgScore: newAvg,
          weakTopics: newWeak,
          strongTopics: newStrong,
          ...(nextDiff ? { preferredDifficulty: nextDiff } : {}),
        },
      });
    }

    res.json({
      feedback: result.text,
      score: finalScore,
      sessionId: session.id,
      durationSeconds,
      strongAreas,
      weakAreas,
      allMistakes,
      allRevise,
      questionCount: qResults.length,
      nextDifficulty: nextDiff,
    });
  } catch (err) {
    console.error('[Coach End]', err.message);
    res.status(500).json({ error: 'Failed to end interview session' });
  }
});

// GET /api/coach/session/:sessionId/report
router.get('/session/:sessionId/report', auth, async (req, res) => {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: req.params.sessionId },
      include: {
        questionResults: { orderBy: { createdAt: 'asc' } },
        problem: { select: { id: true, slug: true, title: true, difficulty: true } },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    res.json({
      id: session.id,
      score: session.score,
      feedback: session.feedback,
      difficulty: session.difficulty,
      mode: session.mode,
      topicsCovered: session.topicsCovered,
      durationSeconds: session.durationSeconds,
      reportGenerated: session.reportGenerated,
      questionResults: session.questionResults,
      problem: session.problem,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coach/session/:sessionId  — load active session (for resuming)
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: req.params.sessionId },
      include: { questionResults: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    res.json({
      ...session,
      messages: Array.isArray(session.messages) ? session.messages : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coach/sessions  — list all sessions for the user
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true, score: true, feedback: true, difficulty: true, mode: true,
        topicsCovered: true, durationSeconds: true, reportGenerated: true,
        createdAt: true, updatedAt: true,
        _count: { select: { questionResults: true } },
      },
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/coach/topic-performance  — per-topic stats across all sessions
router.get('/topic-performance', auth, async (req, res) => {
  try {
    const results = await prisma.interviewQuestionResult.findMany({
      where: { userId: req.user.id },
      select: { topic: true, score: true, difficulty: true, createdAt: true },
    });

    const topicMap = {};
    for (const topic of ALL_TOPICS) {
      topicMap[topic] = { topic, totalScore: 0, count: 0, avgScore: 0, status: 'Not Attempted' };
    }

    results.forEach((r) => {
      if (!topicMap[r.topic]) topicMap[r.topic] = { topic: r.topic, totalScore: 0, count: 0 };
      topicMap[r.topic].totalScore += r.score;
      topicMap[r.topic].count++;
    });

    const stats = Object.values(topicMap).map((t) => {
      const avg = t.count > 0 ? Math.round(t.totalScore / t.count) : 0;
      const status = t.count === 0 ? 'Not Attempted' : avg >= 7 ? 'Strong' : avg >= 5 ? 'Improving' : 'Weak';
      return { ...t, avgScore: avg, status };
    });

    const overallAvg = results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
      : 0;

    res.json({ topics: stats, overallAvg, totalQuestionsAnswered: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Theory & Code Mode API
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/coach/theory  — explain a DSA concept
router.post('/theory', auth, async (req, res) => {
  try {
    const { topic, concept } = req.body;
    if (!topic || !concept) return res.status(400).json({ error: 'topic and concept are required' });

    const cacheKey = `theory:${hashPayload(topic + concept)}`;

    const systemPrompt = `You are an expert DSA teacher. When explaining a concept:
1. Give an intuitive real-world analogy first.
2. Explain the concept clearly in simple terms.
3. Show a concrete example with values.
4. Give visual intuition using ASCII art or step-by-step trace (text-based).
5. End with one interview-level question to test understanding.

Return ONLY valid JSON:
{
  "explanation": "...",
  "analogy": "...",
  "example": "...",
  "visualIntuition": "...",
  "interviewQuestion": "..."
}`;

    const userPrompt = `Topic: ${topic}
Concept: ${concept}
Explain this concept for a DSA interview. JSON only.`;

    const result = await callAI(systemPrompt, userPrompt, cacheKey, { maxTokens: 900, maxLines: 60 });
    if (!result.ok) return res.status(503).json({ error: result.text });

    let parsed;
    try {
      const match = result.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : result.text);
    } catch {
      // Fallback: return raw text structured
      parsed = { explanation: result.text, analogy: '', example: '', visualIntuition: '', interviewQuestion: '' };
    }

    // Find matching problems in DB for this topic
    const relatedProblems = await prisma.problem.findMany({
      where: { topic: { name: { contains: topic, mode: 'insensitive' } } },
      select: { id: true, slug: true, title: true, difficulty: true },
      take: 3,
      orderBy: { difficulty: 'asc' },
    });

    res.json({ ...parsed, relatedProblems, topic, concept });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coach/code  — generate clean, explained code for a problem
router.post('/code', auth, async (req, res) => {
  try {
    const { problem, language = 'python', topic } = req.body;
    if (!problem) return res.status(400).json({ error: 'problem is required' });

    const cacheKey = `code:${language}:${hashPayload(problem)}`;

    const systemPrompt = `You are a DSA coding expert. When asked for code:
1. Write clean, well-commented, production-quality code.
2. Use clear variable names.
3. Explain each important step.
4. Always state time and space complexity.

Return ONLY valid JSON:
{
  "code": "# full code here",
  "explanation": "Step by step explanation...",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "keyInsights": ["insight 1", "insight 2"]
}`;

    const userPrompt = `Language: ${language}
Problem/Topic: ${problem}
${topic ? `DSA Topic: ${topic}` : ''}

Write clean, optimized code with explanation. JSON only.`;

    const result = await callAI(systemPrompt, userPrompt, cacheKey, { maxTokens: 900, maxLines: 60 });
    if (!result.ok) return res.status(503).json({ error: result.text });

    let parsed;
    try {
      const match = result.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : result.text);
    } catch {
      parsed = { code: result.text, explanation: '', timeComplexity: '', spaceComplexity: '', keyInsights: [] };
    }

    res.json({ ...parsed, language, problem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
