import { getDueCards, reviewCard } from '../spaced.js';

// Review session — shown periodically after lesson completion
export function renderReviewSession(deck, onComplete) {
  const dueCards = getDueCards(deck).slice(0, 8); // max 8 per session

  if (dueCards.length === 0) {
    onComplete({ updatedDeck: deck, reviewed: 0 });
    return null;
  }

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:var(--bg);z-index:500;
    display:flex;flex-direction:column;
    padding:calc(env(safe-area-inset-top,0px)+32px) 20px
            calc(env(safe-area-inset-bottom,0px)+24px);
    overflow-y:auto;opacity:0;transition:opacity 0.3s;
  `;

  let currentIdx  = 0;
  let flipped     = false;
  let updatedDeck = [...deck];

  function renderCard(idx) {
    const card  = dueCards[idx];
    const total = dueCards.length;
    const pct   = Math.round((idx / total) * 100);

    overlay.innerHTML = `
      <div style="font-family:var(--font-ui);font-size:0.68rem;font-weight:500;
                  letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:8px;">
        Review session
      </div>
      <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:400;margin-bottom:6px;">
        ${idx + 1} of ${total}
      </div>
      <div style="height:3px;background:var(--border-2);border-radius:2px;overflow:hidden;margin-bottom:28px;">
        <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px;"></div>
      </div>

      <div class="review-item" id="review-card">
        <div style="font-family:var(--font-ui);font-size:0.68rem;letter-spacing:0.08em;
                    text-transform:uppercase;color:var(--text-3);margin-bottom:8px;">
          ${card.type}
        </div>
        <div class="review-front">${card.front}</div>
        <div class="review-back" id="review-back">${card.back}</div>
        <div id="review-actions">
          <button class="btn btn-ghost" id="show-answer" style="margin-top:8px;">
            Show answer
          </button>
        </div>
      </div>

      <button id="review-skip" style="
        background:none;border:none;color:var(--text-3);
        font-family:var(--font-ui);font-size:0.8rem;cursor:pointer;
        padding:16px 8px;text-align:center;
      ">End review early</button>
    `;

    overlay.querySelector('#show-answer')?.addEventListener('click', () => {
      overlay.querySelector('#review-back').classList.add('visible');
      overlay.querySelector('#review-actions').innerHTML = `
        <div style="font-family:var(--font-ui);font-size:0.72rem;color:var(--text-3);
                    text-align:center;margin-bottom:10px;margin-top:14px;">How well did you know this?</div>
        <div class="review-btns">
          <button class="review-btn-hard" data-q="2">Hard</button>
          <button class="review-btn-good" data-q="4">Good</button>
          <button class="review-btn-easy" data-q="5">Easy</button>
        </div>
      `;

      overlay.querySelectorAll('[data-q]').forEach(btn => {
        btn.addEventListener('click', () => {
          const quality  = parseInt(btn.dataset.q);
          const original = deck.find(c => c.id === card.id);
          if (original) {
            const updated  = reviewCard(original, quality);
            const deckIdx  = updatedDeck.findIndex(c => c.id === card.id);
            if (deckIdx >= 0) updatedDeck[deckIdx] = updated;
          }

          currentIdx++;
          if (currentIdx < dueCards.length) {
            renderCard(currentIdx);
          } else {
            finish();
          }
        });
      });
    });

    overlay.querySelector('#review-skip')?.addEventListener('click', finish);
  }

  function finish() {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      onComplete({ updatedDeck, reviewed: currentIdx });
    }, 300);
  }

  renderCard(0);
  document.getElementById('app').appendChild(overlay);
  setTimeout(() => overlay.style.opacity = '1', 20);
  return overlay;
}
