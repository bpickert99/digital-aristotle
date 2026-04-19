// Project Gutenberg integration — uses HTML version for reliable chapter extraction
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

// ═══════════════════════════════════════════════════════
// FETCH — prefer HTML version for reliable parsing
// ═══════════════════════════════════════════════════════
export async function fetchBook(gutenbergId) {
  // Try HTML versions first — they have proper structure
  const htmlUrls = [
    `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}-images.html`,
    `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.html`,
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}-h/${gutenbergId}-h.htm`,
  ];

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gutenberg: true, urls: htmlUrls })
  });

  if (!res.ok) throw new Error('Failed to fetch book');
  const data = await res.json();
  if (!data.text) throw new Error('No text in response');

  return { content: data.text, isHtml: looksLikeHtml(data.text) };
}

// Backwards compat: some callers still use fetchBookText
export async function fetchBookText(gutenbergId) {
  const { content } = await fetchBook(gutenbergId);
  return content;
}

function looksLikeHtml(text) {
  const head = text.slice(0, 500).toLowerCase();
  return head.includes('<html') || head.includes('<!doctype html') || head.includes('<body');
}

// ═══════════════════════════════════════════════════════
// PARSE — handles both HTML and plain text
// ═══════════════════════════════════════════════════════
export function parseChapters(text) {
  if (looksLikeHtml(text)) {
    return parseChaptersFromHtml(text);
  }
  return parseChaptersFromText(text);
}

// ── HTML parser — uses DOM to find real chapters ──────
function parseChaptersFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Gutenberg HTML typically uses <h2> with id="c1", id="c2", etc.
  // Or <h2 class="chapter"> or similar patterns
  let chapterHeadings = [];

  // Strategy 1: look for h2 elements with id starting with "c" followed by digits
  const allH2 = [...doc.querySelectorAll('h2, h3, h4')];
  chapterHeadings = allH2.filter(h => {
    const id = h.getAttribute('id') || '';
    const text = (h.textContent || '').trim();
    // Real chapter IDs are usually "c1", "c2", "chap01", "chapter-i", etc.
    const isChapterId = /^(c|chap|chapter[-_]?)\d+$/i.test(id) || /^ch\d+$/i.test(id);
    // Or the text starts with "Chapter" and has content after it
    const startsWithChapter = /^(chapter|CHAPTER)\s+[IVXLCDM\d]+/i.test(text);
    return isChapterId || startsWithChapter;
  });

  // Strategy 2: if no h2s matched, look for any anchor with id="c1" through "c99"
  if (chapterHeadings.length < 2) {
    const anchors = [...doc.querySelectorAll('[id]')].filter(el => {
      const id = el.getAttribute('id') || '';
      return /^c\d+$/i.test(id) || /^chap\d+$/i.test(id);
    });
    if (anchors.length >= 2) {
      chapterHeadings = anchors;
    }
  }

  // If still no chapters found, fall back to text parsing
  if (chapterHeadings.length < 2) {
    return parseChaptersFromText(doc.body?.textContent || html);
  }

  // Extract content between each heading and the next
  const chapters = [];
  for (let i = 0; i < chapterHeadings.length; i++) {
    const heading = chapterHeadings[i];
    const nextHeading = chapterHeadings[i + 1];
    const title = cleanChapterTitle(heading.textContent || '', i + 1);

    // Walk sibling elements until we hit the next heading
    const paragraphs = [];
    let node = heading.nextElementSibling;

    while (node && node !== nextHeading) {
      // Stop if we hit a subsequent h2/h3/h4 that's also a chapter marker
      if (chapterHeadings.includes(node)) break;

      const tagName = node.tagName?.toLowerCase();

      // Extract text from paragraphs, blockquotes, divs with text
      if (tagName === 'p' || tagName === 'blockquote') {
        const text = cleanText(node.textContent || '');
        if (text.length > 0) paragraphs.push(text);
      } else if (tagName === 'div' && !node.querySelector('img')) {
        // Generic div with text (but not image containers)
        const text = cleanText(node.textContent || '');
        if (text.length > 20) paragraphs.push(text);
      }

      node = node.nextElementSibling;
    }

    const content = paragraphs.join('\n\n');
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // Skip chapters with no real content (likely malformed)
    if (wordCount < 100) continue;

    chapters.push({
      index: chapters.length,
      title: title,
      content: content,
      wordCount: wordCount,
      readingMinutes: Math.ceil(wordCount / 250)
    });
  }

  if (chapters.length >= 2) return chapters;
  return parseChaptersFromText(doc.body?.textContent || html);
}

function cleanChapterTitle(rawTitle, fallbackNumber) {
  let title = cleanText(rawTitle);
  if (!title || title.length > 120) {
    return `Chapter ${fallbackNumber}`;
  }
  return title;
}

function cleanText(s) {
  return String(s || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\[[^\]]*\]/g, '') // remove [Illustration] markers
    .trim();
}

// ── Plain text parser (fallback) ──────────────────────
function parseChaptersFromText(text) {
  const body = stripBoilerplate(text);

  // Match chapter markers
  const chapterRegex = /^(?:CHAPTER|Chapter)\s+([IVXLCDM]+|\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\.?\s*(.*)$/gm;
  const markers = [...body.matchAll(chapterRegex)];

  if (markers.length < 2) return chunkByWordCount(body, 3000);

  const candidates = [];
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    const start = m.index;
    const end = i + 1 < markers.length ? markers[i + 1].index : body.length;
    const full = body.slice(start, end).trim();
    const headingLine = m[0].trim();
    const content = full.slice(headingLine.length).trim();
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    candidates.push({ headingLine, content, wordCount, number: m[1], titleAfter: (m[2] || '').trim() });
  }

  // Real chapters have substantial prose
  const real = candidates.filter(c => c.wordCount >= 500);

  if (real.length >= 2) {
    return real.map((c, i) => ({
      index: i,
      title: buildChapterTitle(c),
      content: c.content,
      wordCount: c.wordCount,
      readingMinutes: Math.ceil(c.wordCount / 250)
    }));
  }

  return chunkByWordCount(body, 3000);
}

function buildChapterTitle(c) {
  const num = c.number;
  const label = /^\d+$/.test(num) ? `Chapter ${num}`
    : /^[IVXLCDM]+$/i.test(num) ? `Chapter ${num.toUpperCase()}`
    : `Chapter ${num.charAt(0).toUpperCase() + num.slice(1).toLowerCase()}`;

  if (c.titleAfter && c.titleAfter.length > 0 && c.titleAfter.length < 80) {
    const subtitle = c.titleAfter.replace(/\s+/g, ' ').replace(/[.—–-]+$/, '').trim();
    if (subtitle) return `${label}: ${subtitle}`;
  }
  return label;
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

function chunkByWordCount(body, chunkSize) {
  const words  = body.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    const content = words.slice(i, i + chunkSize).join(' ');
    const wc = Math.min(chunkSize, words.length - i);
    chunks.push({
      index: chunks.length,
      title: `Part ${chunks.length + 1}`,
      content: content,
      wordCount: wc,
      readingMinutes: Math.ceil(wc / 250)
    });
  }
  return chunks;
}
