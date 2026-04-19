import { renderPath } from './path.js';

export function renderHome(userData, pathNodes, bookData, { onSelectNode }) {
  const screen = document.createElement('div');
  screen.className = 'screen home-screen';
  screen.id = 'screen-home';

  const xpInLevel   = (userData.xp || 0) % 500;
  const xpPct       = Math.round((xpInLevel / 500) * 100);
  const displayName = userData.displayName?.split(' ')[0] || 'there';
  const todayStr    = new Date().toDateString();
  const doneToday   = userData.lastLessonDate === todayStr;

  screen.innerHTML = `
    <div class="home-header">
      <span class="home-wordmark">Aristotle</span>
      <div class="home-streak ${doneToday ? 'streak-done' : ''}">
        <span>🔥</span>
        <span class="streak-count">${userData.streak || 0}</span>
        <span class="streak-label">day streak</span>
      </div>
    </div>

    <div class="xp-bar-container">
      <div class="xp-meta">
        <span class="xp-level">Level ${userData.xpLevel || 1}</span>
        <span class="xp-points">${userData.xp || 0} XP</span>
      </div>
      <div class="xp-track">
        <div class="xp-fill" id="xp-fill" style="width:0%"></div>
      </div>
    </div>

    <div class="home-section-header">
      <div class="home-section-label">Today</div>
      <div class="home-section-title">${getGreeting()}, ${displayName}.</div>
      ${bookData ? `
        <div style="font-family:var(--font-ui);font-size:0.82rem;color:var(--text-3);
                    margin-top:6px;font-weight:300;">
          Currently reading <em style="color:var(--text-2);">${escapeHtml(bookData.title)}</em>
          by ${escapeHtml(bookData.author)}
        </div>
      ` : ''}
    </div>

    <div id="path-slot"></div>
  `;

  setTimeout(() => {
    const fill = screen.querySelector('#xp-fill');
    if (fill) fill.style.width = xpPct + '%';
  }, 400);

  const pathSlot = screen.querySelector('#path-slot');
  pathSlot.appendChild(renderPath(pathNodes, onSelectNode));

  return screen;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
