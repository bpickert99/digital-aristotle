// Project Gutenberg integration
// Fetches and parses books via the Cloudflare Worker proxy

const WORKER_URL = 'https://flat-boat-7a4b.bpickert99.workers.dev';

// Gutenberg book list: curated titles with IDs, difficulty level, and genre tags
// Level matches vocab levels 1-5
export const GUTENBERG_BOOKS = [
  // Level 2-3
  { id: 1342,  title: 'Pride and Prejudice',        author: 'Jane Austen',           level: 3, tags: ['literature', 'romance', 'social'] },
  { id: 98,    title: 'A Tale of Two Cities',        author: 'Charles Dickens',       level: 3, tags: ['literature', 'history', 'revolution'] },
  { id: 2701,  title: 'Moby Dick',                   author: 'Herman Melville',       level: 4, tags: ['literature', 'nature', 'obsession'] },
  { id: 1661,  title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', level: 2, tags: ['literature', 'mystery', 'logic'] },
  { id: 11,    title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll',   level: 2, tags: ['literature', 'philosophy', 'whimsy'] },
  { id: 74,    title: 'The Adventures of Tom Sawyer', author: 'Mark Twain',          level: 2, tags: ['literature', 'history', 'american'] },
  { id: 76,    title: 'Adventures of Huckleberry Finn', author: 'Mark Twain',        level: 2, tags: ['literature', 'history', 'american'] },
  { id: 1400,  title: 'Great Expectations',          author: 'Charles Dickens',       level: 3, tags: ['literature', 'social', 'identity'] },
  { id: 84,    title: 'Frankenstein',                author: 'Mary Shelley',          level: 3, tags: ['literature', 'science', 'philosophy'] },
  { id: 2600,  title: 'War and Peace',               author: 'Leo Tolstoy',           level: 4, tags: ['literature', 'history', 'russia'] },
  { id: 1952,  title: 'The Yellow Wallpaper',        author: 'Charlotte Perkins Gilman', level: 2, tags: ['literature', 'psychology', 'gender'] },
  { id: 174,   title: 'The Picture of Dorian Gray',  author: 'Oscar Wilde',           level: 3, tags: ['literature', 'philosophy', 'aesthetics'] },
  { id: 1080,  title: 'A Modest Proposal',           author: 'Jonathan Swift',        level: 3, tags: ['literature', 'politics', 'satire'] },
  { id: 2814,  title: 'Dubliners',                   author: 'James Joyce',           level: 4, tags: ['literature', 'ireland', 'modernism'] },
  { id: 5200,  title: 'Metamorphosis',               author: 'Franz Kafka',           level: 3, tags: ['literature', 'philosophy', 'alienation'] },
  { id: 28054, title: 'Brothers Karamazov',          author: 'Fyodor Dostoevsky',     level: 5, tags: ['literature', 'philosophy', 'religion'] },
  { id: 2554,  title: 'Crime and Punishment',        author: 'Fyodor Dostoevsky',     level: 4, tags: ['literature', 'psychology', 'ethics'] },
  { id: 1232,  title: 'The Prince',                  author: 'Niccolò Machiavelli',   level: 3, tags: ['political theory', 'history', 'power'] },
  { id: 61,    title: 'The Communist Manifesto',     author: 'Karl Marx',             level: 3, tags: ['political theory', 'economics', 'history'] },
  { id: 2680,  title: 'Meditations',                 author: 'Marcus Aurelius',       level: 3, tags: ['philosophy', 'stoicism', 'self'] },
  { id: 1497,  title: 'The Republic',                author: 'Plato',                 level: 4, tags: ['philosophy', 'politics', 'justice'] },
  { id: 4363,  title: 'Beyond Good and Evil',        author: 'Friedrich Nietzsche',   level: 4, tags: ['philosophy', 'ethics', 'power'] },
];

// Select a book for a user based on vocab level and interests
export function selectBook(vocabLevel, interests = []) {
  const candidates = GUTENBERG_BOOKS.filter(b => {
    const levelOk = Math.abs(b.level - vocabLevel) <= 1;
    const tagMatch = interests.some(i => b.tags.includes(i));
    return levelOk || tagMatch;
  });

  const pool = candidates.length > 0 ? candidates : GUTENBERG_BOOKS;

  // Score by interest match + level proximity
  const scored = pool.map(b => ({
    ...b,
    score: interests.filter(i => b.tags.includes(i)).length * 2
           - Math.abs(b.level - vocabLevel)
  }));

  scored.sort((a, b) => b.score - a.score);

  // Pick from top 3 randomly to add variety
  const top = scored.slice(0, Math.min(3, scored.length));
  return top[Math.floor(Math.random() * top.length)];
}

// Fetch raw text of a Gutenberg book via the Worker proxy
export async function fetchBookText(gutenbergId) {
  // Try the standard plain text URL formats
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

// Parse chapters from raw Gutenberg text
export function parseChapters(text) {
  // Strip Gutenberg header/footer
  const startMarkers = [
    /\*\*\* START OF (THE|THIS) PROJECT GUTENBERG/i,
    /\*\*\*START OF THE PROJECT GUTENBERG/i,
  ];
  const endMarkers = [
    /\*\*\* END OF (THE|THIS) PROJECT GUTENBERG/i,
    /\*\*\*END OF THE PROJECT GUTENBERG/i,
  ];

  let start = 0;
  let end   = text.length;

  for (const m of startMarkers) {
    const match = text.match(m);
    if (match) { start = match.index + match[0].length; break; }
  }
  for (const m of endMarkers) {
    const match = text.match(m);
    if (match) { end = match.index; break; }
  }

  let body = text.slice(start, end).trim();

  // Skip front matter: title page, table of contents, preface, illustrations list
  // Find the FIRST real chapter heading and start there
  const frontMatterEnd = findFirstRealChapter(body);
  if (frontMatterEnd > 0) {
    body = body.slice(frontMatterEnd);
  }

  // Chapter detection patterns (order matters — more specific first)
  const chapterPatterns = [
    /^CHAPTER\s+[IVXLCDM]+\.?\s*$/im,
    /^CHAPTER\s+\d+\.?\s*$/im,
    /^Chapter\s+[IVXLCDM]+\.?\s*$/m,
    /^Chapter\s+\d+\.?\s*$/m,
    /^[IVXLCDM]{1,6}\.\s*$/m,
    /^PART\s+[IVXLCDM]+\.?\s*$/im,
    /^PART\s+\d+\.?\s*$/im,
  ];

  // Try each pattern
  for (const pattern of chapterPatterns) {
    const globalPattern = new RegExp(pattern.source, 'gim');
    const matches = [...body.matchAll(globalPattern)];

    if (matches.length >= 3) {
      const chapters = [];
      for (let i = 0; i < matches.length; i++) {
        const chStart  = matches[i].index;
        const chEnd    = i + 1 < matches.length ? matches[i + 1].index : body.length;
        const content  = body.slice(chStart, chEnd).trim();
        const title    = matches[i][0].trim();
        const wordCount = content.split(/\s+/).length;

        // Skip short sections — must be real prose, not headers
        if (wordCount < 500) continue;

        // Skip if content looks like a table of contents
        // (lots of short lines with dashes/page numbers)
        const lines     = content.split('\n').slice(0, 20);
        const shortLines = lines.filter(l => l.trim().length > 0 && l.trim().length < 60).length;
        if (shortLines > 12) continue; // looks like a TOC

        chapters.push({
          index:          chapters.length,
          title:          title || `Chapter ${chapters.length + 1}`,
          content:        content,
          wordCount:      wordCount,
          readingMinutes: Math.ceil(wordCount / 250)
        });
      }
      if (chapters.length >= 3) return chapters;
    }
  }

  // Fallback: split by word count into ~3000-word chunks
  const words  = body.split(/\s+/);
  const size   = 3000;
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    const content = words.slice(i, i + size).join(' ');
    chunks.push({
      index:          chunks.length,
      title:          `Chapter ${chunks.length + 1}`,
      content:        content,
      wordCount:      Math.min(size, words.length - i),
      readingMinutes: Math.ceil(Math.min(size, words.length - i) / 250)
    });
  }
  return chunks;
}

// Find the index of the first real chapter in the body text
// Skips title page, TOC, illustrations list, preface, etc.
function findFirstRealChapter(body) {
  // Markers that signal the actual story has begun
  const startSignals = [
    /\nCHAPTER\s+I[\.\s]/i,
    /\nCHAPTER\s+1[\.\s]/i,
    /\nCHAPTER\s+ONE\b/i,
    /\nPART\s+I[\.\s]/i,
    /\nPROLOGUE\b/i,
    /\nPREFACE\b/i,
    /\nINTRODUCTION\b/i,
  ];

  let earliest = -1;

  for (const sig of startSignals) {
    const m = body.match(sig);
    if (m && (earliest === -1 || m.index < earliest)) {
      earliest = m.index;
    }
  }

  // If found, return position of that line
  return earliest > 0 ? earliest : 0;
}
