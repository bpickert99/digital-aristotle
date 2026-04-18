import { getShuffledItems, scoreVocab } from '../vocab.js';

// Renders the vocabulary check screen
// onComplete: called with { level, label, checked }
export function renderVocabTest(onComplete) {
  const items   = getShuffledItems();
  const checked = new Set();

  const screen = document.createElement('div');
  screen.className = 'screen onboarding-screen';
  screen.id = 'screen-vocab';

  function build() {
    const wordHtml = items.map(item => `
      <div class="vocab-item ${checked.has(item.word) ? 'checked' : ''}"
           data-word="${item.word}">
        <div class="vocab-check">
          <div class="vocab-checkmark"></div>
        </div>
        <span class="vocab-word">${item.word}</span>
      </div>
    `).join('');

    screen.innerHTML = `
      <div class="ob-content">
        <div class="ob-label">One more thing</div>
        <h2 class="ob-heading" style="margin-bottom:8px;">Check every word whose meaning you know for sure.</h2>
        <p class="ob-sub" style="margin-bottom:24px;">
          If you know at least one definition, check it. If you're not sure, leave it blank.
        </p>
        <div class="vocab-grid">${wordHtml}</div>
      </div>
      <div class="ob-footer">
        <button class="btn btn-primary" id="vocab-done">Done</button>
      </div>
    `;

    screen.querySelectorAll('.vocab-item').forEach(el => {
      el.addEventListener('click', () => {
        const word = el.dataset.word;
        if (checked.has(word)) checked.delete(word);
        else checked.add(word);
        el.classList.toggle('checked', checked.has(word));
      });
    });

    screen.querySelector('#vocab-done')?.addEventListener('click', () => {
      const result = scoreVocab([...checked], items);
      onComplete(result);
    });
  }

  build();
  return screen;
}
