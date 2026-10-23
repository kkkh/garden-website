import { expect, test } from '@playwright/test';

/**
 * 减弱动效（prefers-reduced-motion: reduce）降级验证。
 * 要求：内容仍然完整可见；不出现持续动画；切换使用非平滑滚动。
 */
test.use({ reducedMotion: 'reduce' });

test('所有滚动显现与首屏编排内容直接可见，不依赖动画', async ({ page }) => {
  await page.goto('/');

  const hidden = await page.evaluate(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal], .hero__copy > *, .hero__stage'),
    );
    return elements
      .filter((element) => Number(getComputedStyle(element).opacity) < 0.99)
      .map((element) => element.className);
  });

  expect(hidden).toEqual([]);
});

test('首屏图标无持续浮动动画', async ({ page }) => {
  await page.goto('/');

  const animation = await page
    .locator('.hero__device')
    .evaluate((element) => getComputedStyle(element).animationName);

  expect(animation === 'none' || animation === '').toBe(true);
});

test('轮播切换不依赖过渡动画且状态即时更新', async ({ page }) => {
  await page.goto('/#screenshots');

  const transition = await page
    .locator('[data-carousel-slide]')
    .first()
    .evaluate((element) => getComputedStyle(element).transitionDuration);

  // reduced-motion 规则把 transition-duration 改写为 0.01ms；浏览器可能序列化为 1e-05s
  expect(Number.parseFloat(transition)).toBeLessThanOrEqual(0.0001);

  await page.locator('[data-carousel-next]').click();
  await expect(page.locator('[data-carousel-current]')).toHaveText('02');
});

test('锚点跳转不使用平滑滚动', async ({ page }) => {
  await page.goto('/');
  const behavior = await page
    .locator('html')
    .evaluate((element) => getComputedStyle(element).scrollBehavior);
  expect(behavior).toBe('auto');
});
