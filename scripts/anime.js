export function animateCount(el, target, suffix = " tasks") {
  const current = parseInt(el.dataset.value || "0");

  if (current === target) {
    el.textContent = `${target}${suffix}`;
    return;
  }

  let start = current;
  const duration = 400;
  const stepTime = 20;
  const steps = duration / stepTime;
  const increment = (target - current) / steps;

  const interval = setInterval(() => {
    start += increment;

    if ((increment > 0 && start >= target) || (increment < 0 && start <= target)) {
      start = target;
      clearInterval(interval);
    }

    el.textContent = `${Math.round(start)}${suffix}`;
  }, stepTime);

  el.dataset.value = target;
}