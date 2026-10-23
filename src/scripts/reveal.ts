export function initReveal(): void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

  const revealAll = () => {
    for (const element of elements) element.classList.add('is-visible');
  };

  if (elements.length === 0) {
    window.__gardenRevealReady = true;
    return;
  }

  if (
    typeof IntersectionObserver !== 'function' ||
    (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  ) {
    revealAll();
    window.__gardenRevealReady = true;
    return;
  }

  try {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    for (const element of elements) observer.observe(element);
    window.__gardenRevealReady = true;
  } catch {
    revealAll();
    window.__gardenRevealReady = true;
  }
}

export function revealAll(): void {
  for (const element of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    element.classList.add('is-visible');
  }
  window.__gardenRevealReady = true;
}
