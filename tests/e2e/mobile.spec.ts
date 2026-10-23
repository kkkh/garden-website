import { expect, test } from '@playwright/test';

/**
 * 响应式断点验证（在移动端与平板项目中运行）。
 * 关注：无横向溢出、导航可用、缩略图可滚动、触控目标尺寸。
 */
test.describe('响应式', () => {
  test('无横向溢出', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });

  test('移动端使用抽屉导航，桌面导航隐藏', async ({ page, viewport }) => {
    await page.goto('/');
    const toggle = page.locator('[data-nav-toggle]');
    const nav = page.locator('.site-nav');

    if ((viewport?.width ?? 0) < 1024) {
      await expect(toggle).toBeVisible();
      await expect(nav).toBeHidden();
    } else {
      await expect(toggle).toBeHidden();
      await expect(nav).toBeVisible();
    }
  });

  test('缩略图在窄屏可横向滚动到当前项', async ({ page }) => {
    await page.goto('/#screenshots');
    const rail = page.locator('.showcase__rail');
    await expect(rail).toBeVisible();

    await page.locator('[data-carousel-thumb]').nth(20).click();
    await expect(page.locator('[data-carousel-current]')).toHaveText('21');
    await page.waitForTimeout(500);

    const inView = await page
      .locator('[data-carousel-thumb]')
      .nth(20)
      .evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= -1 && rect.right <= window.innerWidth + 1;
      });
    expect(inView).toBe(true);
  });

  test('手机竖屏下 Hero 与截图保持可读', async ({ page }) => {
    await page.goto('/');
    const heroRect = await page.locator('.hero__title').boundingBox();
    const frameRect = await page.locator('.hero__device').boundingBox();

    expect(heroRect?.width ?? 0).toBeGreaterThan(60);
    expect(frameRect?.width ?? 0).toBeGreaterThan(160);
  });
});
