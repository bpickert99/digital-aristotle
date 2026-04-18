import {
  onAuthChange, signInWithGoogle, currentUser,
  getUser, createUser, saveOnboarding,
  saveUnits, getUnits,
  saveCompletion, saveFeedback,
  awardXp, updateStreak, saveInterestFingerprint
} from './firebase.js';
import { generateCurriculum }  from './api.js';
import { renderOnboarding }    from './screens/onboarding.js';
import { renderGenerating }    from './screens/generating.js';
import { renderHome }          from './screens/home.js';
import { renderLesson }        from './screens/lesson.js';
import {
  renderInterestPulse,
  shouldShowPulse,
  mergeInterestSignal
} from './screens/interestPulse.js';
import { getPulsePairs } from './coursePairs.js';

// ── State ────────────────────────────────────────────
let userData = null;
let units    = [];

// ── Boot ─────────────────────────────────────────────
window.addEventListener('load', () => {
  hideSplash();
  onAuthChange(handleAuthChange);
});

function hideSplash() {
  // Splash auto-hides after auth resolves (see handleAuthChange)
}

async function handleAuthChange(user) {
  const splash = document.querySelector('.splash');

  if (!user) {
    if (splash) splash.classList.add('hidden');
    showScreen(buildAuthScreen());
    return;
  }

  // User is signed in — load their data
  let data = await getUser(user.uid);

  if (!data) {
    // First sign-in: create user document
    await createUser(user.uid, { displayName: user.displayName });
    data = await getUser(user.uid);
  }

  userData = data;

  if (splash) splash.classList.add('hidden');

  if (!data.onboarded) {
    showOnboarding();
  } else {
    await loadAndShowHome();
  }
}

// ── Auth screen ──────────────────────────────────────
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
    </div>
  `;

  screen.querySelector('#sign-in-btn')?.addEventListener('click', async () => {
    const btn = screen.querySelector('#sign-in-btn');
    const err = screen.querySelector('#auth-error');
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      await signInWithGoogle();
      // onAuthChange will handle the rest
    } catch (e) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google`;
      if (err) { err.textContent = 'Sign-in failed. Please try again.'; err.style.display = 'block'; }
    }
  });

  return screen;
}

// ── Onboarding ───────────────────────────────────────
function showOnboarding() {
  const obScreen = renderOnboarding({}, async (profile) => {
    // Transition to generating screen
    obScreen.classList.remove('active');
    obScreen.classList.add('exit');

    const genScreen = renderGenerating();
    mount(genScreen);
    setTimeout(() => genScreen.classList.add('active'), 20);

    try {
      // Save onboarding to Firestore
      const uid = currentUser().uid;
      await saveOnboarding(uid, profile);

      // Generate curriculum via Claude API
      const curriculum = await generateCurriculum(profile);
      units = curriculum.units;

      // Save generated units
      await saveUnits(uid, units);

      // Refresh user data
      userData = await getUser(uid);

      // Transition to home
      if (genScreen._stopMessages) genScreen._stopMessages();
      genScreen.classList.remove('active');
      genScreen.classList.add('exit');

      await loadAndShowHome();

    } catch (err) {
      console.error('Curriculum generation failed:', err);
      showGenerationError(genScreen);
    }
  });

  showScreen(obScreen);
}

function showGenerationError(genScreen) {
  genScreen.innerHTML = `
    <div class="error-title">Something went wrong.</div>
    <p class="error-msg">The curriculum couldn't be generated. Check your Worker URL and API key configuration.</p>
    <button class="btn btn-primary" onclick="location.reload()" style="max-width:280px;margin-top:8px;">
      Try again
    </button>
  `;
  genScreen.classList.add('error-screen');
}

// ── Home ─────────────────────────────────────────────
async function loadAndShowHome() {
  if (!units.length) {
    const uid  = currentUser().uid;
    const data = await getUnits(uid);
    if (data) units = data;
  }

  if (!userData) {
    userData = await getUser(currentUser().uid);
  }

  const homeScreen = renderHome(userData, units, (unit) => {
    showLesson(unit, homeScreen);
  });

  showScreen(homeScreen);
  addBottomNav(homeScreen);
}

// ── Lesson ───────────────────────────────────────────
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

      // Save completion + feedback
      await saveCompletion(uid, unit.lesson.id, {
        unitId: unit.id,
        score: result.score,
        answers: result.answers
      });

      if (result.feedback?.stars || result.feedback?.text) {
        await saveFeedback(uid, unit.lesson.id, result.feedback);
      }

      // Award XP and update streak
      await awardXp(uid, result.xpEarned);
      await updateStreak(uid);

      // Refresh user data
      userData = await getUser(uid);

      // Check whether to show interest pulse before returning home
      if (shouldShowPulse(userData)) {
        const seenIndices = userData.fingerprint?.seenPulseIndices || [];
        const pairData    = getPulsePairs(seenIndices);

        renderInterestPulse(pairData, async ({ domainWins, seenIndices: newSeen }) => {
          // Merge new signals into fingerprint with decay
          const updated = mergeInterestSignal(
            userData.fingerprint || {},
            domainWins
          );
          updated.seenPulseIndices = [
            ...seenIndices,
            ...newSeen
          ].slice(-30); // keep last 30 so pairs eventually recycle

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

// ── Navigation ───────────────────────────────────────
function addBottomNav(homeScreen) {
  // Remove any existing nav
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
          <rect x="2" y="14" width="16" height="2" rx="1"
            stroke="currentColor" stroke-width="1.4"/>
          <rect x="4" y="6" width="3" height="8" rx="1"
            stroke="currentColor" stroke-width="1.4"/>
          <rect x="9" y="4" width="3" height="10" rx="1"
            stroke="currentColor" stroke-width="1.4"/>
          <rect x="14" y="7" width="3" height="7" rx="1"
            stroke="currentColor" stroke-width="1.4"/>
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
    </div>
  `;

  document.getElementById('app').appendChild(nav);

  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      nav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      // Tab switching (stub for now)
    });
  });
}

// ── Screen utilities ─────────────────────────────────
function mount(screen) {
  document.getElementById('app').appendChild(screen);
}

function showScreen(screen) {
  // Remove previous non-splash, non-nav screens
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
