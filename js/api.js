const WORKER_URL = 'https://flat-boat-7a4b.bpickert99.workers.dev';

const CURRICULUM_SCHEMA = `{
  "units": [
    {
      "id": "short-slug",
      "title": "string",
      "subject": "string",
      "track": "humanities | science | math | social | arts",
      "description": "string (2 sentences max)",
      "totalLessons": number,
      "disciplineTags": ["string"],
      "lesson": {
        "id": "string",
        "title": "string",
        "estimatedMinutes": number,
        "hook": "string (2-3 sentences only)",
        "sections": [
          {
            "title": "string (3-5 words)",
            "content": "string (2-3 paragraphs of prose)"
          }
        ],
        "pullQuote": "string (one sentence from the essay)",
        "checkpointPrompt": "string (one question)",
        "questions": [
          {
            "id": "string",
            "type": "comprehension | analysis | connection | prose",
            "question": "string",
            "format": "multiple-choice | short-answer",
            "options": ["string", "string", "string", "string"],
            "correctIndex": number,
            "answer": "string",
            "explanation": "string (2 sentences max)"
          }
        ]
      }
    }
  ]
}`;

const SYSTEM_PROMPT = `You are the curriculum engine for Aristotle, an adult education app. Select 2 starting units for a new user and generate the first lesson for each.

CRITICAL: Keep your entire JSON response under 4000 tokens. Be concise. Each section: 2 short paragraphs only.

UNIT SELECTION:
- Unit 1: humanities, history, literature, philosophy, or arts
- Unit 2: natural sciences, mathematics, social sciences, or formal sciences
- Pick genuinely interesting entry points, not surveys. Match user interests.

LESSON STANDARDS:
- Adult register, serious and direct. No exclamation points.
- No "let us explore" or "in this lesson" or "today we will"
- Exactly 3 sections, exactly 4 questions per lesson
- Multiple-choice: exactly 4 options, correctIndex is 0-3
- Questions test analysis and connection, not recall

Return ONLY valid JSON. No markdown fences, no commentary, no extra text before or after the JSON.`;

function buildUserPrompt(onboarding) {
  return `USER INTERESTS (ranked): ${onboarding.interests?.join(', ') || 'general'}

Return exactly 2 units matching this schema:
${CURRICULUM_SCHEMA}`;
}

export async function generateCurriculum(onboarding) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 4500,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(onboarding) }
    ]
  };

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    const detail = data?.error?.message || data?.message || JSON.stringify(data);
    throw new Error(`Anthropic error (${res.status}): ${detail}`);
  }

  const text = data.content?.[0]?.text || '';
  console.log('Claude response preview:', text.substring(0, 300));

  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.units || !Array.isArray(parsed.units)) {
      throw new Error('Response missing units array. Got: ' + text.substring(0, 200));
    }
    return parsed;
  } catch (e) {
    console.error('Full Claude response:', text);
    throw new Error('Parse failed: ' + e.message);
  }
}
