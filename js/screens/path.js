// Duolingo-style path — alternating left/right circular nodes

const TRACK_COLORS = {
  humanities: '#c4a44a',
  science:    '#5b9bd5',
  math:       '#8b7acc',
  social:     '#6aab8a',
  arts:       '#c47a8a',
};

const TRACK_BG = {
  humanities: 'rgba(196,164,74,0.15)',
  science:    'rgba(91,155,213,0.15)',
  math:       'rgba(139,122,204,0.15)',
  social:     'rgba(106,171,138,0.15)',
  arts:       'rgba(196,122,138,0.15)',
};

export function renderPath(nodes, onSelectNode) {
  const wrap = document.createElement('div');
  wrap.className = 'path-outer';

  if (!nodes || nodes.length === 0) {
    wrap.innerHTML = `<div style="padding:24px 0;color:var(--text-3);font-family:var(--font-ui);
                                   font-size:0.85rem;text-align:center;">
      Curriculum is loading…
    </div>`;
    return wrap;
  }

  // Zigzag positions: alternate nodes left/center/right
  const positions = ['left', 'center', 'right', 'center'];

  nodes.forEach((node, i) => {
    const pos      = positions[i % positions.length];
    const color    = TRACK_COLORS[node.track] || TRACK_COLORS.humanities;
    const bg       = TRACK_BG[node.track] || TRACK_BG.humanities;
    const isDone   = node.status === 'completed';
    const isCurrent = node.status === 'current';
    const isLocked = node.status === 'locked';

    // Connector between nodes
    if (i > 0) {
      const connector = document.createElement('div');
      const prevPos   = positions[(i - 1) % positions.length];
      // Slight diagonal for zigzag feel
      connector.style.cssText = `
        width: 2px;
        height: 28px;
        background: ${isDone ? color : 'rgba(255,255,255,0.08)'};
        margin: 0 auto;
        opacity: ${isDone ? 0.5 : 1};
        position: relative;
        left: ${pos === 'left' ? '-40px' : pos === 'right' ? '40px' : '0'};
        transition: background 0.3s;
      `;
      wrap.appendChild(connector);
    }

    // Node row
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: ${pos === 'left' ? 'flex-start' : pos === 'right' ? 'flex-end' : 'center'};
      padding: 0 32px;
      position: relative;
    `;

    // The circle node
    const circle = document.createElement('div');
    circle.style.cssText = `
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: ${isDone ? color : isCurrent ? bg : 'var(--bg-3)'};
      border: 2.5px solid ${isDone || isCurrent ? color : 'rgba(255,255,255,0.1)'};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: ${isLocked ? 'default' : 'pointer'};
      transition: transform 0.15s, box-shadow 0.15s;
      position: relative;
      box-shadow: ${isCurrent ? `0 0 0 6px ${bg}, 0 0 0 8px ${color}22` : 'none'};
      opacity: ${isLocked ? 0.35 : 1};
      -webkit-tap-highlight-color: transparent;
    `;

    // Icon inside circle
    const icon = document.createElement('div');
    icon.style.cssText = `
      font-size: ${isDone ? '1.4rem' : '1.2rem'};
      margin-bottom: 2px;
      color: ${isDone ? '#1a1610' : isCurrent ? color : 'rgba(255,255,255,0.4)'};
    `;
    icon.textContent = isDone ? '✓' : getTrackIcon(node.track);

    circle.appendChild(icon);

    // Label below circle
    const label = document.createElement('div');
    label.style.cssText = `
      margin-top: 8px;
      text-align: center;
      max-width: 100px;
    `;
    label.innerHTML = `
      <div style="font-family:var(--font-ui);font-size:0.62rem;font-weight:500;
                  letter-spacing:0.07em;text-transform:uppercase;
                  color:${isLocked ? 'rgba(255,255,255,0.2)' : color};margin-bottom:2px;">
        ${node.subject || 'Lesson'}
      </div>
      <div style="font-family:var(--font-body);font-size:0.82rem;font-weight:400;
                  color:${isLocked ? 'rgba(255,255,255,0.2)' : isCurrent ? 'var(--text)' : 'var(--text-2)'};
                  line-height:1.3;">
        ${truncate(node.title, 28)}
      </div>
    `;

    // Tap handler
    if (!isLocked) {
      circle.addEventListener('click', () => onSelectNode(node));
      circle.addEventListener('mouseenter', () => {
        if (!isLocked) circle.style.transform = 'scale(1.08)';
      });
      circle.addEventListener('mouseleave', () => {
        circle.style.transform = 'none';
      });
    }

    // Current node tooltip
    if (isCurrent) {
      const tooltip = document.createElement('div');
      tooltip.style.cssText = `
        position: absolute;
        bottom: -36px;
        left: 50%;
        transform: translateX(-50%);
        background: ${color};
        color: #1a1610;
        font-family: var(--font-ui);
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 10px;
        white-space: nowrap;
        pointer-events: none;
      `;
      tooltip.textContent = 'Start →';
      circle.style.position = 'relative';
      circle.appendChild(tooltip);
    }

    // Node container
    const nodeWrap = document.createElement('div');
    nodeWrap.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      ${isCurrent ? 'margin-bottom: 20px;' : ''}
    `;
    nodeWrap.appendChild(circle);
    nodeWrap.appendChild(label);
    row.appendChild(nodeWrap);
    wrap.appendChild(row);

    // Extra space after current node for tooltip
    if (isCurrent) {
      const spacer = document.createElement('div');
      spacer.style.height = '12px';
      wrap.appendChild(spacer);
    }
  });

  return wrap;
}

function getTrackIcon(track) {
  const icons = {
    humanities: '◎',
    science:    '⚗',
    math:       '∑',
    social:     '◑',
    arts:       '♩',
  };
  return icons[track] || '◎';
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
