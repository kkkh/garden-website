export function initLegalToc(): void {
  const toc = document.querySelector<HTMLElement>('[data-legal-toc]');
  const article = document.querySelector<HTMLElement>('[data-legal-article]');
  if (!toc || !article) return;

  const headings = Array.from(article.querySelectorAll<HTMLElement>('h2[id]'));
  if (headings.length === 0) return;

  const list = toc.querySelector('ol');
  if (!list) return;

  list.innerHTML = headings
    .map(
      (heading) =>
        `<li><a href="#${heading.id}" data-toc-link="${heading.id}">${heading.textContent ?? ''}</a></li>`,
    )
    .join('');

  const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'));

  const setActive = (id: string | null) => {
    for (const link of links) {
      if (link.dataset.tocLink === id) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  };

  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: [0, 1] },
    );

    for (const heading of headings) observer.observe(heading);
  }
}
