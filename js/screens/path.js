// Home-page path — compact three-dot view with expandable full path

const TRACK_COLORS = {
  humanities: '#c4a44a',
  science:    '#5b9bd5',
  math:       '#8b7acc',
  social:     '#6aab8a',
  arts:       '#c47a8a',
  reading:    '#a8804f',
};

const TRACK_BG = {
  humanities: 'rgba(196,164,74,0.15)',
  science:    'rgba(91,155,213,0.15)',
  math:       'rgba(139,122,204,0.15)',
  social:     'rgba(106,171,138,0.15)',
  arts:       'rgba(196,122,138,0.15)',
  reading:    'rgba(168,128,79,0.18)',
};

const ICONS = {
  humanities: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path d="M4 5v14a1 1 0 001 1h5V4H5a1 1 0 00-1 1zM14 4v16h5a1 1 0 001-1V5a1 1 0 00-1-1h-5zM10 4v16" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`,
  science: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path d="M9 3v6.5L4 19a1.5 1.5 0 001.3 2.25h13.4A1.5 1.5 0 0020 19l-5-9.5V3M8 3h8M7 14h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  math: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path d="M4 5h10l-6 8 6 8H4M16 10l4 4M20 10l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  social: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.6"/>
    <circle cx="17" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6"/>
    <path d="M3 18c0-2.8 2.7-5 6-5s6 2.2 6 5M14 17c.3-2 2.3-3.5 4.5-3.5S22 15 22 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`,
  arts: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path d="M12 3c-5 0-9 3.6-9 8 0 3.3 2.5 5 5 5h1.5a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 001.5 1.5c4.7 0 8.5-3.6 8.5-8s-4-9-9-9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="8" cy="10" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="7" r="1.2" fill="currentColor"/>
    <circle cx="16" cy="10" r="1.2" fill="currentColor"/>
  </svg>`,
  reading: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path d="M3 5.5A1.5 1.5 0 014.5 4H11v15H4.5A1.5 1.5 0 013 17.5v-12zM21 5.5A1.5 1.5 0 0019.5 4H13v15h6.5a1.5 1.5 0 001.5-1.5v-12z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M6 8h3M6 11h3M15 8h3M15 11h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,
};

// ═══════════════════════════════════════════════════════
// COMPACT — three dots (humanities + STEM + reading when available)
// ═══════════════════════════════════════════════════════
export function renderPath(nodes, onSelectNode) {
  const wrap = document.createElement('div');
  wrap.className = 'path-outer';

  if (!nodes || nodes.length === 0) {
    wrap.innerHTML = `<div style="padding:40px 24px;color:var(--text-3);
                                   font-family:var(--font-ui);font-size:0.85rem;text-align:center;">
      Your curriculum is being prepared…
    </div>`;
    return wrap;
  }

  const incomplete       = nodes.filter(n => n.status !== 'completed');
  const humanitiesTracks = ['humanities', 'arts', 'social'];
  const stemTracks       = ['science', 'math'];

  // Find the preferred trio
  const humanitiesNode = incomplete.find(n => n.type !== 'reading' && humanitiesTracks.includes(n.track));
  const stemNode       = incomplete.find(n => n.type !== 'reading' && stemTracks.includes(n.track));
  const readingNode    = incomplete.find(n => n.type === 'reading');

  // Start with the preferred trio, in preferred visual order
  let visibleNodes = [humanitiesNode, stemNode, readingNode].filter(Boolean);

  // Always show 3 bubbles — fill in with next available nodes if preferred types missing
  if (visibleNodes.length < 3) {
    const usedIds = new Set(visibleNodes.map(n => n.id));
    for (const n of incomplete) {
      if (visibleNodes.length >= 3) break;
      if (!usedIds.has(n.id)) {
        visibleNodes.push(n);
        usedIds.add(n.id);
      }
    }
  }

  // Compact list container
  const list = document.createElement('div');
  list.className = 'path-compact';

  visibleNodes.forEach((node, i) => {
    const isReading = node.type === 'reading';
    const track     = isReading ? 'reading' : (node.track || 'humanities');
    const color     = TRACK_COLORS[track];
    const bg        = TRACK_BG[track];
    const icon      = isReading ? ICONS.reading : (ICONS[track] || ICONS.humanities);

    const row = document.createElement('div');
    row.className = 'path-row';

    row.innerHTML = `
      <div class="path-dot-col">
        <div class="path-dot active"
             style="
               background: ${bg};
               border-color: ${color};
               color: ${color};
               box-shadow: 0 0 0 4px ${bg};
             ">${icon}</div>
        ${i < visibleNodes.length - 1 ? `
          <div class="path-line" style="background:${color}33;"></div>
        ` : ''}
      </div>
      <div class="path-text-col active">
        <div class="path-row-label" style="color: ${color};">
          ${isReading ? 'Reading' : (node.subject || 'Lesson')}
        </div>
        <div class="path-row-title">
          ${escapeHtml(node.title)}
        </div>
        <button class="path-start-btn" style="background:${color};color:#1a1610;">
          ${isReading ? 'Read chapter →' : 'Start lesson →'}
        </button>
      </div>
    `;

    row.querySelector('.path-dot')?.addEventListener('click', () => onSelectNode(node));
    row.querySelector('.path-start-btn')?.addEventListener('click', () => onSelectNode(node));

    list.appendChild(row);
  });

  wrap.appendChild(list);

  // Expandable full path
  const totalRemaining = incomplete.length;
  if (totalRemaining > visibleNodes.length) {
    const expandBtn = document.createElement('button');
    expandBtn.className = 'path-expand-btn';
    expandBtn.textContent = `See full path (${totalRemaining} total) ↓`;

    const fullPath = document.createElement('div');
    fullPath.className = 'path-full hidden';
    fullPath.appendChild(renderFullPath(nodes, onSelectNode));

    expandBtn.addEventListener('click', () => {
      const isHidden = fullPath.classList.toggle('hidden');
      expandBtn.textContent = isHidden
        ? `See full path (${totalRemaining} total) ↓`
        : `Hide full path ↑`;
    });

    wrap.appendChild(expandBtn);
    wrap.appendChild(fullPath);
  }

  return wrap;
}

// ═══════════════════════════════════════════════════════
// FULL — the zigzag view, shown on expand
// ═══════════════════════════════════════════════════════
function renderFullPath(nodes, onSelectNode) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding: 24px 0 40px;';

  const positions = ['center', 'right', 'center', 'left'];

  nodes.forEach((node, i) => {
    const isReading = node.type === 'reading';
    const track     = isReading ? 'reading' : (node.track || 'humanities');
    const color     = TRACK_COLORS[track];
    const bg        = TRACK_BG[track];
    const icon      = isReading ? ICONS.reading : (ICONS[track] || ICONS.humanities);
    const isDone    = node.status === 'completed';
    const isCurrent = node.status === 'current';
    const isLocked  = node.status === 'locked';
    const pos       = positions[i % positions.length];

    if (i > 0) {
      const connector = document.createElement('div');
      connector.style.cssText = `
        width: 2px; height: 24px;
        background: ${isDone ? color + '66' : 'rgba(255,255,255,0.08)'};
        margin: 0 auto;
      `;
      wrap.appendChild(connector);
    }

    const row = document.createElement('div');
    row.style.cssText = `
      display:flex;align-items:center;padding:0 16px;
      ${pos === 'left'   ? 'justify-content: flex-start; padding-left: 20px;'
      : pos === 'right'  ? 'justify-content: flex-end; padding-right: 20px;'
      : 'justify-content: center;'}
    `;

    const nodeWrap = document.createElement('div');
    nodeWrap.style.cssText = `display:flex;flex-direction:column;align-items:center;position:relative;`;

    const circle = document.createElement('div');
    circle.style.cssText = `
      width: 58px; height: 58px; border-radius: 50%;
      background: ${isDone ? color : isCurrent ? bg : 'rgba(255,255,255,0.04)'};
      border: 2.5px solid ${isDone || isCurrent ? color : 'rgba(255,255,255,0.08)'};
      display:flex;align-items:center;justify-content:center;
      cursor: ${isLocked ? 'default' : 'pointer'};
      transition: transform 0.18s;
      box-shadow: ${isCurrent ? `0 0 0 5px ${bg}` : 'none'};
      opacity: ${isLocked ? 0.35 : 1};
      color: ${isDone ? '#1a1610' : isCurrent ? color : 'rgba(255,255,255,0.35)'};
      -webkit-tap-highlight-color: transparent;
    `;

    if (isDone) {
      circle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <path d="M5 12l5 5 9-11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    } else {
      circle.innerHTML = icon;
    }

    const label = document.createElement('div');
    label.style.cssText = 'margin-top:6px;text-align:center;max-width:130px;';
    label.innerHTML = `
      <div style="font-family:var(--font-body);font-size:0.76rem;font-weight:400;
                  color:${isLocked ? 'rgba(255,255,255,0.25)' : 'var(--text-2)'};
                  line-height:1.3;">${truncate(node.title, 36)}</div>
    `;

    if (!isLocked) {
      circle.addEventListener('click', () => onSelectNode(node));
    }

    nodeWrap.appendChild(circle);
    nodeWrap.appendChild(label);
    row.appendChild(nodeWrap);
    wrap.appendChild(row);
  });

  return wrap;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len).trim() + '…' : str;
}
