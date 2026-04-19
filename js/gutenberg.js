// Project Gutenberg integration
const WORKER_URL = 'https://flat-boat-7a4b.bpickert99.workers.dev';

export const GUTENBERG_BOOKS = [
  { id: 1342,  title: 'Pride and Prejudice',        author: 'Jane Austen',           level: 3, tags: ['literature', 'romance', 'social'] },
  { id: 98,    title: 'A Tale of Two Cities',       author: 'Charles Dickens',       level: 3, tags: ['literature', 'history', 'revolution'] },
  { id: 2701,  title: 'Moby Dick',                  author: 'Herman Melville',       level: 4, tags: ['literature', 'nature', 'obsession'] },
  { id: 1661,  title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', level: 2, tags: ['literature', 'mystery', 'logic'] },
  { id: 11,    title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll',   level: 2, tags: ['literature', 'philosophy', 'whimsy'] },
  { id: 74,    title: 'The Adventures of Tom Sawyer', author: 'Mark Twain',          level: 2, tags: ['literature', 'history', 'american'] },
  { id: 76,    title: 'Adventures of Huckleberry Finn', author: 'Mark Twain',        level: 2, tags: ['literature', 'history', 'american'] },
  { id: 1400,  title: 'Great Expectations',         author: 'Charles Dickens',       level: 3, tags: ['literature', 'social', 'identity'] },
  { id: 84,    title: 'Frankenstein',               author: 'Mary Shelley',          level: 3, tags: ['literature', 'science', 'philosophy'] },
  { id: 174,   title: 'The Picture of Dorian Gray', author: 'Oscar Wilde',           level: 3, tags: ['literature', 'philosophy', 'aesthetics'] },
  { id: 2554,  title: 'Crime and Punishment',       author: 'Fyodor Dostoevsky',     level: 4, tags: ['literature', 'psychology', 'ethics'] },
  { id: 1232,  title: 'The Prince',                 author: 'Niccolò Machiavelli',   level: 3, tags: ['political theory', 'history', 'power'] },
  { id: 2680,  title: 'Meditations',                author: 'Marcus Aurelius',       level: 3, tags: ['philosophy', 'stoicism', 'self'] },
  { id: 1497,  title: 'The Republic',               author: 'Plato',                 level: 4, tags: ['philosophy', 'politics', 'justice'] },
  { id: 4363,  title: 'Beyond Good and Evil',       author: 'Friedrich Nietzsche',   level: 4, tags: ['philosophy', 'ethics', 'power'] },
  { id: 5200,  title: 'Metamorphosis',              author: 'Franz Kafka',           level: 3, tags: ['literature', 'philosophy', 'alienation'] },
  { id: 1952,  title: 'The Yellow Wallpaper',       author: 'Charlotte Perkins Gilman', level: 2, tags: ['literature', 'psychology', 'gender'] },
];

export function selectBook(vocabLevel, interests = []) {
  const pool = GUTENBERG_BOOKS.filter(b => Math.abs(b.level - vocabLevel) <= 2);
  const scored = (pool.length ? pool : GUTENBERG_BOOKS).map(b => ({
    ...b,
    score: interests.filter(i => b.tags.includes(i)).length * 2 - Math.abs(b.level - vocabLevel)
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(3, scored.length));
  return top[Math.floor(Math.random() * top.length)];
}

export async function fetchBookText(gutenbergId) {
  const urls = [
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}-0.txt`,
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}.txt`,
    `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`,
  ];

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gutenberg: true, urls })
  });

  if (!res.ok) throw new Error('Failed to fetch book text');
  const data = await res.json();
  if (!data.text) throw new Error('No text in response');
  return data.text;
}

// ═══════════════════════════════════════════════════════
// CHAPTER PARSING — robust TOC detection
// ═══════════════════════════════════════════════════════
export function parseChapters(text) {
  // Strip Gutenberg boilerplate
  let body = stripBoilerplate(text);

  // Find the start of real content by identifying chapter markers
  // and picking the one that's actually followed by prose (not more markers)
  const realStart = findRealStoryStart(body);
  body = body.slice(realStart);

  // Now parse chapters from the real story
  const chapters = extractChapters(body);

  if (chapters.length >= 2) return chapters;

  // Fallback: chunk the body into ~3000-word segments
  return chunkByWordCount(body, 3000);
}

function stripBoilerplate(text) {
  let start = 0;
  let end   = text.length;

  const startMarkers = [
    /\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG[^*]*\*\*\*/i,
    /\*\*\*START OF THE PROJECT GUTENBERG[^*]*\*\*\*/i,
  ];
  const endMarkers = [
    /\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i,
    /\*\*\*END OF THE PROJECT GUTENBERG/i,
  ];

  for (const m of startMarkers) {
    const match = text.match(m);
    if (match) { start = match.index + match[0].length; break; }
  }
  for (const m of endMarkers) {
    const match = text.match(m);
    if (match) { end = match.index; break; }
  }

  return text.slice(start, end).trim();
}

// Find where the actual story begins, skipping TOC, illustrations list, preface etc.
function findRealStoryStart(body) {
  // Find all "Chapter 1" / "Chapter I" / "Chapter One" markers
  const pattern = /\n\s*(CHAPTER\s+I\b[^IVX]|CHAPTER\s+1\b|CHAPTER\s+ONE\b|Chapter\s+I\b[^IVX]|Chapter\s+1\b|Chapter\s+One\b)/g;
  const matches = [...body.matchAll(pattern)];

  if (matches.length === 0) return 0;
  if (matches.length === 1) return matches[0].index;

  // For each candidate, check if the following content looks like prose
  // (not another chapter marker within 500 chars — that would mean it's a TOC entry)
  for (const match of matches) {
    const afterStart = match.index + match[0].length;
    const nextChunk  = body.slice(afterStart, afterStart + 2000);

    // Count chapter markers in the next 2000 chars
    // In a TOC, Chapter II would appear within a few hundred chars
    // In real prose, Chapter II comes thousands of chars later
    const nextMarkers = nextChunk.match(/\b(CHAPTER\s+(II|2|TWO|III|3)\b|Chapter\s+(II|2|Two|III|3)\b)/gi);
    const nextMarkerCount = nextMarkers ? nextMarkers.length : 0;

    // Also check for indicators of prose
    const hasProseIndicators = /[.!?]\s+[A-Z][a-z]{4,}/g.test(nextChunk);
    const wordCount = nextChunk.split(/\s+/).length;

    // Real chapter: lots of words, proper sentence structure, no nearby chapter markers
    if (nextMarkerCount === 0 && hasProseIndicators && wordCount > 200) {
      return match.index;
    }
  }

  // Fallback: use the last candidate — TOCs come first, story comes last
  return matches[matches.length - 1].index;
}

function extractChapters(body) {
  // Common chapter heading patterns
  const headingPatterns = [
    /^CHAPTER\s+[IVXLCDM]+[\.\s]*[A-Z][^\n]*$/gim,
    /^CHAPTER\s+\d+[\.\s]*[A-Z][^\n]*$/gim,
    /^CHAPTER\s+[IVXLCDM]+\s*$/gim,
    /^CHAPTER\s+\d+\s*$/gim,
    /^Chapter\s+[IVXLCDM]+[\.\s]*$/gm,
    /^Chapter\s+\d+[\.\s]*$/gm,
  ];

  for (const pattern of headingPatterns) {
    const matches = [...body.matchAll(pattern)];
    if (matches.length >= 2) {
      const chapters = [];

      for (let i = 0; i < matches.length; i++) {
        const chStart   = matches[i].index;
        const chEnd     = i + 1 < matches.length ? matches[i + 1].index : body.length;
        const rawContent = body.slice(chStart, chEnd).trim();
        const rawTitle  = matches[i][0].trim();

        // Clean up title — take first line only
        const title = rawTitle.split('\n')[0].trim();

        // Remove the heading from content, keep rest
        const content = rawContent.slice(rawTitle.length).trim();
        const wordCount = content.split(/\s+/).filter(Boolean).length;

        // Skip if content is too short to be a real chapter
        if (wordCount < 400) continue;

        // Skip if content is mostly short lines (likely a TOC section)
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
          const avgLineLen  = lines.reduce((s, l) => s + l.trim().length, 0) / lines.length;
          if (avgLineLen < 40) continue; // looks like a list, not prose
        }

        chapters.push({
          index:          chapters.length,
          title:          title,
          content:        content,
          wordCount:      wordCount,
          readingMinutes: Math.ceil(wordCount / 250)
        });
      }

      if (chapters.length >= 2) return chapters;
    }
  }

  return [];
}

function chunkByWordCount(body, chunkSize) {
  const words  = body.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    const content = words.slice(i, i + chunkSize).join(' ');
    const wc = Math.min(chunkSize, words.length - i);
    chunks.push({
      index:          chunks.length,
      title:          `Part ${chunks.length + 1}`,
      content:        content,
      wordCount:      wc,
      readingMinutes: Math.ceil(wc / 250)
    });
  }
  return chunks;
}
