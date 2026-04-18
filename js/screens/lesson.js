export function renderLesson(unit, userData, { onBack, onComplete }) {
  const lesson  = unit.lesson;
  const screen  = document.createElement('div');
  screen.className = 'screen lesson-screen';
  screen.id = 'screen-lesson';

  // ── State ────────────────────────────────────────────
  let checkpointDone = false;
  let currentQuestion = -1; // -1 = reading mode
  let answers = [];
  let score   = 0;

  // ── Build reading view ───────────────────────────────
  function buildReading() {
    const sectionsHtml = lesson.sections.map((sec, i) => {
      // Insert pull quote after section 1
      const pq = i === 1 ? `
        <div class="pull-quote">
          <div class="pull-quote-text">${lesson.pullQuote}</div>
        </div>` : '';

      return `
        <div class="section-title">${sec.title}</div>
        <div class="lesson-section">
          <div class="lesson-prose">${formatProse(sec.content)}</div>
        </div>
        ${pq}`;
    }).join('');

    const checkpointHtml = `
      <div class="checkpoint" id="checkpoint">
        <div class="checkpoint-label">Pause &amp; reflect</div>
        <div class="checkpoint-prompt">${lesson.checkpointPrompt}</div>
        <textarea class="checkpoint-input" id="checkpoint-input"
          placeholder="Write a brief response before continuing…"
          rows="3"></textarea>
        <div style="margin-top:12px">
          <button class="btn btn-primary" id="checkpoint-submit" disabled>Continue reading</button>
        </div>
      </div>`;

    return `
      <div class="lesson-header" id="lesson-header">
        <div class="lesson-header-row">
          <button class="lesson-back" id="lesson-back" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 5l-5 5 5 5" stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <span class="lesson-badge">${unit.subject}</span>
        </div>
        <div class="lesson-progress-bar">
          <div class="lesson-progress-fill" id="lesson-progress"></div>
        </div>
      </div>

      <div class="lesson-body" id="lesson-body">
        <h1 class="lesson-title">${lesson.title}</h1>
        <div class="lesson-meta">${lesson.estimatedMinutes} min · ${unit.title}</div>

        <div class="lesson-hook">${lesson.hook}</div>

        ${sectionsHtml}
        ${checkpointHtml}

        <div id="post-checkpoint" class="hidden">
          ${lesson.sections.slice(2).map(sec => `
            <div class="section-title">${sec.title}</div>
            <div class="lesson-section">
              <div class="lesson-prose">${formatProse(sec.content)}</div>
            </div>`).join('')}

          <div style="margin-top:40px;padding:0 0 8px;">
            <button class="btn btn-primary" id="start-questions">
              Answer questions
            </button>
          </div>
        </div>
      </div>
    `;
  }

  screen.innerHTML = buildReading();

  // ── Reading event listeners ──────────────────────────
  function attachReadingListeners() {
    screen.querySelector('#lesson-back')?.addEventListener('click', onBack);

    const cpInput  = screen.querySelector('#checkpoint-input');
    const cpSubmit = screen.querySelector('#checkpoint-submit');

    cpInput?.addEventListener('input', () => {
      if (cpSubmit) cpSubmit.disabled = cpInput.value.trim().length < 10;
    });

    cpSubmit?.addEventListener('click', () => {
      checkpointDone = true;
      screen.querySelector('#checkpoint').style.opacity = '0.5';
      screen.querySelector('#checkpoint').style.pointerEvents = 'none';
      screen.querySelector('#post-checkpoint')?.classList.remove('hidden');
      updateProgress(0.6);
    });

    screen.querySelector('#start-questions')?.addEventListener('click', () => {
      startQuestions();
    });

    // Scroll progress
    const body = screen.querySelector('#lesson-body');
    if (body) {
      body.addEventListener('scroll', onScroll);
      screen.addEventListener('scroll', onScroll);
    }
  }

  function onScroll() {
    const el  = screen.querySelector('#lesson-body') || screen;
    const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 0.5;
    updateProgress(Math.min(pct, 0.5));
  }

  function updateProgress(pct) {
    const fill = screen.querySelector('#lesson-progress');
    if (fill) fill.style.width = (pct * 100) + '%';
  }

  // ── Questions mode ───────────────────────────────────
  function startQuestions() {
    currentQuestion = 0;
    updateProgress(0.65);

    // Build question overlay over the lesson body
    const overlay = document.createElement('div');
    overlay.id = 'questions-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;background:var(--bg);
      z-index:200;display:flex;flex-direction:column;
      padding:calc(env(safe-area-inset-top,0px) + 56px) 24px
              calc(env(safe-area-inset-bottom,0px) + 24px);
      overflow-y:auto;
    `;

    screen.appendChild(overlay);
    showQuestion(overlay, 0);
  }

  function showQuestion(overlay, idx) {
    const q   = lesson.questions[idx];
    const num = idx + 1;
    const tot = lesson.questions.length;

    overlay.innerHTML = `
      <div class="question-count">Question ${num} of ${tot}</div>
      <div class="question-type-badge">${formatType(q.type)}</div>
      <div class="question-text">${q.question}</div>

      ${q.format === 'multiple-choice' ? buildMCQ(q) : buildShortAnswer(q)}

      <div class="feedback-box" id="q-feedback"></div>

      <button class="btn btn-primary" id="q-submit" style="margin-top:auto;"
        ${q.format === 'multiple-choice' ? 'disabled' : ''}>
        ${num < tot ? 'Next question' : 'Finish lesson'}
      </button>
    `;

    updateProgress(0.65 + (idx / tot) * 0.3);

    // MCQ option selection
    overlay.querySelectorAll('.q-option').forEach((opt, i) => {
      opt.addEventListener('click', () => {
        overlay.querySelectorAll('.q-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        overlay.querySelector('#q-submit').disabled = false;
      });
    });

    // Short answer enable
    const ta = overlay.querySelector('.question-textarea');
    const sb = overlay.querySelector('#q-submit');
    ta?.addEventListener('input', () => {
      if (sb) sb.disabled = ta.value.trim().length < 15;
    });

    // Submit
    overlay.querySelector('#q-submit')?.addEventListener('click', () => {
      const isCorrect = evaluateAnswer(overlay, q, idx);
      if (isCorrect) score++;

      const submitBtn = overlay.querySelector('#q-submit');
      if (submitBtn) {
        submitBtn.textContent = num < tot ? 'Next question' : 'Finish lesson';

        // On first click, show feedback. On second click, advance.
        submitBtn.onclick = () => {
          if (idx + 1 < lesson.questions.length) {
            showQuestion(overlay, idx + 1);
          } else {
            overlay.remove();
            showCompletion();
          }
        };
      }
    });
  }

  function buildMCQ(q) {
    return `
      <div class="question-options">
        ${q.options.map((opt, i) => `
          <button class="q-option" data-idx="${i}">${opt}</button>
        `).join('')}
      </div>`;
  }

  function buildShortAnswer(q) {
    return `
      <textarea class="question-textarea"
        placeholder="Write your answer here…"></textarea>`;
  }

  function evaluateAnswer(overlay, q, idx) {
    const feedback = overlay.querySelector('#q-feedback');
    let correct = false;

    if (q.format === 'multiple-choice') {
      const selected = overlay.querySelector('.q-option.selected');
      const selIdx   = selected ? parseInt(selected.dataset.idx) : -1;
      correct = selIdx === q.correctIndex;

      overlay.querySelectorAll('.q-option').forEach((opt, i) => {
        opt.style.pointerEvents = 'none';
        if (i === q.correctIndex) opt.classList.add('correct');
        else if (i === selIdx && !correct) opt.classList.add('incorrect');
      });
    } else {
      // Short answer: always show the model answer
      correct = true; // give credit for engaging
    }

    if (feedback) {
      feedback.textContent = q.explanation;
      feedback.className   = `feedback-box visible ${correct ? 'correct-fb' : 'incorrect-fb'}`;
    }

    answers.push({ questionId: q.id, correct, type: q.type });
    return correct;
  }

  // ── Completion ───────────────────────────────────────
  function showCompletion() {
    updateProgress(1.0);
    const baseXp    = 100;
    const bonusXp   = score * 10;
    const totalXp   = baseXp + bonusXp;

    const comp = document.createElement('div');
    comp.id = 'completion-overlay';
    comp.style.cssText = `
      position:fixed;inset:0;background:var(--bg);z-index:300;
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;padding:48px 28px;text-align:center;
      opacity:0;transition:opacity 0.4s;
    `;

    comp.innerHTML = `
      <div class="completion-icon">◎</div>
      <h2 class="completion-title">Lesson complete.</h2>
      <div class="completion-xp">+${totalXp} XP — ${score} of ${lesson.questions.length} correct</div>
      <p class="completion-note">${lesson.completionNote || ''}</p>

      <div class="rating-section">
        <div class="rating-label">Rate this lesson</div>
        <div class="difficulty-row">
          ${['Too easy','Good','Hard','Too hard'].map((l,i) => `
            <div class="diff-btn" data-diff="${i}">${l}</div>
          `).join('')}
        </div>
        <div class="star-row">
          ${[1,2,3,4,5].map(n => `
            <button class="star-btn" data-star="${n}">★</button>
          `).join('')}
        </div>
        <textarea class="feedback-text" placeholder="Anything else? (optional)" rows="2"></textarea>
      </div>

      <button class="btn btn-primary" id="comp-done" style="max-width:340px;width:100%;">
        Back to home
      </button>
      <button class="btn" id="comp-skip"
        style="background:none;color:var(--text-3);font-size:0.8rem;margin-top:4px;width:auto;">
        Skip feedback
      </button>
    `;

    screen.appendChild(comp);
    setTimeout(() => comp.style.opacity = '1', 20);

    // Difficulty toggle
    comp.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        comp.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Star rating
    let starRating = 0;
    comp.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        starRating = parseInt(btn.dataset.star);
        comp.querySelectorAll('.star-btn').forEach(b =>
          b.classList.toggle('lit', parseInt(b.dataset.star) <= starRating));
      });
    });

    function collectAndFinish() {
      const diff     = comp.querySelector('.diff-btn.selected')?.dataset.diff;
      const feedText = comp.querySelector('.feedback-text')?.value?.trim();
      onComplete({
        answers,
        score,
        totalQuestions: lesson.questions.length,
        xpEarned: totalXp,
        feedback: { difficulty: diff ? parseInt(diff) : null, stars: starRating || null, text: feedText || null }
      });
    }

    comp.querySelector('#comp-done')?.addEventListener('click', collectAndFinish);
    comp.querySelector('#comp-skip')?.addEventListener('click', collectAndFinish);
  }

  // ── Helpers ──────────────────────────────────────────
  function formatProse(text) {
    return text
      .split('\n\n')
      .filter(Boolean)
      .map(p => `<p>${p.trim()}</p>`)
      .join('');
  }

  function formatType(type) {
    return { comprehension: 'Comprehension', analysis: 'Analysis',
             connection: 'Connection', prose: 'Prose & craft' }[type] || type;
  }

  attachReadingListeners();
  return screen;
}
