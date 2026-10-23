import { expect, test } from '@playwright/test';

/**
 * 应用下载与应用信息区。
 * 当前应用未上架，断言「soon」状态下的降级表现；
 * 已上架后的断言由 `data-app-store-state="live"` 分支守护，切换数据后自动生效。
 */

test.describe('应用下载区', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#download');
  });

  test('区块存在且状态与数据一致', async ({ page }) => {
    const section = page.locator('#download');
    await expect(section).toBeVisible();
    await expect(section).toHaveAttribute('data-app-store-state', 'soon');
    await expect(page.locator('#download-title')).toHaveText('下载园枢');
  });

  test('未上架时不渲染任何 App Store 外链与二维码', async ({ page }) => {
    await expect(page.locator('a[href^="https://apps.apple.com"]')).toHaveCount(0);
    await expect(page.locator('#download img[src*="/qr/"]')).toHaveCount(0);
    await expect(page.locator('meta[name="apple-itunes-app"]')).toHaveCount(0);
  });

  test('提供邮件上架提醒入口', async ({ page }) => {
    const remind = page.locator('#download a[href^="mailto:"]');
    await expect(remind).toHaveCount(1);
    await expect(remind).toContainText('上架时提醒我');
  });

  test('应用信息与隐私摘要完整', async ({ page }) => {
    const specs = page.locator('#download .spec-list div');
    await expect(specs).toHaveCount(10);
    await expect(page.locator('#download .spec-list')).toContainText('兼容性');
    await expect(page.locator('#download .spec-list')).toContainText('iOS 26.0 或更高版本');
    await expect(page.locator('#download .spec-list')).toContainText('上架后公布');

    const privacy = page.locator('#download .app-info__privacy');
    await expect(privacy).toContainText('不收集姓名、手机号、邮箱与位置');
    await expect(privacy.locator('a[href="/privacy.html"]')).toHaveCount(1);
    await expect(privacy.locator('a[href="#system"]')).toHaveCount(1);
  });

  test('结构化数据保持 PreOrder 且不含安装地址', async ({ page }) => {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const app = blocks
      .map((block) => JSON.parse(block) as Record<string, unknown>)
      .find((schema) => schema['@type'] === 'MobileApplication');
    expect(app).toBeDefined();
    const offers = app?.offers as Record<string, unknown> | undefined;
    expect(offers?.availability).toBe('https://schema.org/PreOrder');
    expect(offers?.url).toBeUndefined();
    expect(app?.installUrl).toBeUndefined();
  });
});
