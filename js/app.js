import {
  onAuthChange, signInWithGoogle, currentUser,
  getUser, createUser, saveOnboarding, markOnboarded,
  saveUnits, getUnits, saveBook, getBook,
  updateBookProgress, saveVocabLevel,
  saveCompletion, saveFeedback,
  awardXp, recordBookRead, recordLessonDone,
  markUnitComplete, getCompletedUnits, saveInterestFingerprint
} from './firebase.js';
import { generateCurriculum, generateChapters, generateReflectionQuestions } from './api.js';
import { selectBook, fetchBookText, parseChapters } from './gutenberg.js';
import { renderOnboarding }   from './screens/onboarding.js';
import { renderGenerating }   from './screens/generating.js';
import { renderHome }         from './screens/home.js';
import { renderLesson }       from './screens/lesson.js';
import { renderReader }       from './screens/reader.js';
import { renderShelf }        from './screens/shelf.js';
import {
  renderInterestPulse, shouldShowPulse, mergeInterestSignal
} from './screens/interestPulse.js';
import { getPulsePairs } from './coursePairs.js';

// ── State ─────────────────────────────────────────────
let userData = null;
let units    = [];
let bookData = null;
let activeTab = 'home';

// ── Boot ──────────────────────────────────────────────
window.addEventListener('load', () => {
  onAuthChange(handleAuthChange);
});

async function handleAuthChange(user) {
  const splash = document.querySelector('.splash');
  if (!user) {
    if (splash) splash.classList.add('hidden');
    showScreen(buildAuthScreen());
    return;
  }

  let data = await getUser(user.uid);
  if (!data) {
    await createUser(user.uid, { displayName: user.displayName });
    data = await getUser(user.uid);
  }
  userData = data;
  if (splash) splash.classList.add('hidden');

  if (!data.onboarded) showOnboarding();
  else await loadAndShowHome();
}

// ── Auth screen ───────────────────────────────────────
function buildAuthScreen() {
  const screen = document.createElement('div');
  screen.className = 'screen auth-screen';
  screen.id = 'screen-auth';
  screen.innerHTML = `
    <div class="auth-top">
      <div class="auth-wordmark">Aristotle</div>
      <div class="auth-tagline">A private education for the curious adult.</div>
    </div>
    <div class="auth-bottom">
      <p class="auth-descriptor">
        Thirty minutes a day.<br>
        Every subject worth knowing.<br>
        Lessons that build on each other.
      </p>
      <button class="btn btn-google" id="sign-in-btn">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
      <div id="auth-error" style="color:var(--danger);font-size:0.82rem;text-align:center;margin-top:14px;display:none;"></div>
    </div>`;

  screen.querySelector('#sign-in-btn')?.addEventListener('click', async () => {
    const btn = screen.querySelector('#sign-in-btn');
    const err = screen.querySelector('#auth-error');
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      await signInWithGoogle();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'Continue with Google';
      if (err) { err.textContent = 'Sign-in failed. Please try again.'; err.style.display = 'block'; }
    }
  });
  return screen;
}

// ── Onboarding ────────────────────────────────────────
function showOnboarding() {
  const obScreen = renderOnboarding({}, async (profile) => {
    obScreen.classList.remove('active');
    obScreen.classList.add('exit');

    const genScreen = renderGenerating();
    mount(genScreen);
    setTimeout(() => genScreen.classList.add('active'), 20);

    try {
      const uid = currentUser().uid;
      await saveOnboarding(uid, profile);
      if (profile.vocabLevel) await saveVocabLevel(uid, profile.vocabLevel);

      // Generate two units
      let curriculum;
      try {
        curriculum = await generateCurriculum(profile);
      } catch (apiErr) {
        throw new Error('API call failed: ' + apiErr.message);
      }

      if (!curriculum?.units?.length) {
        throw new Error('Claude returned no units.');
      }

      // Generate chapters for each unit
      for (const unit of curriculum.units) {
        try {
          const chapters = await generateChapters(unit);
          unit.chapters = Array.isArray(chapters) ? chapters : [];
        } catch {
          unit.chapters = [];
        }
      }

      units = curriculum.units;
      await saveUnits(uid, units);

      // Select and fetch book
      const vocabLevel = profile.vocabLevel?.level || 3;
      const book = selectBook(vocabLevel, profile.interests || []);

      try {
        const text     = await fetchBookText(book.id);
        const chapters = parseChapters(text);
        bookData = {
          ...book,
          gutenbergId:    book.id,
          chapters:       chapters.map(c => ({
            title:          c.title,
            content:        c.content,
            wordCount:      c.wordCount,
            readingMinutes: c.readingMinutes
          })),
          currentChapter: 0,
          lastReadDate:   null
        };
        await saveBook(uid, bookData);
      } catch (bookErr) {
        console.warn('Book fetch failed:', bookErr.message);
        bookData = null;
      }

      await markOnboarded(uid);
      userData = await getUser(uid);

      if (genScreen._stopMessages) genScreen._stopMessages();
      genScreen.classList.remove('active');
      genScreen.classList.add('exit');
      await loadAndShowHome();

    } catch (err) {
      console.error('Generation failed:', err);
      showGenerationError(genScreen, err.message);
    }
  });

  showScreen(obScreen);
}

function showGenerationError(genScreen, detail) {
  if (genScreen._stopMessages) genScreen._stopMessages();
  genScreen.innerHTML = `
    <div style="padding:32px 24px;display:flex;flex-direction:column;gap:16px;align-items:center;text-align:center;">
      <div class="error-title">Generation failed</div>
      <p class="error-msg">The curriculum couldn't be built. Check your Cloudflare Worker URL and API key.</p>
      <details style="font-family:var(--font-ui);font-size:0.75rem;color:var(--text-3);
                      text-align:left;width:100%;max-width:360px;cursor:pointer;">
        <summary style="margin-bottom:8px;">Error detail</summary>
        <pre style="white-space:pre-wrap;word-break:break-all;background:var(--bg-3);
                    padding:12px;border-radius:8px;line-height:1.5;">${detail || 'Unknown error'}</pre>
      </details>
      <button class="btn btn-primary" onclick="location.reload()" style="max-width:280px;width:100%;margin-top:8px;">
        Try again
      </button>
    </div>`;
  genScreen.classList.add('error-screen');
}

// ── Home ──────────────────────────────────────────────
async function loadAndShowHome() {
  const uid = currentUser().uid;
  if (!units.length) {
    const data = await getUnits(uid);
    if (data) units = data;
  }
  if (!bookData) {
    bookData = await getBook(uid);
  }
  if (!userData) userData = await getUser(uid);

  const homeScreen = renderHome(userData, units, bookData, {
    onSelectLesson: (unit) => showLesson(unit, homeScreen),
    onOpenBook:     ()     => showReader(homeScreen),
    onOpenShelf:    ()     => {}
  });

  showScreen(homeScreen);
  addBottomNav(homeScreen);
}

// ── Reader ────────────────────────────────────────────
async function showReader(homeScreen) {
  if (!bookData?.chapters?.length) return;

  const chapterIdx = bookData.currentChapter || 0;
  const chapter    = bookData.chapters[chapterIdx];
  if (!chapter) return;

  homeScreen.classList.remove('active');

  renderReader(chapter, bookData, {
    onBack: () => {
      homeScreen.classList.add('active');
    },
    onComplete: async () => {
      const uid      = currentUser().uid;
      const todayStr = new Date().toDateString();
      const nextIdx  = chapterIdx + 1;

      // Save progress
      await updateBookProgress(uid, nextIdx < bookData.chapters.length ? nextIdx : chapterIdx, todayStr);
      bookData.currentChapter = nextIdx < bookData.chapters.length ? nextIdx : chapterIdx;
      bookData.lastReadDate   = todayStr;

      // Award XP
      const xpEarned = 80;
      await awardXp(uid, xpEarned);
      await recordBookRead(uid);
      userData = await getUser(uid);

      // Generate reflection questions lazily
      let reflectionQuestions = [];
      try {
        reflectionQuestions = await generateReflectionQuestions(chapter, bookData);
      } catch {}

      if (reflectionQuestions.length > 0) {
        showReflection(reflectionQuestions, chapter, homeScreen);
      } else {
        homeScreen.classList.add('active');
        await loadAndShowHome();
      }
    }
  });
}

// ── Post-reading reflection ───────────────────────────
function showReflection(questions, chapter, homeScreen) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:var(--bg);z-index:600;
    display:flex;flex-direction:column;
    padding:calc(env(safe-area-inset-top,0px)+32px) 24px
            calc(env(safe-area-inset-bottom,0px)+24px);
    overflow-y:auto;
  `;

  overlay.innerHTML = `
    <div style="font-family:var(--font-ui);font-size:0.68rem;font-weight:500;
                letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);
                margin-bottom:12px;">After reading</div>
    <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:400;
                margin-bottom:8px;line-height:1.25;">${chapter.title}</div>
    <p style="font-family:var(--font-body);font-size:0.95rem;color:var(--text-2);
              font-style:italic;margin-bottom:32px;">
      Three questions to sit with before moving on.
    </p>
    ${questions.map((q, i) => `
      <div style="margin-bottom:24px;">
        <div style="font-family:var(--font-ui);font-size:0.7rem;letter-spacing:0.08em;
                    text-transform:uppercase;color:var(--text-3);margin-bottom:8px;">
          ${q.type}
        </div>
        <div style="font-family:var(--font-body);font-size:1.1rem;font-weight:400;
                    color:var(--text);margin-bottom:12px;line-height:1.6;">
          ${q.question}
        </div>
        <textarea style="
          width:100%;background:var(--bg-3);border:1.5px solid var(--border);
          border-radius:var(--radius);padding:12px 14px;
          font-family:var(--font-body);font-size:0.95rem;color:var(--text);
          outline:none;resize:none;min-height:72px;-webkit-appearance:none;
        " placeholder="Write your response…"></textarea>
      </div>
    `).join('')}
    <button class="btn btn-primary" id="reflection-done" style="margin-top:8px;">
      Done
    </button>
    <button id="reflection-skip" style="
      background:none;border:none;color:var(--text-3);font-family:var(--font-ui);
      font-size:0.8rem;cursor:pointer;padding:12px 8px;text-align:center;
    ">Skip</button>
  `;

  document.getElementById('app').appendChild(overlay);
  setTimeout(() => overlay.style.opacity = '1', 20);

  const finish = async () => {
    overlay.remove();
    homeScreen.classList.add('active');
    await loadAndShowHome();
  };

  overlay.querySelector('#reflection-done')?.addEventListener('click', finish);
  overlay.querySelector('#reflection-skip')?.addEventListener('click', finish);
}

// ── Lesson ────────────────────────────────────────────
function showLesson(unit, homeScreen) {
  homeScreen.classList.remove('active');

  const lessonScreen = renderLesson(unit, userData, {
    onBack: () => {
      lessonScreen.classList.remove('active');
      lessonScreen.classList.add('exit');
      setTimeout(() => {
        lessonScreen.remove();
        homeScreen.classList.remove('exit');
        homeScreen.classList.add('active');
      }, 350);
    },
    onComplete: async (result) => {
      const uid = currentUser().uid;

      await saveCompletion(uid, unit.lesson.id, {
        unitId: unit.id, score: result.score, answers: result.answers
      });

      if (result.feedback?.stars || result.feedback?.text) {
        await saveFeedback(uid, unit.lesson.id, result.feedback);
      }

      await awardXp(uid, result.xpEarned);
      await recordLessonDone(uid);
      userData = await getUser(uid);

      // Interest pulse check
      if (shouldShowPulse(userData)) {
        const seenIndices = userData.fingerprint?.seenPulseIndices || [];
        const pairData    = getPulsePairs(seenIndices);
        renderInterestPulse(pairData, async ({ domainWins, seenIndices: newSeen }) => {
          const updated = mergeInterestSignal(userData.fingerprint || {}, domainWins);
          updated.seenPulseIndices = [...seenIndices, ...newSeen].slice(-30);
          await saveInterestFingerprint(uid, updated);
          userData = await getUser(uid);
          returnHome();
        });
      } else {
        returnHome();
      }

      function returnHome() {
        lessonScreen.classList.remove('active');
        lessonScreen.classList.add('exit');
        setTimeout(() => {
          lessonScreen.remove();
          loadAndShowHome();
        }, 350);
      }
    }
  });

  mount(lessonScreen);
  setTimeout(() => lessonScreen.classList.add('active'), 20);
}

// ── Navigation ────────────────────────────────────────
function addBottomNav(homeScreen) {
  document.querySelector('.bottom-nav')?.remove();

  const nav = document.createElement('div');
  nav.className = 'bottom-nav';
  nav.innerHTML = `
    <div class="nav-item active" data-tab="home">
      <div class="nav-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 8.5L10 3l7 5.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V8.5z"
            stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M7 18v-6h6v6" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="nav-label">Home</span>
    </div>
    <div class="nav-item" data-tab="shelf">
      <div class="nav-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="14" width="16" height="2" rx="1" stroke="currentColor" stroke-width="1.4"/>
          <rect x="4" y="6" width="3" height="8" rx="1" stroke="currentColor" stroke-width="1.4"/>
          <rect x="9" y="4" width="3" height="10" rx="1" stroke="currentColor" stroke-width="1.4"/>
          <rect x="14" y="7" width="3" height="7" rx="1" stroke="currentColor" stroke-width="1.4"/>
        </svg>
      </div>
      <span class="nav-label">Shelf</span>
    </div>
    <div class="nav-item" data-tab="profile">
      <div class="nav-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.4"/>
          <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="nav-label">Profile</span>
    </div>`;

  document.getElementById('app').appendChild(nav);

  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', async () => {
      const tab = item.dataset.tab;
      if (tab === activeTab) return;
      activeTab = tab;
      nav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      if (tab === 'home') {
        await loadAndShowHome();
      } else if (tab === 'shelf') {
        const uid       = currentUser()?.uid;
        const completed = uid ? await getCompletedUnits(uid) : [];
        const shelfScreen = renderShelf(completed, []);
        showScreen(shelfScreen);
        document.getElementById('app').appendChild(nav);
      }
    });
  });
}

// ── Screen utilities ──────────────────────────────────
function mount(screen) {
  document.getElementById('app').appendChild(screen);
}

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => {
    if (s !== screen) {
      s.classList.remove('active');
      s.classList.add('exit');
      setTimeout(() => s.remove(), 400);
    }
  });
  mount(screen);
  setTimeout(() => screen.classList.add('active'), 20);
}
