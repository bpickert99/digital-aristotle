import { getPulsePairs } from '../coursePairs.js';

// Show the pulse after lesson completion.
// pairData: array of { pair, index } from getPulsePairs()
// onComplete: callback with { domainWins, seenIndices }
export function renderInterestPulse(pairData, onComplete) {
  const overlay = document.createElement('div');
  overlay.id = 'interest-pulse';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: var(--bg);
    z-index: 400; display: flex; flex-direction: column;
    padding: calc(env(safe-area-inset-top,0px) + 32px) 24px
             calc(env(safe-area-inset-bottom,0px) + 32px);
    opacity: 0; transition: opacity 0.35s;
  `;

  let pairIndex    = 0;
  const domainWins = {};
  const seenIdxs   = pairData.map(p => p.index);

  function renderPair(idx) {
    const { pair } = pairData[idx];
    const total     = pairData.length;

    const dots = pairData.map((_, i) => `
      <div class="pair-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}"></div>
    `).join('');

    overlay.innerHTML = `
      <div style="margin-bottom:24px;">
        <div style="font-family:var(--font-ui);font-size:0.68rem;font-weight:500;
                    letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);
                    margin-bottom:10px;">
          Quick question
        </div>
        <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:400;
                    line-height:1.25;color:var(--text);margin-bottom:6px;">
          Which sounds more interesting right now?
        </div>
        <div style="font-family:var(--font-body);font-size:0.9rem;font-weight:300;
                    color:var(--text-3);font-style:italic;">
          ${idx + 1} of ${total}
        </div>
      </div>

      <div class="pair-dots" style="margin-bottom:28px;">${dots}</div>

      <div class="pair-card" id="pulse-a" data-choice="0"
           style="margin-bottom:0;">
        <div class="pair-course-title">${pair[0].title}</div>
        <div class="pair-course-desc">${pair[0].desc}</div>
      </div>

      <div class="pair-or">or</div>

      <div class="pair-card" id="pulse-b" data-choice="1">
        <div class="pair-course-title">${pair[1].title}</div>
        <div class="pair-course-desc">${pair[1].desc}</div>
      </div>

      <button id="pulse-skip" style="
        background:none;border:none;color:var(--text-3);
        font-family:var(--font-ui);font-size:0.8rem;
        cursor:pointer;padding:16px 8px 0;text-align:center;
        -webkit-tap-highlight-color:transparent;margin-top:auto;
      ">Skip</button>
    `;

    overlay.querySelectorAll('.pair-card').forEach(card => {
      card.addEventListener('click', () => {
        const choiceIdx = parseInt(card.dataset.choice);
        const chosen    = pair[choiceIdx];
        domainWins[chosen.domain] = (domainWins[chosen.domain] || 0) + 1;

        card.classList.add('selected');
        setTimeout(() => advance(), 280);
      });
    });

    overlay.querySelector('#pulse-skip')?.addEventListener('click', advance);
  }

  function advance() {
    pairIndex++;
    if (pairIndex < pairData.length) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        renderPair(pairIndex);
        overlay.style.opacity = '1';
      }, 200);
    } else {
      finish();
    }
  }

  function finish() {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      onComplete({ domainWins, seenIndices: seenIdxs });
    }, 350);
  }

  renderPair(0);
  document.getElementById('app').appendChild(overlay);
  setTimeout(() => overlay.style.opacity = '1', 20);
}

// ── Trigger logic ─────────────────────────────────────
// Returns true if a pulse should be shown after this lesson completion.
export function shouldShowPulse(userData) {
  const completedCount = userData.completedLessons?.length || 0;
  const lastPulse      = userData.lastPulseAt?.toDate?.() || null;
  const now            = new Date();

  // Must have at least 3 completed lessons before first pulse
  if (completedCount < 3) return false;

  // After that: show every 10 lessons
  if (completedCount % 10 !== 0) return false;

  // Minimum 7 days since last pulse
  if (lastPulse) {
    const daysSince = (now - lastPulse) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return false;
  }

  return true;
}

// ── Interest fingerprint update ───────────────────────
// Merges new pulse wins into existing fingerprint with recency weighting.
// Recent wins count fully; older wins decay by ~50% every 90 days.
export function mergeInterestSignal(existingFingerprint, newWins, timestamp = new Date()) {
  const updated = { ...existingFingerprint };

  // Decay existing signals
  const now = timestamp.getTime();
  Object.keys(updated.domainScores || {}).forEach(domain => {
    const entry    = updated.domainScores[domain];
    const ageMs    = now - (entry.lastUpdated || now);
    const ageDays  = ageMs / (1000 * 60 * 60 * 24);
    const decayFactor = Math.pow(0.5, ageDays / 90); // half-life 90 days
    entry.score   *= decayFactor;
    entry.lastUpdated = now;
  });

  // Add new wins at full weight
  Object.entries(newWins).forEach(([domain, wins]) => {
    if (!updated.domainScores) updated.domainScores = {};
    if (!updated.domainScores[domain]) {
      updated.domainScores[domain] = { score: 0, lastUpdated: now };
    }
    updated.domainScores[domain].score      += wins;
    updated.domainScores[domain].lastUpdated = now;
  });

  // Re-derive ranked interests
  updated.interests = Object.entries(updated.domainScores || {})
    .sort((a, b) => b[1].score - a[1].score)
    .map(([domain]) => domain);

  return updated;
}
