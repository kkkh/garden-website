import type { Page } from '@playwright/test';

/**
 * 视觉基线的稳定化辅助：让首屏编排与滚动显现进入稳定终态，
 * 避免全页截图捕捉到动画中间帧。
 *
 * 视觉用例仍依赖 Playwright 的 animations: 'disabled'，
 * 这里额外消除时序不确定性。
 */
export async function settleVisuals(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
      element.classList.add('is-visible');
    });
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>('.hero__copy > *, .hero__stage'),
      );
      return nodes.every((element) => Number(getComputedStyle(element).opacity) >= 0.99);
    },
    undefined,
    { timeout: 3000 },
  );
  await page.waitForTimeout(700);
}
