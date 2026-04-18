export function renderHome(userData, units, bookData, { onSelectLesson, onOpenBook, onOpenShelf }) {
  const screen = document.createElement('div');
  screen.className = 'screen home-screen';
  screen.id = 'screen-home';

  const xpInLevel   = (userData.xp || 0) % 500;
  const xpPct       = Math.round((xpInLevel / 500) * 100);
  const displayName = userData.displayName?.split(' ')[0] || 'there';

  // Daily completion state
  const todayStr       = new Date().toDateString();
  const bookDoneToday  = bookData?.lastReadDate === todayStr;
  const lessonDoneToday = userData.lastLessonDate === todayStr;
  const streakComplete  = bookDoneToday && lessonDoneToday;

  screen.innerHTML = `
    <div class="home-header">
      <span class="home-wordmark">Aristotle</span>
      <div class="home-streak ${streakComplete ? 'streak-done' : ''}"
           style="cursor:pointer;" id="streak-badge">
        <span class="streak-flame">${streakComplete ? '🔥' : '🔥'}</span>
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

    <!-- Daily progress indicators -->
    <div style="display:flex;gap:8px;padding:14px 24px 0;">
      <div class="daily-check ${bookDoneToday ? 'done' : ''}">
        <span class="daily-check-icon">${bookDoneToday ? '✓' : '○'}</span>
        <span class="daily-check-label">Reading</span>
      </div>
      <div class="daily-check ${lessonDoneToday ? 'done' : ''}">
        <span class="daily-check-icon">${lessonDoneToday ? '✓' : '○'}</span>
        <span class="daily-check-label">Lesson</span>
      </div>
    </div>

    <div class="home-section-header">
      <div class="home-section-label">Today</div>
      <div class="home-section-title">${getGreeting()}, ${displayName}.</div>
    </div>

    <div class="unit-cards" id="unit-cards">
      ${bookData ? renderBookCard(bookData, bookDoneToday) : ''}
      ${units.map(unit => renderUnitCard(unit, lessonDoneToday)).join('')}
    </div>
  `;

  // Animate XP bar
  setTimeout(() => {
    const fill = screen.querySelector('#xp-fill');
    if (fill) fill.style.width = xpPct + '%';
  }, 400);

  // Book card tap
  screen.querySelector('#book-card')?.addEventListener('click', () => {
    if (!bookDoneToday) onOpenBook(bookData);
  });

  // Unit card taps
  screen.querySelectorAll('.unit-card[data-unit-id]').forEach((card, i) => {
    card.addEventListener('click', () => {
      if (!lessonDoneToday) onSelectLesson(units[i]);
    });
  });

  // Chapter toggles
  screen.querySelectorAll('.chapter-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const unitId   = btn.dataset.unit;
      const chapters = screen.querySelector(`#chapters-${unitId}`);
      if (chapters) {
        const open = chapters.style.display !== 'none';
        chapters.style.display = open ? 'none' : 'block';
        btn.textContent = open ? 'See chapters ↓' : 'Hide chapters ↑';
      }
    });
  });

  return screen;
}

function renderBookCard(bookData, doneToday) {
  const chapter     = bookData.chapters?.[bookData.currentChapter] || {};
  const progress    = bookData.currentChapter || 0;
  const total       = bookData.chapters?.length || 1;
  const pct         = Math.round((progress / total) * 100);

  return `
    <div class="unit-card ${doneToday ? 'card-done' : ''}" id="book-card">
      <div class="unit-card-accent" style="background:#8b7355;"></div>
      <div class="unit-card-top">
        <span class="unit-badge" style="color:#c4a44a;background:rgba(196,164,74,0.1);">
          Reading
        </span>
        <span class="unit-time">${chapter.readingMinutes || '?'} min</span>
      </div>
      <div class="unit-title">${bookData.title}</div>
      <div class="unit-lesson-title">${chapter.title || 'Chapter 1'}</div>
      <div class="unit-desc" style="font-style:normal;">by ${bookData.author}</div>
      <div class="unit-progress">
        <div class="unit-progress-track">
          <div class="unit-progress-fill" style="width:${pct}%;opacity:0.5;background:#8b7355;"></div>
        </div>
        <span class="unit-progress-label">Ch. ${progress + 1} of ${total}</span>
      </div>
      ${doneToday ? '<div style="font-family:var(--font-ui);font-size:0.72rem;color:var(--success);margin-top:8px;">Read today ✓</div>' : ''}
    </div>
  `;
}

function renderUnitCard(unit, doneToday) {
  const lesson   = unit.lesson;
  const progress = unit.completedLessons || 0;
  const total    = unit.totalLessons || 8;
  const pct      = Math.round((progress / total) * 100);
  const chapters = unit.chapters || [];

  const chaptersHtml = chapters.length ? `
    <div id="chapters-${unit.id}" style="display:none;margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
      ${chapters.map((ch, i) => `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;
                    opacity:${i <= progress ? 1 : 0.4};">
          <div style="width:16px;height:16px;border-radius:50%;flex-shrink:0;
                      background:${i < progress ? 'var(--success)' : i === progress ? 'var(--accent)' : 'var(--border-2)'};
                      display:flex;align-items:center;justify-content:center;">
            ${i < progress ? '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#1a1610" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>' : ''}
          </div>
          <div>
            <div style="font-family:var(--font-ui);font-size:0.78rem;font-weight:400;color:var(--text);">
              ${ch.title}
            </div>
            <div style="font-family:var(--font-ui);font-size:0.68rem;color:var(--text-3);">
              ${ch.lessonCount || 2} lessons
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <button class="chapter-toggle" data-unit="${unit.id}" style="
      background:none;border:none;color:var(--text-3);
      font-family:var(--font-ui);font-size:0.72rem;cursor:pointer;
      padding:8px 0 0;-webkit-tap-highlight-color:transparent;
    ">See chapters ↓</button>
  ` : '';

  return `
    <div class="unit-card ${doneToday ? 'card-done' : ''}" data-unit-id="${unit.id}">
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
        <span class="unit-progress-label">Lesson ${progress + 1} of ${total}</span>
      </div>
      ${chaptersHtml}
      ${doneToday ? '<div style="font-family:var(--font-ui);font-size:0.72rem;color:var(--success);margin-top:8px;">Done today ✓</div>' : ''}
    </div>
  `;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
