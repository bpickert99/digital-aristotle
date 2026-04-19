import {
  onAuthChange, signInWithGoogle, currentUser,
  getUser, createUser, saveOnboarding, markOnboarded,
  savePath, getPath, markNodeComplete,
  saveBook, getBook, updateBookProgress,
  saveVocabLevel, saveVocabDeck, getVocabDeck,
  saveReviewDeck, getReviewDeck,
  recordStruggle, getStruggles,
  saveCompletion, saveFeedback,
  awardXp, recordBookRead, recordLessonDone,
  getCompletedUnits, markUnitComplete,
  saveInterestFingerprint
} from './firebase.js';
import {
  generateCurriculum, generatePathNodes,
  generateChapters, generateReflectionQuestions,
  generateEntranceQuiz
} from './api.js';
import { selectBook, fetchBookText, parseChapters } from './gutenberg.js';
import { getDueCards, conceptToCard, vocabToCard } from './spaced.js';
import { renderOnboarding }   from './screens/onboarding.js';
import { renderGenerating }   from './screens/generating.js';
import { renderHome }         from './screens/home.js';
import { renderLesson }       from './screens/lesson.js';
import { renderReader }       from './screens/reader.js';
import { renderProfile }      from './screens/profile.js';
import { renderShelf }        from './screens/shelf.js';
import { renderReviewSession } from './screens/review.js';
import {
  renderInterestPulse, shouldShowPulse, mergeInterestSignal
} from './screens/interestPulse.js';
import { getPulsePairs } from './coursePairs.js';

// ── State ─────────────────────────────────────────────
let userData   = null;
let pathNodes  = [];
let bookData   = null;
let reviewDeck = [];
let activeTab  = 'home';
let ttsActive  = false;
let ttsSynth   = window.speechSynthesis || null;

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

// ── Auth ──────────────────────────────────────────────
function buildAuthScreen() {
  const screen = document.createElement('div');
  screen.className = 'screen auth-screen';
  screen.id = 'screen-auth';
  screen.innerHTML = `
    <div>
      <div class="auth-wordmark">Aristotle</div>
      <div class="auth-tagline">A private education for the curious adult.</div>
    </div>
    <div>
      <p class="auth-descriptor">
        One chapter a day.<br>Every subject worth knowing.<br>A curriculum that grows with you.
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
    btn.disabled = true; btn.textContent = 'Signing in…';
    try { await signInWithGoogle(); }
    catch {
      btn.disabled = false; btn.textContent = 'Continue with Google';
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

      // Generate initial units
      const curriculum = await generateCurriculum(profile);
      if (!curriculum?.units?.length) throw new Error('No units returned');

      // Select and fetch book first (so we can interleave with lessons)
      const vocabLevel = profile.vocabLevel?.level || 3;
      const book = selectBook(vocabLevel, profile.interests || []);
      try {
        const text     = await fetchBookText(book.id);
        const chapters = parseChapters(text);
        bookData = {
          ...book, gutenbergId: book.id,
          chapters: chapters.map(c => ({
            title: c.title, content: c.content,
            wordCount: c.wordCount, readingMinutes: c.readingMinutes
          })),
          currentChapter: 0, lastReadDate: null
        };
        await saveBook(uid, bookData);
      } catch (e) { console.warn('Book fetch failed:', e.message); }

      // Convert units to lesson nodes
      const lessonNodes = curriculum.units.map((unit, ui) => ({
        id:       unit.id,
        type:     'lesson',
        title:    unit.title,
        subject:  unit.subject,
        track:    unit.track,
        status:   'locked',
        lesson:   unit.lesson
      }));

      // Generate extras
      let extraLessonNodes = [];
      try {
        const extras = await generatePathNodes(lessonNodes, profile.interests || [], {}, 4);
        if (Array.isArray(extras)) {
          extraLessonNodes = extras.map(n => ({ ...n, type: 'lesson', status: 'locked' }));
        }
      } catch (e) { console.warn('Extra generation failed:', e.message); }

      const allLessons = [...lessonNodes, ...extraLessonNodes];

      // Interleave book chapters: after every 2 lessons, add a reading node
      pathNodes = interleaveBookChapters(allLessons, bookData);

      // First node is current
      if (pathNodes[0]) pathNodes[0].status = 'current';

      await savePath(uid, pathNodes);

      await markOnboarded(uid);
      userData = await getUser(uid);

      if (genScreen._stopMessages) genScreen._stopMessages();
      genScreen.classList.remove('active');
      genScreen.classList.add('exit');
      await loadAndShowHome();

    } catch (err) {
      console.error('Generation failed:', err);
      showError(genScreen, err.message);
    }
  });

  showScreen(obScreen);
}

function showError(genScreen, detail) {
  if (genScreen._stopMessages) genScreen._stopMessages();
  genScreen.innerHTML = `
    <div style="padding:32px 20px;display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center;">
      <div class="error-title">Generation failed</div>
      <p class="error-msg">The curriculum couldn't be built.</p>
      <details style="font-family:var(--font-ui);font-size:0.75rem;color:var(--text-3);text-align:left;width:100%;max-width:340px;cursor:pointer;">
        <summary style="margin-bottom:8px;">Error detail</summary>
        <pre style="white-space:pre-wrap;word-break:break-all;background:var(--bg-3);padding:12px;border-radius:8px;line-height:1.5;">${detail || 'Unknown error'}</pre>
      </details>
      <button class="btn btn-primary" onclick="location.reload()" style="max-width:260px;width:100%;margin-top:8px;">Try again</button>
    </div>`;
  genScreen.classList.add('error-screen');
}

// ── Home ──────────────────────────────────────────────
async function loadAndShowHome() {
  const uid = currentUser().uid;

  if (!pathNodes.length) {
    const saved = await getPath(uid);
    if (saved) pathNodes = saved;
  }
  if (!bookData)   bookData   = await getBook(uid);
  if (!userData)   userData   = await getUser(uid);
  if (!reviewDeck.length) reviewDeck = await getReviewDeck(uid);

  // Extend path if getting short
  const remaining = pathNodes.filter(n => n.status !== 'completed').length;
  if (remaining <= 2) {
    extendPathInBackground(uid);
  }

  const homeScreen = renderHome(userData, pathNodes, bookData, {
    onSelectNode: (node) => {
      if (node.type === 'reading') {
        showReader(homeScreen, node);
      } else {
        showLesson(node, homeScreen);
      }
    }
  });

  showScreen(homeScreen);
  addBottomNav(homeScreen);
}

// Helper: insert book chapter nodes into the lesson sequence
function interleaveBookChapters(lessonNodes, bookData) {
  if (!bookData?.chapters?.length) return lessonNodes;

  const result = [];
  let chapterIdx = 0;
  const maxChapters = bookData.chapters.length;

  for (let i = 0; i < lessonNodes.length; i++) {
    result.push(lessonNodes[i]);

    // After every 2 lessons, insert a book chapter (if available)
    if ((i + 1) % 2 === 0 && chapterIdx < maxChapters) {
      const ch = bookData.chapters[chapterIdx];
      result.push({
        id:            `reading-${bookData.gutenbergId}-${chapterIdx}`,
        type:          'reading',
        title:         ch.title || `Chapter ${chapterIdx + 1}`,
        subject:       bookData.title,
        track:         'reading',
        status:        'locked',
        bookId:        bookData.gutenbergId,
        chapterIndex:  chapterIdx
      });
      chapterIdx++;
    }
  }
  return result;
}

async function extendPathInBackground(uid) {
  try {
    const completed = pathNodes.filter(n => n.status === 'completed');
    const struggles = await getStruggles(uid);
    const interests = userData?.onboarding?.interests || [];
    const newNodes  = await generatePathNodes(completed, interests, struggles, 3);

    if (Array.isArray(newNodes) && newNodes.length) {
      const toAdd = newNodes.map(n => ({ ...n, status: 'locked' }));
      pathNodes   = [...pathNodes, ...toAdd];
      await savePath(uid, pathNodes);
    }
  } catch (e) { console.warn('Path extension failed:', e.message); }
}

// ── Reader ────────────────────────────────────────────
async function showReader(homeScreen, node) {
  if (!bookData?.chapters?.length) return;

  // Use the node's chapter index if provided (it's a path node)
  const chapterIdx = node?.chapterIndex ?? (bookData.currentChapter || 0);
  const chapter    = bookData.chapters[chapterIdx];
  if (!chapter) return;

  if (ttsSynth) ttsSynth.cancel();

  // Hide the bottom nav while in reader
  document.querySelector('.bottom-nav')?.remove();

  homeScreen.classList.remove('active');

  renderReader(chapter, bookData, {
    onBack: () => homeScreen.classList.add('active'),
    onComplete: async () => {
      const uid      = currentUser().uid;
      const todayStr = new Date().toDateString();
      const nextIdx  = chapterIdx + 1;

      // Advance book's currentChapter
      await updateBookProgress(
        uid,
        nextIdx < bookData.chapters.length ? nextIdx : chapterIdx,
        todayStr
      );
      bookData.currentChapter = nextIdx < bookData.chapters.length ? nextIdx : chapterIdx;
      bookData.lastReadDate   = todayStr;

      // Mark this reading node complete in the path (if it was one)
      if (node?.id) {
        pathNodes = await markNodeComplete(uid, node.id, pathNodes);
      }

      await awardXp(uid, 80);
      await recordBookRead(uid);
      await recordLessonDone(uid); // reading also counts toward daily completion
      userData = await getUser(uid);

      // Reflection questions
      let rqs = [];
      try { rqs = await generateReflectionQuestions(chapter, bookData); } catch {}

      if (Array.isArray(rqs) && rqs.length > 0) {
        showReflection(rqs, chapter, homeScreen);
      } else {
        homeScreen.classList.add('active');
        await loadAndShowHome();
      }
    }
  });
}

// Generate vocab cards from chapter text using Claude
async function generateVocabCards(chapter, book, uid) {
  // Simple heuristic — flag words that are probably unfamiliar
  const text     = chapter.content;
  const advanced = text.match(/\b[a-z]{8,}\b/gi)?.slice(0, 5) || [];
  return advanced.map(w =>
    vocabToCard(w, '', `From ${book.title}, chapter "${chapter.title}"`)
  );
}

// ── Post-reading reflection ───────────────────────────
function showReflection(questions, chapter, homeScreen) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:var(--bg);z-index:600;
    display:flex;flex-direction:column;
    padding:calc(env(safe-area-inset-top,0px)+28px) 20px
            calc(env(safe-area-inset-bottom,0px)+20px);
    overflow-y:auto;
  `;
  overlay.innerHTML = `
    <div style="font-family:var(--font-ui);font-size:0.68rem;font-weight:500;
                letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:10px;">
      After reading
    </div>
    <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:400;
                margin-bottom:8px;line-height:1.25;">${chapter.title}</div>
    <p style="font-family:var(--font-body);font-size:0.95rem;color:var(--text-2);
              font-style:italic;margin-bottom:28px;line-height:1.6;">
      Three questions before moving on.
    </p>
    ${questions.map(q => `
      <div style="margin-bottom:22px;">
        <div style="font-family:var(--font-ui);font-size:0.68rem;letter-spacing:0.08em;
                    text-transform:uppercase;color:var(--text-3);margin-bottom:6px;">${q.type}</div>
        <div style="font-family:var(--font-body);font-size:1.1rem;font-weight:400;
                    color:var(--text);margin-bottom:10px;line-height:1.6;">${q.question}</div>
        <textarea style="width:100%;background:var(--bg-3);border:1.5px solid var(--border);
                         border-radius:var(--radius);padding:12px 14px;font-family:var(--font-body);
                         font-size:0.95rem;color:var(--text);outline:none;resize:none;
                         min-height:70px;-webkit-appearance:none;" placeholder="Your response…"></textarea>
      </div>
    `).join('')}
    <button class="btn btn-primary" id="ref-done" style="margin-top:6px;">Done</button>
    <button id="ref-skip" style="background:none;border:none;color:var(--text-3);font-family:var(--font-ui);
                                  font-size:0.8rem;cursor:pointer;padding:12px 8px;text-align:center;">Skip</button>
  `;

  document.getElementById('app').appendChild(overlay);

  const finish = async () => {
    overlay.remove();
    homeScreen.classList.add('active');
    await loadAndShowHome();
  };
  overlay.querySelector('#ref-done')?.addEventListener('click', finish);
  overlay.querySelector('#ref-skip')?.addEventListener('click', finish);
}

// ── Lesson ────────────────────────────────────────────
function showLesson(node, homeScreen) {
  if (!node.lesson) return;

  if (ttsSynth) ttsSynth.cancel();

  // Hide the bottom nav while in lesson
  document.querySelector('.bottom-nav')?.remove();

  homeScreen.classList.remove('active');

  const lessonScreen = renderLesson(node, userData, {
    onBack: () => {
      lessonScreen.classList.remove('active');
      lessonScreen.classList.add('exit');
      setTimeout(() => {
        lessonScreen.remove();
        homeScreen.classList.add('active');
      }, 350);
    },
    onTTS: (text) => handleTTS(text),
    onComplete: async (result) => {
      const uid = currentUser().uid;

      await saveCompletion(uid, node.lesson.id, {
        nodeId: node.id, score: result.score, answers: result.answers
      });
      if (result.feedback?.stars || result.feedback?.text) {
        await saveFeedback(uid, node.lesson.id, result.feedback);
      }

      // Track struggles per question type
      for (const a of (result.answers || [])) {
        await recordStruggle(uid, a.type, a.correct);
      }

      // Add lesson questions to review deck
      if (node.lesson.questions) {
        const newCards = node.lesson.questions.map(q => conceptToCard(q, node.lesson.id, node.title));
        const existing = await getReviewDeck(uid);
        const merged   = [...existing, ...newCards.filter(c => !existing.find(e => e.id === c.id))];
        await saveReviewDeck(uid, merged);
        reviewDeck = merged;
      }

      await awardXp(uid, result.xpEarned);
      await recordLessonDone(uid);

      // Mark node complete and unlock next
      pathNodes = await markNodeComplete(uid, node.id, pathNodes);
      userData  = await getUser(uid);

      // Check if spaced review is due
      const due = getDueCards(reviewDeck);
      if (due.length >= 3) {
        renderReviewSession(reviewDeck, async ({ updatedDeck }) => {
          reviewDeck = updatedDeck;
          await saveReviewDeck(uid, updatedDeck);
          await postLessonFlow(uid);
        });
      } else {
        await postLessonFlow(uid);
      }

      async function postLessonFlow(uid) {
        // Interest pulse check
        if (shouldShowPulse(userData)) {
          const seen     = userData.fingerprint?.seenPulseIndices || [];
          const pairData = getPulsePairs(seen);
          renderInterestPulse(pairData, async ({ domainWins, seenIndices: newSeen }) => {
            const updated = mergeInterestSignal(userData.fingerprint || {}, domainWins);
            updated.seenPulseIndices = [...seen, ...newSeen].slice(-30);
            await saveInterestFingerprint(uid, updated);
            userData = await getUser(uid);
            returnHome();
          });
        } else {
          returnHome();
        }
      }

      function returnHome() {
        lessonScreen.classList.remove('active');
        lessonScreen.classList.add('exit');
        setTimeout(() => { lessonScreen.remove(); loadAndShowHome(); }, 350);
      }
    }
  });

  mount(lessonScreen);
  setTimeout(() => lessonScreen.classList.add('active'), 20);
}

// ── TTS ───────────────────────────────────────────────
function handleTTS(text) {
  if (!ttsSynth) return;

  if (ttsActive) {
    ttsSynth.cancel();
    ttsActive = false;
    return;
  }

  const utterance     = new SpeechSynthesisUtterance(text);
  utterance.rate      = 0.92;
  utterance.pitch     = 1;
  utterance.volume    = 1;

  // Prefer a natural voice
  const voices = ttsSynth.getVoices();
  const preferred = voices.find(v =>
    v.lang.startsWith('en') && !v.name.includes('Google') && v.localService
  ) || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;

  utterance.onend  = () => { ttsActive = false; };
  utterance.onerror = () => { ttsActive = false; };

  ttsActive = true;
  ttsSynth.speak(utterance);
}

// ── Navigation ────────────────────────────────────────
function addBottomNav(homeScreen) {
  document.querySelector('.bottom-nav')?.remove();

  const nav = document.createElement('div');
  nav.className = 'bottom-nav';

  // Desktop gets a wordmark at top of sidebar
  const isDesktop = window.innerWidth >= 768;

  nav.innerHTML = `
    ${isDesktop ? '<span class="nav-wordmark">Aristotle</span>' : ''}
    <div class="nav-item active" data-tab="home">
      <div class="nav-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 8.5L10 3l7 5.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V8.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
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
          <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
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
      if (ttsSynth) ttsSynth.cancel();

      if (tab === 'home') {
        await loadAndShowHome();
      } else if (tab === 'shelf') {
        const uid       = currentUser()?.uid;
        const completed = uid ? await getCompletedUnits(uid) : [];
        const s = renderShelf(completed, []);
        showScreen(s);
        document.getElementById('app').appendChild(nav);
      } else if (tab === 'profile') {
        const s = renderProfile(userData || {});
        showScreen(s);
        document.getElementById('app').appendChild(nav);
      }
    });
  });
}

// ── Utilities ─────────────────────────────────────────
function mount(screen) { document.getElementById('app').appendChild(screen); }

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => {
    if (s !== screen) {
      s.classList.remove('active'); s.classList.add('exit');
      setTimeout(() => s.remove(), 400);
    }
  });
  mount(screen);
  setTimeout(() => screen.classList.add('active'), 20);
}
