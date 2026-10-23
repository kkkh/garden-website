import { expect, test } from '@playwright/test';

/**
 * 视觉回归基线。
 * 覆盖桌面 / 平板 / 手机 × 浅色 / 深色，以及关键组件状态。
 *
 * 用例标题统一带 `@visual` 标记，便于 CI 按平台拆分：
 * - 视觉用例仅在 macOS runner 上执行（基线文件名含 `-darwin` 平台后缀）；
 * - 其他 CI 任务用 `--grep-invert=@visual` 跳过，避免跨平台像素差异造成假失败。
 *
 * 首次运行会生成基线：`npm run test:visual:update`。
 */

test.describe('页面视觉基线 @visual', () => {
  test('首页首屏', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page).toHaveScreenshot('home-hero.png', { fullPage: false });
  });

  test('首页全页', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page).toHaveScreenshot('home-full.png', { fullPage: true });
  });

  test('截图轮播区', async ({ page }) => {
    await page.goto('/#screenshots');
    await expect(page.locator('[data-carousel]')).toBeInViewport();
    await expect(page.locator('.showcase__stage')).toHaveScreenshot('showcase-stage.png');
  });

  test('轮播切换后状态', async ({ page }) => {
    await page.goto('/#screenshots');
    await page.locator('[data-carousel-thumb]').nth(6).click();
    await expect(page.locator('.showcase__meta')).toHaveScreenshot('showcase-meta-07.png');
  });

  test('隐私政策页', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page.locator('.legal-article')).toBeVisible();
    await expect(page.locator('.legal-article')).toHaveScreenshot('legal-article.png');
  });

  test('404 页面', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.locator('.error-page')).toHaveScreenshot('error-page.png');
  });
});

test.describe('组件状态矩阵 @visual', () => {
  test('按钮四种状态', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('.hero__actions');
    await expect(hero).toHaveScreenshot('buttons-default.png');

    await hero.getByRole('link', { name: '了解功能' }).hover();
    await expect(hero).toHaveScreenshot('buttons-hover-primary.png');

    await hero.getByRole('link', { name: '了解功能' }).focus();
    await expect(hero).toHaveScreenshot('buttons-focus-primary.png');
  });

  test('卡片 hover 状态', async ({ page }) => {
    await page.goto('/#features');
    const card = page.locator('.feature-item').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveScreenshot('feature-card-default.png');
    await card.hover();
    await expect(card).toHaveScreenshot('feature-card-hover.png');
  });

  test('主题切换控件状态', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.theme-toggle');
    await expect(toggle).toHaveScreenshot('theme-toggle-system.png');
    await page.locator('button[data-theme-value="dark"]').click();
    await expect(toggle).toHaveScreenshot('theme-toggle-dark.png');
  });
});

test.describe('灯箱与深色主题 @visual', () => {
  test('灯箱打开状态', async ({ page }) => {
    await page.goto('/#screenshots');
    await page.locator('[data-carousel-expand]').click();
    const dialog = page.locator('dialog[data-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveScreenshot('lightbox-open.png');
  });

  test('深色主题首页首屏', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[data-theme-value="dark"]').click();
    await expect(page.locator('.hero')).toHaveScreenshot('home-hero-dark.png');
  });

  test('深色主题法律页', async ({ page }) => {
    await page.goto('/agreement.html');
    await page.locator('button[data-theme-value="dark"]').click();
    await expect(page.locator('.legal-article')).toHaveScreenshot('legal-article-dark.png');
  });
});
