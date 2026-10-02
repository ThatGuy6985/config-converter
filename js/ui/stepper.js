/**
 * Custom Tactile Number Stepper Controller
 * Replaces browser-default spin arrows with sleek, accessible, responsive stepper controls.
 */

export function setupNumberSteppers() {
  const buttons = document.querySelectorAll('.stepper-btn');

  buttons.forEach(btn => {
    const isUp = btn.dataset.step === 'up';
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    const stepValue = () => {
      const min = input.min !== '' ? Number(input.min) : -Infinity;
      const max = input.max !== '' ? Number(input.max) : Infinity;
      const step = input.step ? Number(input.step) : 1;
      let current;
      if (input.value === '' || isNaN(Number(input.value))) {
        current = min !== -Infinity ? min : 0;
      } else {
        current = Number(input.value);
      }

      if (isUp) {
        current = Math.min(max, current + step);
      } else {
        current = Math.max(min, current - step);
      }

      input.value = current;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    let timer = null;
    let interval = null;

    const start = (e) => {
      if (e.cancelable) e.preventDefault();
      stepValue();
      timer = setTimeout(() => {
        interval = setInterval(stepValue, 75);
      }, 320);
    };

    const stop = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);

    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', stop);
    btn.addEventListener('touchcancel', stop);
  });
}
