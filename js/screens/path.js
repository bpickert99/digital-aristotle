// Duolingo-style path component
// Renders vertically scrolling lesson nodes

const TRACK_ICONS = {
  humanities: '◎',
  science:    '⚗',
  math:       '∑',
  social:     '◑',
  arts:       '♩',
  reading:    '◻',
};

export function renderPath(nodes, onSelectNode) {
  const wrap = document.createElement('div');
  wrap.className = 'path-outer';

  if (!nodes || nodes.length === 0) {
    wrap.innerHTML = `<div style="padding:20px 0;color:var(--text-3);font-family:var(--font-ui);font-size:0.85rem;">
      Path is being built…
    </div>`;
    return wrap;
  }

  const container = document.createElement('div');
  container.className = 'path-container';

  nodes.forEach((node, i) => {
    const nodeWrap = document.createElement('div');
    nodeWrap.className = 'path-node-wrap';

    // Connector line between nodes
    if (i > 0) {
      const connector = document.createElement('div');
      connector.className = 'path-connector' + (node.status === 'completed' ? ' done' : '');
      nodeWrap.appendChild(connector);
    }

    // The node itself
    const el = document.createElement('div');
    el.className = 'path-node ' + node.status;
    el.dataset.nodeId = node.id;

    const icon   = TRACK_ICONS[node.track] || '◎';
    const status = node.status === 'completed' ? '✓'
                 : node.status === 'current'   ? '→'
                 : node.status === 'locked'    ? '○'
                 : '→';

    el.innerHTML = `
      <div class="path-node-header">
        <span class="path-node-badge">${node.subject || 'Lesson'}</span>
        <span class="path-node-status">${status}</span>
      </div>
      <div class="path-node-title">${node.title}</div>
      <div class="path-node-sub">${node.sublabel || ''}</div>
    `;

    if (node.status === 'current' || node.status === 'unlocked') {
      el.addEventListener('click', () => onSelectNode(node));
    }

    nodeWrap.appendChild(el);
    container.appendChild(nodeWrap);
  });

  wrap.appendChild(container);
  return wrap;
}
