import { signOutUser } from '../firebase.js';

export function renderProfile(userData) {
  const screen = document.createElement('div');
  screen.className = 'screen profile-screen';
  screen.id = 'screen-profile';

  const initial  = (userData.displayName || 'A').charAt(0).toUpperCase();
  const joined   = userData.joined?.toDate
    ? userData.joined.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const vocab    = userData.vocabLevel;
  const vocabLabel = vocab ? `${vocab.label} (${vocab.level}/5)` : 'Not assessed';

  const completedCount = userData.completedLessons?.length || 0;
  const xp             = userData.xp || 0;
  const level          = userData.xpLevel || 1;
  const streak         = userData.streak || 0;

  screen.innerHTML = `
    <div class="profile-avatar">${initial}</div>
    <div class="profile-name">${userData.displayName || 'Reader'}</div>
    <div class="profile-since">Member since ${joined}</div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">🔥 ${streak}</div>
        <div class="stat-label">Day streak</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${xp}</div>
        <div class="stat-label">Total XP</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${level}</div>
        <div class="stat-label">Level</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${completedCount}</div>
        <div class="stat-label">Lessons done</div>
      </div>
    </div>

    <div style="background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius-lg);
                padding:18px;margin-bottom:24px;">
      <div style="font-family:var(--font-ui);font-size:0.7rem;font-weight:500;letter-spacing:0.08em;
                  text-transform:uppercase;color:var(--text-3);margin-bottom:12px;">Reading level</div>
      <div style="font-family:var(--font-body);font-size:1.05rem;color:var(--text);">${vocabLabel}</div>
      <div style="font-family:var(--font-ui);font-size:0.78rem;color:var(--text-3);margin-top:4px;">
        Based on vocabulary assessment and reading history
      </div>
    </div>

    <div style="background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius-lg);
                padding:18px;margin-bottom:32px;">
      <div style="font-family:var(--font-ui);font-size:0.7rem;font-weight:500;letter-spacing:0.08em;
                  text-transform:uppercase;color:var(--text-3);margin-bottom:12px;">Top interests</div>
      <div style="font-family:var(--font-body);font-size:1rem;color:var(--text);line-height:1.7;">
        ${(userData.onboarding?.interests || []).slice(0, 5).join(', ') || 'Not yet determined'}
      </div>
    </div>

    <button class="btn btn-ghost" id="sign-out-btn" style="max-width:240px;">
      Sign out
    </button>
  `;

  screen.querySelector('#sign-out-btn')?.addEventListener('click', async () => {
    await signOutUser();
    location.reload();
  });

  return screen;
}
