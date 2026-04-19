// Paginated e-reader — page-turn style

export function renderReader(chapter, book, { onComplete, onBack }) {
  const overlay = document.createElement('div');
  overlay.id = 'reader-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:500;
    background:#1a1710;
    display:flex;flex-direction:column;
    opacity:0;transition:opacity 0.3s;
  `;

  // Parse content into pages of ~350 words each
  const words    = chapter.content.replace(/\n+/g, ' ').split(/\s+/).filter(Boolean);
  const pageSize = 300;
  const pages    = [];
  for (let i = 0; i < words.length; i += pageSize) {
    pages.push(words.slice(i, i + pageSize).join(' '));
  }
  if (pages.length === 0) pages.push(chapter.content);

  let currentPage  = 0;
  let fontSize     = 1.15;
  const totalPages = pages.length;

  overlay.innerHTML = `
    <div id="reader-header" style="
      display:flex;align-items:center;justify-content:space-between;
      padding:calc(env(safe-area-inset-top,0px)+12px) 20px 12px;
      border-bottom:1px solid rgba(255,255,255,0.06);
      flex-shrink:0;
    ">
      <button id="reader-back" style="
        background:none;border:none;color:rgba(255,255,255,0.4);
        font-family:var(--font-ui);font-size:0.82rem;cursor:pointer;
        padding:6px 0;min-width:44px;min-height:44px;
        display:flex;align-items:center;
        -webkit-tap-highlight-color:transparent;
      ">← Back</button>

      <div style="text-align:center;flex:1;padding:0 12px;">
        <div style="font-family:var(--font-ui);font-size:0.68rem;
                    letter-spacing:0.08em;text-transform:uppercase;
                    color:rgba(255,255,255,0.3);">${book.title}</div>
        <div style="font-family:var(--font-ui);font-size:0.72rem;
                    color:rgba(255,255,255,0.4);margin-top:2px;">${chapter.title}</div>
      </div>

      <button id="reader-font" style="
        background:none;border:none;color:rgba(255,255,255,0.4);
        font-family:var(--font-ui);font-size:0.85rem;cursor:pointer;
        padding:6px 0;min-width:44px;min-height:44px;
        -webkit-tap-highlight-color:transparent;
      ">Aa</button>
    </div>

    <!-- Progress bar -->
    <div style="height:2px;background:rgba(255,255,255,0.05);flex-shrink:0;">
      <div id="reader-progress" style="
        height:100%;background:#c4a44a;width:0%;transition:width 0.4s;
      "></div>
    </div>

    <!-- Page content -->
    <div id="reader-page" style="
      flex:1;display:flex;flex-direction:column;
      padding:28px 24px 0;
      max-width:680px;margin:0 auto;width:100%;
      overflow:hidden;
    ">
      <div id="reader-text" style="
        font-family:'Crimson Pro',Georgia,serif;
        font-size:${fontSize}rem;line-height:1.9;
        color:rgba(240,232,213,0.88);
        letter-spacing:0.01em;
        flex:1;overflow-y:auto;
        -webkit-overflow-scrolling:touch;
        padding-bottom:16px;
      "></div>
    </div>

    <!-- Navigation -->
    <div style="
      display:flex;align-items:center;justify-content:space-between;
      padding:16px 24px calc(env(safe-area-inset-bottom,0px)+16px);
      max-width:680px;margin:0 auto;width:100%;
      flex-shrink:0;
    ">
      <button id="page-prev" style="
        background:var(--bg-3);border:1px solid rgba(255,255,255,0.1);
        border-radius:10px;padding:10px 18px;
        font-family:var(--font-ui);font-size:0.85rem;
        color:rgba(255,255,255,0.5);cursor:pointer;
        -webkit-tap-highlight-color:transparent;
        min-height:44px;min-width:80px;
      ">← Prev</button>

      <div id="page-indicator" style="
        font-family:var(--font-ui);font-size:0.75rem;
        color:rgba(255,255,255,0.3);
      ">1 / ${totalPages}</div>

      <button id="page-next" style="
        background:var(--bg-3);border:1px solid rgba(255,255,255,0.1);
        border-radius:10px;padding:10px 18px;
        font-family:var(--font-ui);font-size:0.85rem;
        color:rgba(255,255,255,0.7);cursor:pointer;
        -webkit-tap-highlight-color:transparent;
        min-height:44px;min-width:80px;
        transition:background 0.2s;
      ">Next →</button>
    </div>
  `;

  function updatePage(idx) {
    currentPage = Math.max(0, Math.min(idx, totalPages - 1));
    const pct   = ((currentPage + 1) / totalPages) * 100;

    const textEl = overlay.querySelector('#reader-text');
    const progEl = overlay.querySelector('#reader-progress');
    const indEl  = overlay.querySelector('#page-indicator');
    const prevBtn = overlay.querySelector('#page-prev');
    const nextBtn = overlay.querySelector('#page-next');

    // Animate page turn
    if (textEl) {
      textEl.style.opacity = '0';
      textEl.style.transform = 'translateX(20px)';
      setTimeout(() => {
        textEl.innerHTML = formatPage(pages[currentPage]);
        textEl.style.transition = 'opacity 0.2s, transform 0.2s';
        textEl.style.opacity    = '1';
        textEl.style.transform  = 'none';
        textEl.scrollTop        = 0;
      }, 150);
    }

    if (progEl) progEl.style.width = pct + '%';
    if (indEl)  indEl.textContent = `${currentPage + 1} / ${totalPages}`;

    if (prevBtn) {
      prevBtn.style.opacity       = currentPage === 0 ? '0.3' : '1';
      prevBtn.style.pointerEvents = currentPage === 0 ? 'none' : 'all';
    }

    // Last page: next button becomes "Done"
    if (nextBtn) {
      if (currentPage === totalPages - 1) {
        nextBtn.textContent    = 'Done ✓';
        nextBtn.style.background = '#c4a44a';
        nextBtn.style.color      = '#1a1610';
        nextBtn.style.border     = 'none';
        nextBtn.style.fontWeight = '500';
      } else {
        nextBtn.textContent    = 'Next →';
        nextBtn.style.background = 'var(--bg-3)';
        nextBtn.style.color      = 'rgba(255,255,255,0.7)';
        nextBtn.style.border     = '1px solid rgba(255,255,255,0.1)';
        nextBtn.style.fontWeight = '400';
      }
    }
  }

  function formatPage(text) {
    return text.split(/\n\n+/).map(p =>
      `<p style="margin-bottom:1.5em;">${p.trim()}</p>`
    ).join('');
  }

  // Touch/swipe support
  let touchStartX = 0;
  overlay.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx < 0) handleNext();
      else handlePrev();
    }
  });

  function handleNext() {
    if (currentPage < totalPages - 1) {
      updatePage(currentPage + 1);
    } else {
      dismiss();
      onComplete();
    }
  }

  function handlePrev() {
    if (currentPage > 0) updatePage(currentPage - 1);
  }

  overlay.querySelector('#page-next')?.addEventListener('click', handleNext);
  overlay.querySelector('#page-prev')?.addEventListener('click', handlePrev);
  overlay.querySelector('#reader-back')?.addEventListener('click', () => { dismiss(); onBack(); });

  overlay.querySelector('#reader-font')?.addEventListener('click', () => {
    const sizes = [1, 1.15, 1.3];
    const idx   = sizes.findIndex(s => Math.abs(s - fontSize) < 0.05);
    fontSize    = sizes[(idx + 1) % sizes.length];
    const textEl = overlay.querySelector('#reader-text');
    if (textEl) textEl.style.fontSize = fontSize + 'rem';
  });

  function dismiss() {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }

  document.getElementById('app').appendChild(overlay);
  setTimeout(() => {
    overlay.style.opacity = '1';
    updatePage(0);
  }, 20);

  return overlay;
}
