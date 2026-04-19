import { renderPath } from './path.js';

export function renderHome(userData, pathNodes, bookData, { onSelectNode, onOpenBook }) {
  const screen = document.createElement('div');
  screen.className = 'screen home-screen';
  screen.id = 'screen-home';

  const xpInLevel   = (userData.xp || 0) % 500;
  const xpPct       = Math.round((xpInLevel / 500) * 100);
  const displayName = userData.displayName?.split(' ')[0] || 'there';
  const todayStr    = new Date().toDateString();
  const bookDone    = bookData?.lastReadDate === todayStr;
  const lessonDone  = userData.lastLessonDate === todayStr;

  screen.innerHTML = `
    <div class="home-header">
      <span class="home-wordmark">Aristotle</span>
      <div class="home-streak ${(bookDone && lessonDone) ? 'streak-done' : ''}">
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

    <div class="daily-checks">
      <div class="daily-check ${bookDone ? 'done' : ''}">
        <span class="daily-check-icon">${bookDone ? '✓' : '○'}</span>
        <span class="daily-check-label">Reading</span>
      </div>
      <div class="daily-check ${lessonDone ? 'done' : ''}">
        <span class="daily-check-icon">${lessonDone ? '✓' : '○'}</span>
        <span class="daily-check-label">Lesson</span>
      </div>
    </div>

    <div class="home-section-header">
      <div class="home-section-label">Today</div>
      <div class="home-section-title">${getGreeting()}, ${displayName}.</div>
    </div>

    <div id="book-slot"></div>
    <div id="path-slot"></div>
  `;

  setTimeout(() => {
    const fill = screen.querySelector('#xp-fill');
    if (fill) fill.style.width = xpPct + '%';
  }, 400);

  // Book card
  if (bookData) {
    const bookSlot = screen.querySelector('#book-slot');
    bookSlot.appendChild(buildBookCard(bookData, bookDone, onOpenBook));
  }

  // Path
  const pathSlot = screen.querySelector('#path-slot');
  pathSlot.appendChild(renderPath(pathNodes, onSelectNode));

  return screen;
}

function buildBookCard(bookData, done, onOpenBook) {
  const card    = document.createElement('div');
  card.className = 'book-card' + (done ? ' done' : '');

  const chapter     = bookData.chapters?.[bookData.currentChapter] || {};
  const progress    = bookData.currentChapter || 0;
  const total       = bookData.chapters?.length || 1;
  const pct         = Math.round((progress / total) * 100);

  card.innerHTML = `
    <div class="book-card-accent"></div>
    <div class="book-badge">Reading</div>
    <div class="book-title">${bookData.title}</div>
    <div class="book-chapter">${chapter.title || 'Chapter 1'}</div>
    <div class="book-author">by ${bookData.author}</div>
    <div class="progress-row">
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;background:#8b7355;opacity:0.7;"></div>
      </div>
      <span class="progress-label">Ch. ${progress + 1} of ${total}</span>
    </div>
    ${done ? '<div style="font-family:var(--font-ui);font-size:0.72rem;color:var(--success);margin-top:8px;">Read today ✓</div>' : ''}
  `;

  if (!done) card.addEventListener('click', onOpenBook);
  return card;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
