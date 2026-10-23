/**
 * Hero 设备框的桌面指针微倾斜。
 *
 * - 仅在 `hover: hover` + `pointer: fine` 且未开启减弱动效时启用；
 * - 最大倾斜 3°，使用 requestAnimationFrame 合并写入；
 * - 只改 CSS 变量，不移动布局，不产生滚动视差。
 */
const MAX_TILT = 3;

export function initHeroTilt(): void {
  const stage = document.querySelector<HTMLElement>('[data-hero-tilt]');
  const frame = stage?.querySelector<HTMLElement>('.device-frame');
  if (!stage || !frame || typeof matchMedia !== 'function') return;

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reducedMotion) return;

  let raf = 0;
  let px = 0;
  let py = 0;

  const apply = () => {
    raf = 0;
    frame.style.setProperty('--tilt-x', `${(-py * MAX_TILT).toFixed(2)}deg`);
    frame.style.setProperty('--tilt-y', `${(px * MAX_TILT).toFixed(2)}deg`);
  };

  const handleMove = (event: PointerEvent) => {
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    py = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    if (!raf) raf = requestAnimationFrame(apply);
  };

  const reset = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    frame.style.setProperty('--tilt-x', '0deg');
    frame.style.setProperty('--tilt-y', '0deg');
  };

  stage.addEventListener('pointermove', handleMove);
  stage.addEventListener('pointerleave', reset);
  stage.addEventListener('pointercancel', reset);
}
