export function renderHome(userData, units, onSelectLesson) {
  const screen = document.createElement('div');
  screen.className = 'screen home-screen';
  screen.id = 'screen-home';

  const xpInLevel    = (userData.xp || 0) % 500;
  const xpPct        = Math.round((xpInLevel / 500) * 100);
  const displayName  = userData.displayName?.split(' ')[0] || 'There';

  screen.innerHTML = `
    <div class="home-header">
      <span class="home-wordmark">Aristotle</span>
      <div class="home-streak">
        <span class="streak-flame">🔥</span>
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
      <div class="home-section-label">Today's lessons</div>
      <div class="home-section-title">${getGreeting()}, ${displayName}.</div>
    </div>

    <div class="unit-cards" id="unit-cards">
      ${units.map(unit => renderUnitCard(unit)).join('')}
    </div>
  `;

  // Animate XP bar after mount
  setTimeout(() => {
    const fill = screen.querySelector('#xp-fill');
    if (fill) fill.style.width = xpPct + '%';
  }, 400);

  // Card tap handlers
  screen.querySelectorAll('.unit-card').forEach((card, i) => {
    card.addEventListener('click', () => onSelectLesson(units[i]));
  });

  return screen;
}

function renderUnitCard(unit) {
  const lesson   = unit.lesson;
  const progress = unit.completedLessons || 0;
  const total    = unit.totalLessons || 1;
  const pct      = Math.round((progress / total) * 100);

  return `
    <div class="unit-card" data-unit-id="${unit.id}">
      <div class="unit-card-accent"></div>
      <div class="unit-card-top">
        <span class="unit-badge">${unit.subject}</span>
        <span class="unit-time">${lesson.estimatedMinutes} min</span>
      </div>
      <div class="unit-title">${unit.title}</div>
      <div class="unit-lesson-title">${lesson.title}</div>
      <div class="unit-desc">${unit.description}</div>
      <div class="unit-progress">
        <div class="unit-progress-track">
          <div class="unit-progress-fill" style="width:${pct}%"></div>
        </div>
        <span class="unit-progress-label">Lesson 1 of ${total}</span>
      </div>
    </div>`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
