const WORKER_URL = 'https://flat-boat-7a4b.bpickert99.workers.dev';

const UNIT_SCHEMA = `{
  "id": "short-slug",
  "title": "string",
  "subject": "string",
  "track": "humanities | science | math | social | arts",
  "description": "string (2 sentences)",
  "totalLessons": 8,
  "disciplineTags": ["string"],
  "lesson": {
    "id": "string",
    "title": "string",
    "estimatedMinutes": 25,
    "hook": "string (2 sentences)",
    "sections": [
      { "title": "string (4 words)", "content": "string (2 paragraphs)" },
      { "title": "string (4 words)", "content": "string (2 paragraphs)" },
      { "title": "string (4 words)", "content": "string (2 paragraphs)" }
    ],
    "pullQuote": "string (one sentence)",
    "checkpointPrompt": "string (one question)",
    "questions": [
      { "id": "q1", "type": "comprehension", "question": "string", "format": "multiple-choice", "options": ["A","B","C","D"], "correctIndex": 0, "answer": "string", "explanation": "string" },
      { "id": "q2", "type": "analysis", "question": "string", "format": "short-answer", "options": null, "correctIndex": null, "answer": "string", "explanation": "string" },
      { "id": "q3", "type": "connection", "question": "string", "format": "short-answer", "options": null, "correctIndex": null, "answer": "string", "explanation": "string" },
      { "id": "q4", "type": "prose", "question": "string", "format": "short-answer", "options": null, "correctIndex": null, "answer": "string", "explanation": "string" }
    ]
  }
}`;

const SYSTEM_PROMPT = `You are a curriculum engine for Aristotle, an adult education app. Generate exactly ONE unit with its first lesson.

RULES:
- Adult register, serious and direct. No exclamation points.
- No "let us explore" or "in this lesson"
- Section content: exactly 2 paragraphs, 3-4 sentences each
- Hook: exactly 2 sentences
- Questions: short, under 25 words each
- Return ONLY valid JSON matching the schema. No markdown, no extra text.`;

async function callWorker(prompt) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 3500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  };

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    const detail = data?.error?.message || JSON.stringify(data);
    throw new Error(`Anthropic error (${res.status}): ${detail}`);
  }

  const text = data.content?.[0]?.text || '';
  console.log('Claude response (' + text.length + ' chars):', text.substring(0, 200));

  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Parse failed. Full response:', text);
    throw new Error('Parse failed: ' + e.message);
  }
}

export async function generateCurriculum(onboarding) {
  const interests = onboarding.interests?.join(', ') || 'general';

  const prompt1 = `User interests (ranked): ${interests}

Generate ONE humanities/history/literature/philosophy/arts unit — pick the most interesting entry point based on their interests.

Return exactly this JSON structure:
${UNIT_SCHEMA}`;

  const prompt2 = `User interests (ranked): ${interests}

Generate ONE science/mathematics/social-science unit — pick something that complements the user's interests from a different angle.

Return exactly this JSON structure:
${UNIT_SCHEMA}`;

  console.log('Generating unit 1...');
  const unit1 = await callWorker(prompt1);

  console.log('Generating unit 2...');
  const unit2 = await callWorker(prompt2);

  return { units: [unit1, unit2] };
}

// ── Generate chapters for a unit ─────────────────────
export async function generateChapters(unit) {
  const prompt = `Given this educational unit, break it into 4 themed chapters.
Unit title: ${unit.title}
Unit description: ${unit.description}
Track: ${unit.track}

Return JSON array only:
[
  { "title": "Chapter title (evocative, 3-5 words)", "theme": "One sentence describing this chapter's focus", "lessonCount": 2 },
  { "title": "...", "theme": "...", "lessonCount": 2 },
  { "title": "...", "theme": "...", "lessonCount": 2 },
  { "title": "...", "theme": "...", "lessonCount": 2 }
]`;

  return callWorker(prompt);
}

// ── Generate post-reading reflection questions ────────
export async function generateReflectionQuestions(chapter, book) {
  const preview = chapter.content.substring(0, 1500);

  const prompt = `Generate 3 reflection questions for this book chapter.
Book: ${book.title} by ${book.author}
Chapter: ${chapter.title}
Chapter opening: ${preview}...

Return JSON array only:
[
  { "id": "r1", "question": "string", "type": "comprehension" },
  { "id": "r2", "question": "string", "type": "analysis" },
  { "id": "r3", "question": "string", "type": "connection" }
]

Rules:
- Questions engage the actual content of this chapter
- Analysis question asks about prose, structure, or character
- Connection question links to broader ideas or the reader's life
- No "In this chapter..." openings
- Under 30 words each`;

  return callWorker(prompt);
}

// ── Generate next path nodes ──────────────────────────
// Called when user is within 2 nodes of the end of generated path
export async function generatePathNodes(completedNodes, interests, struggles, count = 3) {
  const recentSubjects  = completedNodes.slice(-4).map(n => n.subject).join(', ');
  const struggleTopics  = Object.entries(struggles)
    .filter(([, v]) => v.rate < 0.5)
    .map(([k]) => k).join(', ');

  const prompt = `Generate ${count} new lesson nodes for an adaptive learning path.

Recent lessons covered: ${recentSubjects || 'none yet'}
User interest ranking: ${interests?.join(', ') || 'general'}
Struggling with: ${struggleTopics || 'nothing identified yet'}

Rules:
- Ensure discipline variety — do not repeat the same subject twice in a row
- Every 4-5 nodes, include a STEM lesson (math, science, logic)
- If user is struggling with something, include a reinforcement node
- Each node should feel like a natural next step, not random
- Occasionally surface something surprising that connects to recent topics

Return JSON array only:
[
  {
    "id": "unique-slug",
    "title": "Lesson title (evocative, not descriptive)",
    "subject": "e.g. History",
    "track": "humanities|science|math|social|arts",
    "sublabel": "One phrase describing the lesson angle",
    "lesson": {
      "id": "slug",
      "title": "string",
      "estimatedMinutes": 25,
      "hook": "2 sentences",
      "sections": [
        {"title": "4 words", "content": "2 paragraphs"},
        {"title": "4 words", "content": "2 paragraphs"},
        {"title": "4 words", "content": "2 paragraphs"}
      ],
      "pullQuote": "one sentence",
      "checkpointPrompt": "one question",
      "questions": [
        {"id":"q1","type":"comprehension","question":"string","format":"multiple-choice","options":["A","B","C","D"],"correctIndex":0,"answer":"string","explanation":"string"},
        {"id":"q2","type":"analysis","question":"string","format":"short-answer","options":null,"correctIndex":null,"answer":"string","explanation":"string"},
        {"id":"q3","type":"connection","question":"string","format":"short-answer","options":null,"correctIndex":null,"answer":"string","explanation":"string"},
        {"id":"q4","type":"prose","question":"string","format":"short-answer","options":null,"correctIndex":null,"answer":"string","explanation":"string"}
      ]
    }
  }
]`;

  return callWorker(prompt);
}

// ── Generate entrance quiz for a topic ────────────────
export async function generateEntranceQuiz(topic, track) {
  const prompt = `Generate a 5-question entrance quiz to assess prior knowledge of: ${topic} (${track})

Questions should reveal understanding, not just recall.
Include an "I don't know" option conceptually — use open-ended questions where possible.

Return JSON array only:
[
  {
    "id": "eq1",
    "question": "string (open-ended, assesses genuine understanding)",
    "format": "multiple-choice|short-answer",
    "options": ["A","B","C","D"] or null,
    "correctIndex": number or null,
    "answer": "string",
    "explanation": "string (brief)"
  }
]`;

  return callWorker(prompt);
}
