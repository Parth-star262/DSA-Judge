const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// ── Rate Limiter (stays safely under Gemini free-tier 15 RPM) ──────────────
const RATE_LIMIT = { maxRequests: 12, windowMs: 60_000 };
const requestTimestamps = [];
const RESPONSE_CACHE_TTL_MS = 60 * 60 * 1000;
const responseCache = new Map();

const clipText = (value, maxLength) => String(value || '').slice(0, maxLength);

const limitToShortResponse = (text) => {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);

  return lines.slice(0, 5).join('\n').trim();
};

const checkRateLimit = () => {
  const now = Date.now();
  while (requestTimestamps.length && requestTimestamps[0] < now - RATE_LIMIT.windowMs) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_LIMIT.maxRequests) {
    return false;
  }
  requestTimestamps.push(now);
  return true;
};

const getCachedResponse = (cacheKey) => {
  if (!cacheKey) return null;

  const cached = responseCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }

  return cached.text;
};

const setCachedResponse = (cacheKey, text) => {
  if (!cacheKey) return;
  responseCache.set(cacheKey, {
    text,
    expiresAt: Date.now() + RESPONSE_CACHE_TTL_MS,
  });
};

// ── Gemini Client ──────────────────────────────────────────────────────────
let model = null;

const getModel = () => {
  if (model) return model;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
  return model;
};

// ── Groq Client ─────────────────────────────────────────────────────────────
let groqClient = null;

const getGroq = () => {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  groqClient = new Groq({ apiKey });
  return groqClient;
};

// ── Shared call wrapper (with Groq Fallback) ─────────────────────────────────
const callAI = async (systemPrompt, userPrompt, cacheKey) => {
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return { ok: true, text: cached, cached: true };
  }

  // Try Gemini First
  const m = getModel();
  if (m && checkRateLimit()) {
    try {
      const result = await m.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          maxOutputTokens: 220,
          temperature: 0.3,
        },
      });
      const text = limitToShortResponse(result?.response?.text?.() || '');
      if (text) {
        setCachedResponse(cacheKey, text);
        return { ok: true, text };
      }
    } catch (err) {
      console.warn('[AI Service] Gemini failed, trying Groq fallback:', err?.message || err);
    }
  }

  // Try Groq Fallback
  const groq = getGroq();
  if (groq) {
    try {
      const chat = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 220,
        temperature: 0.3,
      });
      const text = limitToShortResponse(chat.choices[0]?.message?.content || '');
      if (text) {
        setCachedResponse(cacheKey, text);
        return { ok: true, text };
      }
    } catch (err) {
      console.error('[AI Service] Groq fallback failed:', err?.message || err);
    }
  }

  return { ok: false, text: 'AI service temporarily unavailable. Please try again later.' };
};

// ═══════════════════════════════════════════════════════════════════════════
//  1. AI HINT — gives a nudge, never the full solution
// ═══════════════════════════════════════════════════════════════════════════
const HINT_SYSTEM = `You are a concise DSA tutor on a coding judge platform.
The user is stuck on a problem and wants a hint — NOT the full solution.

Rules:
- Give exactly 2-4 lines of guidance.
- Mention the right data structure or algorithmic technique to consider.
- If the user's code has a clear directional mistake, point it out briefly.
- NEVER write code. NEVER give the full solution. NEVER give pseudo-code.
- Be encouraging but direct.
- Use plain text, no markdown headers.`;

const getAIHint = async ({ problemTitle, problemDescription, constraints, difficulty, code, language, cacheKey }) => {
  const userPrompt = `Problem: "${problemTitle}" [${difficulty}]
Description: ${clipText(problemDescription, 800)}
Constraints: ${clipText(constraints, 300)}
Language: ${language}

User's current code:
\`\`\`
${clipText(code, 1500)}
\`\`\`

Give a short, precise hint to help them move forward.`;

  return callAI(HINT_SYSTEM, userPrompt, cacheKey);
};

// ═══════════════════════════════════════════════════════════════════════════
//  2. AI CODE REVIEW — precise feedback after run/submit
// ═══════════════════════════════════════════════════════════════════════════
const REVIEW_SYSTEM = `You are a sharp code reviewer on a competitive programming judge.
The user just ran or submitted their code and got a verdict.

Rules:
- Give exactly 2-4 lines of precise, actionable feedback.
- If ACCEPTED: briefly praise and mention complexity or possible optimization.
- If WRONG_ANSWER: identify the likely logical bug without revealing the fix.
- If TLE: suggest the right complexity class and what approach to consider.
- If RUNTIME_ERROR: identify the likely crash cause (null, bounds, overflow, etc.).
- NEVER write code. NEVER give the full solution.
- Be direct and technical.
- Use plain text, no markdown headers.`;

const getAICodeReview = async ({ problemTitle, difficulty, code, language, verdict, score, passedCases, totalCases, complexityEstimate, cacheKey }) => {
  const userPrompt = `Problem: "${problemTitle}" [${difficulty}]
Language: ${language}
Verdict: ${verdict} (${passedCases}/${totalCases} passed, score ${score}%)
${complexityEstimate ? `Estimated complexity: ${complexityEstimate}` : ''}

Code:
\`\`\`
${clipText(code, 1500)}
\`\`\`

Give precise, short feedback on this submission.`;

  return callAI(REVIEW_SYSTEM, userPrompt, cacheKey);
};

// ═══════════════════════════════════════════════════════════════════════════
//  3. AI DEBUG — explains why a specific test case failed
// ═══════════════════════════════════════════════════════════════════════════
const DEBUG_SYSTEM = `You are a debugging assistant on a coding judge platform.
A user's code failed a test case. You can see the input, expected output, and actual output.

Rules:
- In 2-4 lines, explain WHY the output is wrong for this specific input.
- Identify the logical error or edge case the code doesn't handle.
- Do NOT write corrected code. Do NOT give the solution.
- Be specific about what the code does wrong on this input.
- Use plain text, no markdown headers.`;

const getAIDebugHelp = async ({ problemTitle, code, language, input, expectedOutput, actualOutput, stderr, cacheKey }) => {
  const userPrompt = `Problem: "${problemTitle}"
Language: ${language}

Code:
\`\`\`
${clipText(code, 1500)}
\`\`\`

Test case input: ${clipText(input, 500)}
Expected output: ${clipText(expectedOutput, 300)}
Actual output: ${clipText(actualOutput || '(empty)', 300)}
${stderr ? `Stderr: ${clipText(stderr, 300)}` : ''}

Explain why this test case fails.`;

  return callAI(DEBUG_SYSTEM, userPrompt, cacheKey);
};

module.exports = { getAIHint, getAICodeReview, getAIDebugHelp, callAI };

