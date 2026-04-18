// E-reader screen — Kindle-style full-screen reading experience

export function renderReader(chapter, book, { onComplete, onBack }) {
  const overlay = document.createElement('div');
  overlay.id = 'reader-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 500;
    background: var(--reader-bg, #1a1710);
    display: flex; flex-direction: column;
    opacity: 0; transition: opacity 0.3s;
  `;

  // Format content: split on double newlines into paragraphs
  const paragraphs = chapter.content
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(p => p.length > 20);

  const paraHtml = paragraphs.map(p =>
    `<p style="margin-bottom:1.6em;orphans:3;widows:3;">${p}</p>`
  ).join('');

  overlay.innerHTML = `
    <div id="reader-header" style="
      display:flex; align-items:center; justify-content:space-between;
      padding: calc(env(safe-area-inset-top,0px) + 12px) 20px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    ">
      <button id="reader-back" style="
        background:none; border:none; color:rgba(255,255,255,0.4);
        font-family:var(--font-ui); font-size:0.82rem; cursor:pointer;
        padding:4px 0; -webkit-tap-highlight-color:transparent;
      ">← Back</button>

      <div style="text-align:center; flex:1; padding:0 16px;">
        <div style="font-family:var(--font-ui);font-size:0.68rem;
                    letter-spacing:0.08em;text-transform:uppercase;
                    color:rgba(255,255,255,0.3);">${book.title}</div>
        <div style="font-family:var(--font-ui);font-size:0.72rem;
                    color:rgba(255,255,255,0.5);margin-top:2px;">
          ${chapter.title} · ~${chapter.readingMinutes} min
        </div>
      </div>

      <button id="reader-font" style="
        background:none; border:none; color:rgba(255,255,255,0.4);
        font-family:var(--font-ui); font-size:0.82rem; cursor:pointer;
        padding:4px 0; -webkit-tap-highlight-color:transparent;
      ">Aa</button>
    </div>

    <!-- Progress bar -->
    <div style="height:2px;background:rgba(255,255,255,0.06);flex-shrink:0;">
      <div id="reader-progress" style="
        height:100%; background:var(--accent); width:0%;
        transition:width 0.3s;
      "></div>
    </div>

    <!-- Reading content -->
    <div id="reader-body" style="
      flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch;
      padding: 32px 28px calc(env(safe-area-inset-bottom,0px) + 80px);
      max-width: 680px; margin: 0 auto; width: 100%;
    ">
      <div id="reader-text" style="
        font-family: var(--font-body);
        font-size: var(--reader-size, 1.15rem);
        line-height: 1.9;
        color: rgba(240, 232, 213, 0.88);
        letter-spacing: 0.01em;
      ">
        <div style="
          font-family:var(--font-display);
          font-size:1.4rem; font-weight:400;
          color:rgba(240,232,213,0.95);
          margin-bottom:32px; line-height:1.3;
        ">${chapter.title}</div>
        ${paraHtml}
      </div>
    </div>

    <!-- Done button — appears after 80% scroll -->
    <div id="reader-footer" style="
      position:fixed; bottom:0; left:0; right:0;
      padding: 16px 24px calc(env(safe-area-inset-bottom,0px) + 16px);
      background: linear-gradient(transparent, var(--reader-bg, #1a1710) 40%);
      display:none; flex-direction:column; align-items:center;
    ">
      <button id="reader-done" class="btn btn-primary" style="max-width:320px;width:100%;">
        Done reading
      </button>
    </div>
  `;

  // Font size cycling
  const sizes = ['1rem', '1.15rem', '1.3rem'];
  let sizeIdx = 1;
  overlay.querySelector('#reader-font')?.addEventListener('click', () => {
    sizeIdx = (sizeIdx + 1) % sizes.length;
    overlay.querySelector('#reader-text').style.fontSize = sizes[sizeIdx];
  });

  overlay.querySelector('#reader-back')?.addEventListener('click', () => {
    dismiss();
    onBack();
  });

  overlay.querySelector('#reader-done')?.addEventListener('click', () => {
    dismiss();
    onComplete();
  });

  // Scroll progress + reveal done button at 80%
  const body = overlay.querySelector('#reader-body');
  const progress = overlay.querySelector('#reader-progress');
  const footer   = overlay.querySelector('#reader-footer');

  body?.addEventListener('scroll', () => {
    const pct = body.scrollTop / (body.scrollHeight - body.clientHeight);
    if (progress) progress.style.width = (pct * 100) + '%';
    if (footer && pct > 0.78) footer.style.display = 'flex';
  });

  function dismiss() {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }

  document.getElementById('app').appendChild(overlay);
  setTimeout(() => overlay.style.opacity = '1', 20);

  return overlay;
}
