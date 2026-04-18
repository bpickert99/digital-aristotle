import { getOnboardingPairs } from '../coursePairs.js';
import { getShuffledItems, scoreVocab } from '../vocab.js';

const COURSE_PAIRS = getOnboardingPairs();

export function renderOnboarding(state, onComplete) {
  let step      = 0; // 0=welcome, 1=pairs, 2=vocab
  let pairIndex = 0;
  const domainWins = {};
  const profile    = { interests: [], vocabLevel: null };

  const screen = document.createElement('div');
  screen.className = 'screen onboarding-screen';
  screen.id = 'screen-onboarding';

  function render() {
    screen.innerHTML = step === 0 ? buildWelcome()
                     : step === 1 ? buildPairScreen(pairIndex)
                     :              buildVocabScreen();
    attachListeners();
    setTimeout(() => screen.classList.add('active'), 20);
  }

  // ── Welcome ────────────────────────────────────────
  function buildWelcome() {
    return `
      <div class="ob-content">
        <div class="ob-label">Welcome</div>
        <h1 class="ob-heading">A private education<br>for the curious adult.</h1>
        <p class="ob-sub">A few quick choices to get started. The curriculum adapts from there.</p>
        <p style="font-family:var(--font-ui);font-size:0.85rem;font-weight:300;
                  color:var(--text-3);line-height:1.7;margin-top:4px;">
          Takes about two minutes.
        </p>
      </div>
      <div class="ob-footer">
        <button class="btn btn-primary" id="ob-begin">Begin</button>
      </div>`;
  }

  // ── Pair screen ────────────────────────────────────
  function buildPairScreen(idx) {
    const pair  = COURSE_PAIRS[idx];
    const total = COURSE_PAIRS.length;
    const dots  = Array.from({ length: total }, (_, i) => `
      <div class="pair-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}"></div>
    `).join('');

    return `
      <div class="ob-content" style="display:flex;flex-direction:column;min-height:100%;">
        <div class="ob-label">${idx + 1} of ${total}</div>
        <h2 class="ob-heading" style="margin-bottom:8px;">Which would you rather take?</h2>
        <p class="ob-sub" style="margin-bottom:18px;">Neither is a commitment.</p>
        <div class="pair-dots" style="margin-bottom:24px;">${dots}</div>
        <div class="pair-card" data-choice="0">
          <div class="pair-course-title">${pair[0].title}</div>
          <div class="pair-course-desc">${pair[0].desc}</div>
        </div>
        <div class="pair-or">or</div>
        <div class="pair-card" data-choice="1">
          <div class="pair-course-title">${pair[1].title}</div>
          <div class="pair-course-desc">${pair[1].desc}</div>
        </div>
        <button class="ob-skip" id="ob-skip" style="margin-top:auto;padding-top:20px;">
          Skip this one
        </button>
      </div>`;
  }

  // ── Vocab screen ───────────────────────────────────
  let vocabItems  = [];
  let vocabChecked = new Set();

  function buildVocabScreen() {
    vocabItems   = getShuffledItems();
    vocabChecked = new Set();

    const wordHtml = vocabItems.map(item => `
      <div class="vocab-item" data-word="${item.word}">
        <div class="vocab-check"><div class="vocab-checkmark"></div></div>
        <span class="vocab-word">${item.word}</span>
      </div>
    `).join('');

    return `
      <div class="ob-content">
        <div class="ob-label">Last step</div>
        <h2 class="ob-heading" style="margin-bottom:8px;">Check every word whose meaning you know for sure.</h2>
        <p class="ob-sub" style="margin-bottom:24px;">
          If you know at least one definition, check it. Skip anything uncertain.
        </p>
        <div class="vocab-grid">${wordHtml}</div>
      </div>
      <div class="ob-footer">
        <button class="btn btn-primary" id="vocab-done">Build my curriculum</button>
      </div>`;
  }

  // ── Listeners ──────────────────────────────────────
  function attachListeners() {
    screen.querySelector('#ob-begin')?.addEventListener('click', () => {
      step = 1;
      transitionTo(() => buildPairScreen(pairIndex));
    });

    screen.querySelectorAll('.pair-card').forEach(card => {
      card.addEventListener('click', () => {
        const chosen = COURSE_PAIRS[pairIndex][parseInt(card.dataset.choice)];
        domainWins[chosen.domain] = (domainWins[chosen.domain] || 0) + 1;
        card.classList.add('selected');
        setTimeout(advancePair, 280);
      });
    });

    screen.querySelector('#ob-skip')?.addEventListener('click', advancePair);

    screen.querySelectorAll('.vocab-item').forEach(el => {
      el.addEventListener('click', () => {
        const word = el.dataset.word;
        if (vocabChecked.has(word)) vocabChecked.delete(word);
        else vocabChecked.add(word);
        el.classList.toggle('checked', vocabChecked.has(word));
      });
    });

    screen.querySelector('#vocab-done')?.addEventListener('click', () => {
      const result = scoreVocab([...vocabChecked], vocabItems);
      profile.vocabLevel = result;
      onComplete(profile);
    });
  }

  function advancePair() {
    pairIndex++;
    if (pairIndex < COURSE_PAIRS.length) {
      transitionTo(() => buildPairScreen(pairIndex));
    } else {
      profile.interests = Object.entries(domainWins)
        .sort((a, b) => b[1] - a[1])
        .map(([domain]) => domain);
      step = 2;
      transitionTo(() => buildVocabScreen());
    }
  }

  function transitionTo(buildFn) {
    const content = screen.querySelector('.ob-content');
    if (content) {
      content.style.transition = 'opacity 0.18s, transform 0.18s';
      content.style.opacity    = '0';
      content.style.transform  = 'translateX(-10px)';
    }
    setTimeout(() => {
      screen.innerHTML = buildFn();
      attachListeners();
      const next = screen.querySelector('.ob-content');
      if (next) {
        next.style.transition = 'none';
        next.style.opacity    = '0';
        next.style.transform  = 'translateX(12px)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          next.style.transition = 'opacity 0.25s, transform 0.25s';
          next.style.opacity    = '1';
          next.style.transform  = 'none';
        }));
      }
    }, 200);
  }

  render();
  return screen;
}
