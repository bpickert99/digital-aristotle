const MESSAGES = [
  'Reading your interests…',
  'Selecting your first units…',
  'Writing your first lesson…',
  'Setting the scene…',
  'Almost ready…',
];

export function renderGenerating() {
  const screen = document.createElement('div');
  screen.className = 'screen generating-screen';
  screen.id = 'screen-generating';

  screen.innerHTML = `
    <div class="gen-ornament">
      <div class="gen-ring"></div>
      <div class="gen-ring-spin"></div>
      <div class="gen-ring-spin-2"></div>
      <div class="gen-dot"></div>
    </div>

    <h2 class="gen-title">Building your curriculum</h2>
    <p class="gen-message" id="gen-msg">${MESSAGES[0]}</p>

    <div class="gen-steps" id="gen-steps">
      ${MESSAGES.map((_, i) => `<div class="gen-step ${i === 0 ? 'active' : ''}"></div>`).join('')}
    </div>
  `;

  // Cycle messages
  let msgIndex = 0;
  const msgEl   = () => screen.querySelector('#gen-msg');
  const stepsEl = () => screen.querySelectorAll('.gen-step');

  const interval = setInterval(() => {
    const el = msgEl();
    if (!el) { clearInterval(interval); return; }

    el.classList.add('fade');
    setTimeout(() => {
      msgIndex = (msgIndex + 1) % MESSAGES.length;
      el.textContent = MESSAGES[msgIndex];
      el.classList.remove('fade');

      stepsEl().forEach((s, i) => {
        s.classList.toggle('done', i < msgIndex);
        s.classList.toggle('active', i === msgIndex);
      });
    }, 400);
  }, 2800);

  screen._stopMessages = () => clearInterval(interval);

  return screen;
}
