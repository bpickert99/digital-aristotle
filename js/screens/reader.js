// Paper-style e-reader with page-turn animation
// Pagination measures actual rendered height to fill pages completely

export function renderReader(chapter, book, { onComplete, onBack }) {
  const overlay = document.createElement('div');
  overlay.id = 'reader-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:500;
    background:#2a251f;
    display:flex;flex-direction:column;
    opacity:0;transition:opacity 0.3s;
  `;

  let fontSize    = 18;
  let pages       = [];
  let currentPage = 0;

  overlay.innerHTML = `
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

      <div style="text-align:center;flex:1;padding:0 12px;min-width:0;">
        <div style="font-family:var(--font-ui);font-size:0.68rem;
                    letter-spacing:0.1em;text-transform:uppercase;
                    color:rgba(255,255,255,0.35);
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(book.title)}</div>
        <div style="font-family:var(--font-body);font-size:0.82rem;font-style:italic;
                    color:rgba(255,255,255,0.45);margin-top:3px;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(chapter.title)}</div>
      </div>

      <button id="reader-font" style="
        background:none;border:none;color:rgba(255,255,255,0.5);
        font-family:var(--font-ui);font-size:0.95rem;cursor:pointer;
        padding:8px 0 8px 12px;min-height:44px;min-width:44px;
        -webkit-tap-highlight-color:transparent;
      ">Aa</button>
    </div>

    <div id="page-area" style="
      flex:1;
      display:flex;align-items:center;justify-content:center;
      padding:16px 16px 0;
      overflow:hidden;
      perspective:2000px;
      position:relative;
    ">
      <div id="page-current" style="
        position:relative;
        width:100%;max-width:600px;height:100%;
        background:#f4ebd7;
        background-image:
          radial-gradient(circle at 15% 20%, rgba(139,122,90,0.04) 0%, transparent 40%),
          radial-gradient(circle at 85% 80%, rgba(139,122,90,0.03) 0%, transparent 45%);
        border-radius:4px 8px 8px 4px;
        box-shadow:
          0 2px 8px rgba(0,0,0,0.3),
          0 12px 30px rgba(0,0,0,0.4),
          inset 4px 0 6px -4px rgba(0,0,0,0.15);
        padding:36px 40px;
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
          text-align:left;
        "></div>

        <div id="page-footer" style="
          flex-shrink:0;
          padding-top:14px;
          margin-top:14px;
          border-top:1px solid rgba(58,40,23,0.15);
          display:flex;justify-content:space-between;align-items:center;
          font-family:'Crimson Pro',Georgia,serif;
          font-size:12px;font-style:italic;
          color:rgba(58,40,23,0.5);
        ">
          <span>${escapeHtml(book.author)}</span>
          <span id="page-num">1</span>
        </div>
      </div>
    </div>

    <div style="
      display:flex;align-items:center;justify-content:space-between;
      padding:14px 24px calc(env(safe-area-inset-bottom,0px)+14px);
      background:#2a251f;
      flex-shrink:0;gap:12px;
    ">
      <button id="page-prev" style="
        background:rgba(255,255,255,0.05);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:10px;padding:10px 18px;
        font-family:var(--font-ui);font-size:0.85rem;
        color:rgba(255,255,255,0.5);cursor:pointer;
        min-height:44px;min-width:90px;
        -webkit-tap-highlight-color:transparent;
      ">← Prev</button>

      <div id="page-indicator" style="
        font-family:var(--font-ui);font-size:0.78rem;
        color:rgba(255,255,255,0.35);flex:1;text-align:center;
      ">…</div>

      <button id="page-next" style="
        background:rgba(255,255,255,0.08);
        border:1px solid rgba(255,255,255,0.12);
        border-radius:10px;padding:10px 18px;
        font-family:var(--font-ui);font-size:0.85rem;font-weight:500;
        color:rgba(255,255,255,0.85);cursor:pointer;
        min-height:44px;min-width:90px;
        -webkit-tap-highlight-color:transparent;
      ">Next →</button>
    </div>
  `;

  document.getElementById('app').appendChild(overlay);

  // Wait for layout, then paginate using the real element dimensions
  setTimeout(() => {
    overlay.style.opacity = '1';
    paginate();
    renderPage(0);
  }, 80);

  // ── Pagination by measuring inside the actual page ───
  // Strategy: fill the real page-content with paragraphs one at a time,
  // and when scrollHeight exceeds clientHeight, back up one paragraph
  function paginate() {
    const contentEl = overlay.querySelector('#page-content');
    if (!contentEl) return;

    // Force measurement of available content height
    const availHeight = contentEl.clientHeight;

    if (availHeight <= 50) {
      setTimeout(paginate, 100);
      return;
    }

    // Clean source into paragraphs
    const paragraphs = chapter.content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .split(/\n\n+/)
      .map(p => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(p => p.length > 0);

    pages = [];
    let i = 0;

    while (i < paragraphs.length) {
      // Start a new page — add paragraphs until overflow
      const pageParas = [];
      contentEl.innerHTML = '';

      while (i < paragraphs.length) {
        const para = paragraphs[i];
        const indent = pageParas.length === 0 ? '' : 'text-indent:1.5em;';
        const pEl = document.createElement('p');
        pEl.style.cssText = `margin:0 0 1em 0;${indent}`;
        pEl.textContent = para;
        contentEl.appendChild(pEl);

        // Check if we overflowed
        if (contentEl.scrollHeight > availHeight) {
          // Too much — remove the last paragraph we added
          if (pageParas.length > 0) {
            // Back up: the current paragraph goes on the next page
            contentEl.removeChild(pEl);
            break;
          } else {
            // Single paragraph doesn't fit alone — split by words
            contentEl.removeChild(pEl);
            const words = para.split(' ');
            let chunk = [];

            for (const word of words) {
              const testPara = [...chunk, word].join(' ');
              const testEl = document.createElement('p');
              testEl.style.cssText = 'margin:0 0 1em 0;';
              testEl.textContent = testPara;
              contentEl.appendChild(testEl);

              if (contentEl.scrollHeight > availHeight) {
                contentEl.removeChild(testEl);
                if (chunk.length > 0) {
                  pageParas.push(chunk.join(' '));
                }
                chunk = [word];
                // Also add just the chunk to the dom for next iteration
                const keepEl = document.createElement('p');
                keepEl.style.cssText = 'margin:0 0 1em 0;';
                keepEl.textContent = chunk.join(' ');
                break; // break word loop, flush this page
              } else {
                contentEl.removeChild(testEl);
                chunk.push(word);
              }
            }

            // If everything fit in chunk, push it; update paragraphs list with leftover
            if (chunk.length > 0 && chunk.length < words.length) {
              // Split happened — replace this paragraph with the remaining words
              paragraphs[i] = words.slice(chunk.length).join(' ');
            } else if (chunk.length === words.length) {
              pageParas.push(chunk.join(' '));
              i++;
            }
            break;
          }
        }

        pageParas.push(para);
        i++;
      }

      if (pageParas.length > 0) {
        pages.push(pageParas);
      } else {
        // Safety valve — shouldn't happen but prevents infinite loop
        break;
      }
    }

    if (pages.length === 0) pages = [[chapter.content]];
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
      contentEl.innerHTML = '';
      const paras = pages[currentPage] || [''];
      paras.forEach((p, i) => {
        const indent = i === 0 ? '' : 'text-indent:1.5em;';
        const pEl = document.createElement('p');
        pEl.style.cssText = `margin:0 0 1em 0;${indent}`;
        pEl.textContent = p;
        contentEl.appendChild(pEl);
      });
    }

    if (numEl) numEl.textContent = (currentPage + 1);
    if (indEl) indEl.textContent = `Page ${currentPage + 1} of ${pages.length}`;

    if (prevBtn) {
      prevBtn.style.opacity       = currentPage === 0 ? '0.35' : '1';
      prevBtn.style.pointerEvents = currentPage === 0 ? 'none' : 'all';
    }

    if (nextBtn) {
      if (currentPage === pages.length - 1) {
        nextBtn.textContent      = 'Done ✓';
        nextBtn.style.background = '#c4a44a';
        nextBtn.style.color      = '#1a1610';
        nextBtn.style.border     = '1px solid #c4a44a';
        nextBtn.style.fontWeight = '600';
      } else {
        nextBtn.textContent      = 'Next →';
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

    const rotation = direction === 'next' ? '-170deg' : '170deg';
    pageEl.style.transformOrigin = direction === 'next' ? 'left center' : 'right center';
    pageEl.style.transform = `rotateY(${rotation})`;
    pageEl.style.opacity   = '0.2';

    setTimeout(() => {
      renderPage(currentPage + (direction === 'next' ? 1 : -1));
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
    if (ce) ce.style.fontSize = fontSize + 'px';
    paginate();
    renderPage(Math.min(currentPage, pages.length - 1));
  });

  let touchStartX = 0;
  overlay.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx < 0) turnPage('next');
      else turnPage('prev');
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
