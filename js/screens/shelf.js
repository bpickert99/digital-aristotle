// Bookshelf screen — completed units displayed as book spines

const TRACK_COLORS = {
  humanities: '#8b7355',
  science:    '#4a7c8b',
  math:       '#6b5b8b',
  social:     '#5b7a5b',
  arts:       '#8b5b6b',
  reading:    '#7a6b4a',
};

export function renderShelf(completedUnits = [], completedBooks = []) {
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.id = 'screen-shelf';
  screen.style.cssText = 'padding-top:calc(env(safe-area-inset-top,0px) + 20px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 80px);overflow-y:auto;';

  const allItems = [
    ...completedBooks.map(b => ({ ...b, isBook: true })),
    ...completedUnits.map(u => ({ ...u, isBook: false }))
  ].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const spinesHtml = allItems.length === 0 ? `
    <div style="text-align:center;padding:60px 24px;color:var(--text-3);">
      <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:400;
                  color:var(--text-2);margin-bottom:12px;">The shelf is empty.</div>
      <div style="font-family:var(--font-body);font-size:0.95rem;font-style:italic;line-height:1.6;">
        Complete a lesson or finish a book to place it here.
      </div>
    </div>
  ` : allItems.map(item => renderSpine(item)).join('');

  screen.innerHTML = `
    <div style="padding:0 24px 16px;">
      <div style="font-family:var(--font-ui);font-size:0.7rem;font-weight:500;
                  letter-spacing:0.1em;text-transform:uppercase;color:var(--text-3);
                  margin-bottom:4px;">Your library</div>
      <div style="font-family:var(--font-display);font-size:1.35rem;font-weight:400;
                  color:var(--text);">${allItems.length} ${allItems.length === 1 ? 'volume' : 'volumes'}</div>
    </div>

    <div style="
      display:flex;flex-wrap:wrap;gap:10px;
      padding:0 20px;
      align-items:flex-end;
    ">
      ${spinesHtml}
    </div>
  `;

  return screen;
}

function renderSpine(item) {
  const color  = TRACK_COLORS[item.track || (item.isBook ? 'reading' : 'humanities')];
  const height = 100 + Math.floor(Math.random() * 60); // 100-160px tall
  const width  = item.isBook ? 28 : 22;
  const date   = item.completedAt
    ? new Date(item.completedAt).toLocaleDateString('en-US', { month:'short', year:'numeric' })
    : '';

  const label  = item.isBook
    ? item.title
    : item.title || item.subject || 'Unit';

  return `
    <div style="
      width:${width}px; height:${height}px;
      background:${color};
      border-radius:2px 4px 4px 2px;
      display:flex; align-items:center; justify-content:center;
      cursor:default;
      position:relative;
      box-shadow: 2px 2px 6px rgba(0,0,0,0.4),
                  inset -2px 0 4px rgba(0,0,0,0.2);
      transition: transform 0.15s;
    "
    title="${label}${date ? ' · ' + date : ''}"
    onmouseenter="this.style.transform='translateY(-4px)'"
    onmouseleave="this.style.transform='none'"
    >
      <div style="
        writing-mode:vertical-rl;
        text-orientation:mixed;
        transform:rotate(180deg);
        font-family:var(--font-body);
        font-size:0.65rem;
        font-weight:400;
        color:rgba(255,255,255,0.85);
        letter-spacing:0.04em;
        padding:8px 4px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        max-height:${height - 16}px;
      ">${label}</div>
    </div>
  `;
}
