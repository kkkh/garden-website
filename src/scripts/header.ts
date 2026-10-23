function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const toTop = document.querySelector<HTMLButtonElement>('[data-to-top]');
  const progress = document.querySelector<HTMLElement>('[data-scroll-progress]');
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));

  const sections = navLinks
    .map((link) => {
      const id = link.dataset.navSection;
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter((value): value is { link: HTMLAnchorElement; section: HTMLElement } => value !== null);

  let ticking = false;
  let activeId: string | null = null;

  const update = () => {
    ticking = false;
    const y = window.scrollY;

    if (header) header.dataset.scrolled = String(y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 640);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progress.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }

    if (sections.length === 0) return;

    const threshold = (header?.offsetHeight ?? 72) + 96;
    let current: string | null = null;

    for (const { section } of sections) {
      if (section.getBoundingClientRect().top <= threshold) {
        current = section.id;
      }
    }

    if (current === activeId) return;
    activeId = current;

    for (const { link, section } of sections) {
      if (section.id === current) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  };

  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();

  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}
