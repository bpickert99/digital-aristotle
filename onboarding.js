// Onboarding flow: 5 steps → returns completed profile object

const SUBJECTS = [
  { id: 'history',    icon: '🏛', name: 'History & Politics',      desc: 'The forces that shaped the world' },
  { id: 'science',    icon: '⚗️', name: 'Natural Sciences',         desc: 'Physics, chemistry, biology, earth' },
  { id: 'math',       icon: '∑',  name: 'Mathematics & Logic',      desc: 'Reasoning from first principles' },
  { id: 'literature', icon: '📖', name: 'Literature & Writing',     desc: 'Novels, poetry, and the craft of prose' },
  { id: 'philosophy', icon: '◎',  name: 'Philosophy & Ethics',      desc: 'How to think about what matters' },
  { id: 'music',      icon: '♩',  name: 'Music & Sound',            desc: 'Theory, history, and trained listening' },
  { id: 'anthropology', icon: '🌍', name: 'Anthropology & Culture', desc: 'How humans organise and make meaning' },
  { id: 'economics',  icon: '⤢',  name: 'Economics & Society',      desc: 'Markets, institutions, and behaviour' },
  { id: 'geography',  icon: '◈',  name: 'Geography & the World',    desc: 'Place, climate, and human settlement' },
  { id: 'art',        icon: '◻',  name: 'Visual Art & Architecture', desc: 'How images and space carry meaning' },
  { id: 'psychology', icon: '◑',  name: 'Psychology & the Mind',    desc: 'Cognition, behaviour, and motivation' },
  { id: 'cs',         icon: '⋈',  name: 'Computing & Technology',   desc: 'How software and systems work' },
];

const MATH_OPTIONS = [
  { value: 'avoidant',    label: 'Not for me right now',        sub: 'Focus on other subjects' },
  { value: 'basic',       label: 'Basic numeracy',              sub: 'Comfortable with arithmetic' },
  { value: 'highschool',  label: 'High school level',           sub: 'Algebra, geometry, some statistics' },
  { value: 'calculus',    label: 'Calculus and beyond',         sub: 'Comfortable with derivatives, integrals' },
  { value: 'advanced',    label: 'Strong mathematical background', sub: 'Proofs, linear algebra, or higher' },
];

export function renderOnboarding(state, onComplete) {
  const profile = {
    interests:   [],
    foundation:  [],
    mathComfort: '',
    personal:    ['', ''],
    avoid:       ''
  };

  let step = 0;

  const screen = document.createElement('div');
  screen.className = 'screen onboarding-screen';
  screen.id = 'screen-onboarding';

  function render() {
    screen.innerHTML = buildStep(step, profile);
    attachStepListeners();
    setTimeout(() => screen.classList.add('active'), 20);
  }

  function buildStep(s, p) {
    const progress = buildProgress(s);
    switch (s) {
      case 0: return progress + stepWelcome();
      case 1: return progress + stepInterests(p);
      case 2: return progress + stepFoundation(p);
      case 3: return progress + stepMath(p);
      case 4: return progress + stepPersonal(p);
    }
  }

  function buildProgress(s) {
    const dots = [0,1,2,3,4].map(i => `
      <div class="ob-dot ${i < s ? 'done' : i === s ? 'active' : ''}"></div>
    `).join('');
    return `<div class="ob-progress">${dots}</div>`;
  }

  function stepWelcome() {
    return `
      <div class="ob-content">
        <div class="ob-label">Welcome</div>
        <h1 class="ob-heading">A private education<br>for the curious adult.</h1>
        <p class="ob-sub">Before the first lesson, a few questions — to understand where you are and where to start.</p>
        <p style="font-family:var(--font-ui);font-size:0.82rem;font-weight:300;color:var(--text-3);line-height:1.65;">
          This takes about two minutes. The answers shape your curriculum and update over time as you learn.
        </p>
      </div>
      <div class="ob-footer">
        <button class="btn btn-primary" id="ob-next">Begin</button>
      </div>`;
  }

  function stepInterests(p) {
    const tiles = SUBJECTS.map(s => `
      <div class="tile ${p.interests.includes(s.id) ? 'selected' : ''}"
           data-id="${s.id}" data-step="interests">
        <span class="tile-icon">${s.icon}</span>
        <div class="tile-name">${s.name}</div>
        <div class="tile-desc">${s.desc}</div>
      </div>`).join('');

    return `
      <div class="ob-content">
        <div class="ob-label">Step 1 of 4</div>
        <h2 class="ob-heading">Which territories feel worth exploring?</h2>
        <p class="ob-sub">Select any that draw you. There are no wrong answers.</p>
        <div class="tile-grid">${tiles}</div>
      </div>
      <div class="ob-footer">
        <button class="btn btn-primary" id="ob-next"
          ${p.interests.length === 0 ? 'disabled' : ''}>Continue</button>
        <button class="ob-skip" id="ob-skip">Skip this step</button>
      </div>`;
  }

  function stepFoundation(p) {
    const tiles = SUBJECTS.map(s => `
      <div class="tile ${p.foundation.includes(s.id) ? 'selected' : ''}"
           data-id="${s.id}" data-step="foundation">
        <span class="tile-icon">${s.icon}</span>
        <div class="tile-name">${s.name}</div>
        <div class="tile-desc">${s.desc}</div>
      </div>`).join('');

    return `
      <div class="ob-content">
        <div class="ob-label">Step 2 of 4</div>
        <h2 class="ob-heading">Where do you already have a foundation?</h2>
        <p class="ob-sub">These are areas the curriculum can build on or move past quickly.</p>
        <div class="tile-grid">${tiles}</div>
      </div>
      <div class="ob-footer">
        <button class="btn btn-primary" id="ob-next">Continue</button>
        <button class="ob-skip" id="ob-skip">None of these</button>
      </div>`;
  }

  function stepMath(p) {
    const options = MATH_OPTIONS.map(o => `
      <div class="scale-option ${p.mathComfort === o.value ? 'selected' : ''}"
           data-value="${o.value}" data-step="math">
        <div class="scale-label">${o.label}</div>
        <div class="scale-sub">${o.sub}</div>
      </div>`).join('');

    return `
      <div class="ob-content">
        <div class="ob-label">Step 3 of 4</div>
        <h2 class="ob-heading">How do you feel about mathematics?</h2>
        <p class="ob-sub">This calibrates where math and science lessons begin.</p>
        <div class="scale-options">${options}</div>
      </div>
      <div class="ob-footer">
        <button class="btn btn-primary" id="ob-next"
          ${!p.mathComfort ? 'disabled' : ''}>Continue</button>
      </div>`;
  }

  function stepPersonal(p) {
    return `
      <div class="ob-content">
        <div class="ob-label">Step 4 of 4</div>
        <h2 class="ob-heading">What has stayed with you?</h2>
        <p class="ob-sub">A book, a film, a piece of music, a historical event — anything that left a mark. These signals help calibrate what comes next.</p>

        <div class="ob-field">
          <label class="ob-field-label">First thing</label>
          <input class="ob-input" id="personal-0" type="text"
            placeholder="e.g. The Brothers Karamazov, or the fall of Rome"
            value="${p.personal[0]}"
            autocomplete="off" autocorrect="off" spellcheck="false">
        </div>

        <div class="ob-field">
          <label class="ob-field-label">Second thing <span style="color:var(--text-3)">(optional)</span></label>
          <input class="ob-input" id="personal-1" type="text"
            placeholder=""
            value="${p.personal[1]}"
            autocomplete="off" autocorrect="off" spellcheck="false">
        </div>

        <div style="margin-top:24px;">
          <label class="ob-field-label">Anything to hold off on for now? <span style="color:var(--text-3)">(optional)</span></label>
          <textarea class="ob-input" id="avoid-input" rows="2"
            placeholder="Any topics you'd rather not encounter right now"
            style="resize:none;min-height:64px;">${p.avoid}</textarea>
        </div>
      </div>
      <div class="ob-footer">
        <button class="btn btn-primary" id="ob-next">Build my curriculum</button>
      </div>`;
  }

  function attachStepListeners() {
    // Tile toggles
    screen.querySelectorAll('.tile[data-step]').forEach(tile => {
      tile.addEventListener('click', () => {
        const field = tile.dataset.step; // 'interests' or 'foundation'
        const id    = tile.dataset.id;
        const arr   = profile[field];
        const idx   = arr.indexOf(id);

        if (idx === -1) arr.push(id);
        else arr.splice(idx, 1);

        tile.classList.toggle('selected', arr.includes(id));

        // Update next button state for interests step
        if (field === 'interests') {
          const btn = screen.querySelector('#ob-next');
          if (btn) btn.disabled = arr.length === 0;
        }
      });
    });

    // Math scale
    screen.querySelectorAll('.scale-option[data-step="math"]').forEach(opt => {
      opt.addEventListener('click', () => {
        profile.mathComfort = opt.dataset.value;
        screen.querySelectorAll('.scale-option').forEach(o =>
          o.classList.toggle('selected', o.dataset.value === opt.dataset.value));
        const btn = screen.querySelector('#ob-next');
        if (btn) btn.disabled = false;
      });
    });

    // Next button
    const nextBtn = screen.querySelector('#ob-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        // Collect personal inputs before advancing
        if (step === 4) {
          const p0 = screen.querySelector('#personal-0');
          const p1 = screen.querySelector('#personal-1');
          const av = screen.querySelector('#avoid-input');
          if (p0) profile.personal[0] = p0.value.trim();
          if (p1) profile.personal[1] = p1.value.trim();
          if (av) profile.avoid = av.value.trim();
          onComplete(profile);
          return;
        }
        advance();
      });
    }

    // Skip button
    const skipBtn = screen.querySelector('#ob-skip');
    if (skipBtn) skipBtn.addEventListener('click', advance);
  }

  function advance() {
    screen.classList.remove('active');
    screen.classList.add('exit');
    setTimeout(() => {
      step++;
      screen.classList.remove('exit');
      render();
    }, 300);
  }

  render();
  return screen;
}
