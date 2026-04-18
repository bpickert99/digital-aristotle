// ── Set this to your Cloudflare Worker URL ────────────
const WORKER_URL = 'https://flat-boat-7a4b.bpickert99.workers.dev
';
// ─────────────────────────────────────────────────────

const CURRICULUM_SCHEMA = `{
  "units": [
    {
      "id": "string (short-slug, e.g. 'french-revolution-1')",
      "title": "string",
      "subject": "string (e.g. 'History & Politics')",
      "track": "humanities | science | math | social | arts",
      "description": "string (2 sentences, adult register)",
      "totalLessons": number,
      "disciplineTags": ["string"],
      "lesson": {
        "id": "string (slug)",
        "title": "string",
        "estimatedMinutes": number,
        "hook": "string (2-3 sentences, creates genuine curiosity, no spoilers)",
        "sections": [
          {
            "title": "string (3-5 words, evocative not explanatory)",
            "content": "string (3-5 paragraphs of adult prose, no bullet points, no headers inside)"
          }
        ],
        "pullQuote": "string (the essay's single sharpest sentence, used as a block pull quote)",
        "checkpointPrompt": "string (a question requiring the student to generate a prediction or reflection before continuing)",
        "questions": [
          {
            "id": "string",
            "type": "comprehension | analysis | connection | prose",
            "question": "string",
            "format": "multiple-choice | short-answer",
            "options": ["string"] or null,
            "correctIndex": number or null,
            "answer": "string (for short-answer, the ideal answer framework)",
            "explanation": "string (why this is correct, what a wrong answer typically misses)"
          }
        ]
      }
    }
  ]
}`;

const SYSTEM_PROMPT = `You are the curriculum engine for Aristotle, an adult education app. Your task is to select 2 starting units for a new user and generate the first lesson for each, based on their onboarding profile.

UNIT SELECTION RULES:
- Unit 1 must be from humanities, arts, literature, history, philosophy, or cultural studies.
- Unit 2 must be from natural sciences, mathematics, social sciences (psychology, economics, anthropology), or formal sciences.
- Select genuinely interesting entry points — not survey courses or overviews. Start in the middle of something real.
- Match difficulty to the user's stated prior knowledge.
- Honor stated interests while allowing for productive surprise. If someone says they love history, a unit on the history of mathematics is a better second unit than an introductory physics overview.
- Avoid any topics the user has asked to avoid.

LESSON QUALITY STANDARDS:
- Write for intelligent adults. The register is a serious magazine essay, not a textbook.
- No exclamation points anywhere in lesson content.
- Never write "let us explore", "in this lesson", "today we will", or any similar framing.
- Hooks create genuine curiosity through a specific, concrete detail or an unresolved tension — not a summary of what follows.
- Essay sections should sound like a knowledgeable person talking, not a Wikipedia article.
- Questions must test analysis, connection, or close reading — not recall of facts just stated.
- At least one question must ask the student to draw a connection to their own experience, prior knowledge, or current events.
- For literature units, one question must engage with prose style or composition, not just content.
- Short-answer questions should be open enough that a thoughtful partial answer is valid.
- Multiple-choice questions should have 4 options with one clearly best answer and distractors that represent real misconceptions.

PROSE STYLE:
- Active voice, subordinate clauses, precision.
- Section prose should be 3-5 paragraphs per section.
- Pull quote should be the single most arresting sentence in the entire essay — the one that earns the lesson's place in the curriculum.
- Total lesson reading time (hook + all sections) should match estimatedMinutes minus 8 minutes for questions.

Return ONLY valid JSON matching the schema exactly. No markdown, no commentary, no code fences.`;

function buildUserPrompt(onboarding) {
  return `USER ONBOARDING PROFILE:
Interests: ${onboarding.interests?.join(', ') || 'Not specified'}
Prior knowledge areas: ${onboarding.foundation?.join(', ') || 'None specified'}
Mathematics comfort: ${onboarding.mathComfort || 'Not specified'}
Things that have stayed with them: ${onboarding.personal?.filter(Boolean).join('; ') || 'Not provided'}
Topics to avoid: ${onboarding.avoid || 'None'}

Return exactly 2 units in JSON format matching this schema:
${CURRICULUM_SCHEMA}`;
}

export async function generateCurriculum(onboarding) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
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

  if (!res.ok) {
    throw new Error(`Worker returned ${res.status}`);
  }

  const data    = await res.json();
  const text    = data.content?.[0]?.text || '';
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse curriculum JSON from Claude response');
  }
}
