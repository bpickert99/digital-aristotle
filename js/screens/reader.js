// Paper-style e-reader with page-turn animation
// Measures actual rendered text to paginate without cutoff

export function renderReader(chapter, book, { onComplete, onBack }) {
  const overlay = document.createElement('div');
  overlay.id = 'reader-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:500;
    background:#2a251f;
    display:flex;flex-direction:column;
    opacity:0;transition:opacity 0.3s;
  `;

  let fontSize    = 18;  // px
  let pages       = [];
  let currentPage = 0;

  overlay.innerHTML = `
    <!-- Header -->
    <div style="
      display:flex;align-items:center;justify-content:space-between;
      padding:calc(env(safe-area-inset-top,0px)+12px) 20px 12px;
      background:#2a251f;flex-shrink:0;
      border-bottom:1px solid rgba(255,255,255,0.05);
    ">
      <button id="reader-back" style="
        background:none;border:none;color:rgba(255,255,255,0.5);
        font-family:var(--font-ui);font-size:0.85rem;cursor:pointer;
        padding:8px 12px 8px 0;min-height:44px;
        display:flex;align-items:center;gap:4px;
        -webkit-tap-highlight-color:transparent;
      ">← Back</button>

      <div style="text-align:center;flex:1;padding:0 12px;">
        <div style="font-family:var(--font-ui);font-size:0.68rem;
                    letter-spacing:0.1em;text-transform:uppercase;
                    color:rgba(255,255,255,0.35);">${escapeHtml(book.title)}</div>
        <div style="font-family:var(--font-body);font-size:0.82rem;font-style:italic;
                    color:rgba(255,255,255,0.45);margin-top:3px;">${escapeHtml(chapter.title)}</div>
      </div>

      <button id="reader-font" style="
        background:none;border:none;color:rgba(255,255,255,0.5);
        font-family:var(--font-ui);font-size:0.95rem;cursor:pointer;
        padding:8px 0 8px 12px;min-height:44px;min-width:44px;
        -webkit-tap-highlight-color:transparent;
      ">Aa</button>
    </div>

    <!-- Page area -->
    <div id="page-area" style="
      flex:1;
      display:flex;align-items:center;justify-content:center;
      padding:16px 16px 0;
      overflow:hidden;
      perspective: 2000px;
      position:relative;
    ">
      <!-- The book page -->
      <div id="page-stage" style="
        position:relative;
        width:100%;max-width:600px;height:100%;
        transform-style:preserve-3d;
      ">
        <div id="page-current" class="page-surface" style="
          position:absolute;inset:0;
          background:#f4ebd7;
          background-image:
            radial-gradient(circle at 15% 20%, rgba(139,122,90,0.04) 0%, transparent 40%),
            radial-gradient(circle at 85% 80%, rgba(139,122,90,0.03) 0%, transparent 45%);
          border-radius:4px 8px 8px 4px;
          box-shadow:
            0 2px 8px rgba(0,0,0,0.3),
            0 12px 30px rgba(0,0,0,0.4),
            inset 4px 0 6px -4px rgba(0,0,0,0.15);
          padding:32px 32px 32px 40px;
          overflow:hidden;
          transform-origin:left center;
          transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);
          backface-visibility:hidden;
          display:flex;flex-direction:column;
        ">
          <div id="page-content" style="
            font-family:'Crimson Pro',Georgia,serif;
            font-size:${fontSize}px;
            line-height:1.75;
            color:#3a2817;
            letter-spacing:0.005em;
            flex:1;
            overflow:hidden;
            word-wrap:break-word;
          "></div>

          <div id="page-footer" style="
            flex-shrink:0;
            padding-top:12px;
            margin-top:12px;
            border-top:1px solid rgba(58,40,23,0.1);
            display:flex;justify-content:space-between;align-items:center;
            font-family:'Crimson Pro',Georgia,serif;
            font-size:12px;font-style:italic;
            color:rgba(58,40,23,0.45);
          ">
            <span>${escapeHtml(book.author)}</span>
            <span id="page-num">1</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom nav -->
    <div style="
      display:flex;align-items:center;justify-content:space-between;
      padding:14px 24px calc(env(safe-area-inset-bottom,0px)+14px);
      background:#2a251f;
      flex-shrink:0;
      gap:12px;
    ">
      <button id="page-prev" class="nav-btn" style="
        background:rgba(255,255,255,0.05);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:10px;padding:10px 18px;
        font-family:var(--font-ui);font-size:0.85rem;
        color:rgba(255,255,255,0.5);cursor:pointer;
        min-height:44px;min-width:90px;
        -webkit-tap-highlight-color:transparent;
        transition:background 0.15s, opacity 0.2s;
      ">← Prev</button>

      <div id="page-indicator" style="
        font-family:var(--font-ui);font-size:0.78rem;
        color:rgba(255,255,255,0.35);flex:1;text-align:center;
      ">1 / 1</div>

      <button id="page-next" class="nav-btn" style="
        background:rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.12);
        border-radius:10px;padding:10px 18px;
        font-family:var(--font-ui);font-size:0.85rem;font-weight:500;
        color:rgba(255,255,255,0.85);cursor:pointer;
        min-height:44px;min-width:90px;
        -webkit-tap-highlight-color:transparent;
        transition:all 0.2s;
      ">Next →</button>
    </div>

    <!-- Hidden measurement surface -->
    <div id="measure-page" style="
      position:absolute;left:-99999px;top:0;
      width:600px;
      padding:32px 32px 32px 40px;
      font-family:'Crimson Pro',Georgia,serif;
      font-size:${fontSize}px;
      line-height:1.75;
      color:#3a2817;
      letter-spacing:0.005em;
      word-wrap:break-word;
      visibility:hidden;
      pointer-events:none;
    "></div>
  `;

  document.getElementById('app').appendChild(overlay);

  // Paginate once DOM is ready
  requestAnimationFrame(() => {
    setTimeout(() => {
      overlay.style.opacity = '1';
      paginate();
      renderPage(0);
    }, 20);
  });

  // ── Pagination by measuring rendered height ──────────
  function paginate() {
    const pageEl    = overlay.querySelector('#page-current');
    const measureEl = overlay.querySelector('#measure-page');
    if (!pageEl || !measureEl) return;

    // Calculate available content height on a page
    const pageHeight   = pageEl.offsetHeight;
    const contentPad   = 32 + 32; // top + bottom padding of page
    const footerHeight = overlay.querySelector('#page-footer')?.offsetHeight || 40;
    const availHeight  = pageHeight - contentPad - footerHeight - 24;

    // Also size the measure element to match content width
    const contentWidth = pageEl.offsetWidth - 40 - 32; // left - right padding
    measureEl.style.width = contentWidth + 'px';

    // Clean text into paragraphs
    const paragraphs = chapter.content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .split(/\n\n+/)
      .map(p => p.replace(/\n/g, ' ').trim())
      .filter(p => p.length > 0);

    pages = [];
    let currentParas = [];

    const flushPage = () => {
      if (currentParas.length > 0) {
        pages.push(currentParas.join('\n\n'));
        currentParas = [];
      }
    };

    for (const para of paragraphs) {
      // Try adding this paragraph to current page
      const testContent = [...currentParas, para].join('\n\n');
      measureEl.innerHTML = formatParas(testContent.split('\n\n'));

      if (measureEl.offsetHeight <= availHeight) {
        currentParas.push(para);
      } else {
        // Paragraph doesn't fit — flush current page and start new
        if (currentParas.length > 0) {
          flushPage();
          // Now try the paragraph alone on a new page
          measureEl.innerHTML = formatParas([para]);
          if (measureEl.offsetHeight <= availHeight) {
            currentParas.push(para);
          } else {
            // Paragraph is too long for a page alone — split by sentences
            const sentences = para.split(/(?<=[.!?])\s+/);
            let subParas = [];
            for (const sent of sentences) {
              const test = [...subParas, sent].join(' ');
              measureEl.innerHTML = formatParas([test]);
              if (measureEl.offsetHeight <= availHeight) {
                subParas.push(sent);
              } else {
                if (subParas.length > 0) {
                  currentParas.push(subParas.join(' '));
                  flushPage();
                  subParas = [sent];
                } else {
                  // Single sentence too long — just push it (rare)
                  currentParas.push(sent);
                  flushPage();
                  subParas = [];
                }
              }
            }
            if (subParas.length > 0) currentParas.push(subParas.join(' '));
          }
        } else {
          // First paragraph doesn't fit — split it by sentences
          const sentences = para.split(/(?<=[.!?])\s+/);
          let subParas = [];
          for (const sent of sentences) {
            const test = [...subParas, sent].join(' ');
            measureEl.innerHTML = formatParas([test]);
            if (measureEl.offsetHeight <= availHeight) {
              subParas.push(sent);
            } else {
              if (subParas.length > 0) {
                currentParas.push(subParas.join(' '));
                flushPage();
                subParas = [sent];
              } else {
                currentParas.push(sent);
                flushPage();
                subParas = [];
              }
            }
          }
          if (subParas.length > 0) currentParas.push(subParas.join(' '));
        }
      }
    }

    flushPage();

    if (pages.length === 0) pages = [chapter.content];
  }

  function formatParas(paras) {
    return paras
      .filter(p => p && p.trim())
      .map((p, i) => {
        const style = i === 0 ? '' : 'text-indent:1.5em;';
        return `<p style="margin-bottom:1em;${style}">${escapeHtml(p)}</p>`;
      })
      .join('');
  }

  // ── Render a specific page ───────────────────────────
  function renderPage(idx) {
    currentPage = Math.max(0, Math.min(idx, pages.length - 1));
    const contentEl = overlay.querySelector('#page-content');
    const numEl     = overlay.querySelector('#page-num');
    const indEl     = overlay.querySelector('#page-indicator');
    const prevBtn   = overlay.querySelector('#page-prev');
    const nextBtn   = overlay.querySelector('#page-next');

    if (contentEl) {
      const paras = pages[currentPage].split('\n\n');
      contentEl.innerHTML = formatParas(paras);
    }

    if (numEl) numEl.textContent = (currentPage + 1);
    if (indEl) indEl.textContent = `Page ${currentPage + 1} of ${pages.length}`;

    if (prevBtn) {
      prevBtn.style.opacity       = currentPage === 0 ? '0.35' : '1';
      prevBtn.style.pointerEvents = currentPage === 0 ? 'none' : 'all';
    }

    if (nextBtn) {
      if (currentPage === pages.length - 1) {
        nextBtn.textContent    = 'Done ✓';
        nextBtn.style.background = '#c4a44a';
        nextBtn.style.color      = '#1a1610';
        nextBtn.style.border     = '1px solid #c4a44a';
        nextBtn.style.fontWeight = '600';
      } else {
        nextBtn.textContent    = 'Next →';
        nextBtn.style.background = 'rgba(255,255,255,0.08)';
        nextBtn.style.color      = 'rgba(255,255,255,0.85)';
        nextBtn.style.border     = '1px solid rgba(255,255,255,0.12)';
        nextBtn.style.fontWeight = '500';
      }
    }
  }

  // ── Page-turn animation ──────────────────────────────
  function turnPage(direction) {
    if (direction === 'next' && currentPage >= pages.length - 1) {
      onComplete(); dismiss(); return;
    }
    if (direction === 'prev' && currentPage === 0) return;

    const pageEl = overlay.querySelector('#page-current');
    if (!pageEl) return;

    // Animate the current page turning
    const rotation = direction === 'next' ? '-170deg' : '170deg';
    pageEl.style.transformOrigin = direction === 'next' ? 'left center' : 'right center';
    pageEl.style.transform = `rotateY(${rotation})`;
    pageEl.style.opacity   = '0.2';

    setTimeout(() => {
      // Update content mid-turn
      renderPage(currentPage + (direction === 'next' ? 1 : -1));

      // Flip from the opposite side to reveal
      pageEl.style.transition = 'none';
      pageEl.style.transform  = `rotateY(${direction === 'next' ? '170deg' : '-170deg'})`;
      pageEl.style.opacity    = '0.2';

      requestAnimationFrame(() => {
        pageEl.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s';
        pageEl.style.transform  = 'rotateY(0)';
        pageEl.style.opacity    = '1';
      });
    }, 350);
  }

  // ── Event handlers ───────────────────────────────────
  overlay.querySelector('#page-next')?.addEventListener('click', () => turnPage('next'));
  overlay.querySelector('#page-prev')?.addEventListener('click', () => turnPage('prev'));
  overlay.querySelector('#reader-back')?.addEventListener('click', () => { dismiss(); onBack(); });

  overlay.querySelector('#reader-font')?.addEventListener('click', () => {
    const sizes = [16, 18, 20];
    const idx = sizes.indexOf(fontSize);
    fontSize = sizes[(idx + 1) % sizes.length];
    const ce = overlay.querySelector('#page-content');
    const me = overlay.querySelector('#measure-page');
    if (ce) ce.style.fontSize = fontSize + 'px';
    if (me) me.style.fontSize = fontSize + 'px';
    paginate();
    renderPage(Math.min(currentPage, pages.length - 1));
  });

  // Touch swipe
  let touchStartX = 0;
  overlay.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx < 0) turnPage('next');
      else turnPage('prev');
    }
  });

  // Click on page sides for navigation
  const pageArea = overlay.querySelector('#page-area');
  pageArea?.addEventListener('click', (e) => {
    const rect = pageArea.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const w    = rect.width;
    // Only trigger if clicking far edges, not middle
    if (e.target.id === 'page-area' || e.target.id === 'page-stage') {
      if (x < w * 0.25) turnPage('prev');
      else if (x > w * 0.75) turnPage('next');
    }
  });

  function dismiss() {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }

  return overlay;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
