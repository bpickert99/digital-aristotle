// Vocabulary level assessment
// Real words across 5 difficulty bands + pseudowords as traps
// Scoring: (real words known - pseudowords checked) / total real = adjusted score

export const VOCAB_ITEMS = [
  // Band 1 — everyday (everyone should know these)
  { word: 'table',     real: true,  band: 1 },
  { word: 'angry',     real: true,  band: 1 },
  { word: 'carry',     real: true,  band: 1 },
  { word: 'broken',    real: true,  band: 1 },

  // Band 2 — educated general vocabulary
  { word: 'conceal',   real: true,  band: 2 },
  { word: 'durable',   real: true,  band: 2 },
  { word: 'adjacent',  real: true,  band: 2 },
  { word: 'remnant',   real: true,  band: 2 },

  // Band 3 — college-educated vocabulary
  { word: 'ephemeral', real: true,  band: 3 },
  { word: 'taciturn',  real: true,  band: 3 },
  { word: 'inimical',  real: true,  band: 3 },
  { word: 'liminal',   real: true,  band: 3 },

  // Band 4 — advanced/literary vocabulary
  { word: 'lugubrious',  real: true, band: 4 },
  { word: 'pellucid',    real: true, band: 4 },
  { word: 'tendentious', real: true, band: 4 },
  { word: 'laconic',     real: true, band: 4 },

  // Band 5 — specialist/rare
  { word: 'velleity',    real: true, band: 5 },
  { word: 'numinous',    real: true, band: 5 },
  { word: 'apophatic',   real: true, band: 5 },
  { word: 'propitious',  real: true, band: 5 },

  // Pseudowords — plausible but not real
  { word: 'flurvent',  real: false, band: 0 },
  { word: 'carnible',  real: false, band: 0 },
  { word: 'prestule',  real: false, band: 0 },
  { word: 'molantive', real: false, band: 0 },
];

// Shuffle array
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getShuffledItems() {
  return shuffle(VOCAB_ITEMS);
}

// Score: returns { level: 1-5, label, adjustedScore }
export function scoreVocab(checked, items) {
  const realWords    = items.filter(i => i.real);
  const pseudoWords  = items.filter(i => !i.real);

  const realChecked  = checked.filter(w => realWords.find(i => i.word === w));
  const pseudoChecked = checked.filter(w => pseudoWords.find(i => i.word === w));

  // Penalise for pseudoword false positives
  const adjusted = realChecked.length - (pseudoChecked.length * 1.5);

  // Weight by band: knowing band-4/5 words matters more
  let bandScore = 0;
  realChecked.forEach(w => {
    const item = realWords.find(i => i.word === w);
    if (item) bandScore += item.band;
  });

  // Max possible band score
  const maxBandScore = realWords.reduce((s, i) => s + i.band, 0);
  const pct = Math.max(0, bandScore / maxBandScore);

  let level, label;
  if (pct < 0.2)      { level = 1; label = 'foundational'; }
  else if (pct < 0.4) { level = 2; label = 'general'; }
  else if (pct < 0.6) { level = 3; label = 'college'; }
  else if (pct < 0.8) { level = 4; label = 'advanced'; }
  else                { level = 5; label = 'literary'; }

  return { level, label, adjustedScore: Math.max(0, adjusted), pct };
}
