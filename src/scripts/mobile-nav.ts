export function initMobileNav(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-mobile-nav]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  if (!dialog || !toggle) return;

  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  toggle.addEventListener('click', open);

  dialog.querySelectorAll<HTMLElement>('[data-nav-close]').forEach((element) => {
    element.addEventListener('click', close);
  });

  dialog.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    link.addEventListener('click', () => {
      // 让浏览器先完成锚点跳转，再关闭对话框。
      window.setTimeout(close, 0);
    });
  });

  dialog.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    toggle.focus({ preventScroll: true });
  });

  const desktop = matchMedia('(min-width: 1024px)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) close();
  });
}
