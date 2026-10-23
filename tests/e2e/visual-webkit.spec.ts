import { expect, test } from '@playwright/test';

import { settleVisuals } from './visual-helpers';

/**
 * WebKit（Safari）视觉基线 @visual
 *
 * 目的：Chromium 基线无法发现 Safari 在 aspect-ratio、clamp()、可变字体与
 * 图片解码上的渲染差异，而本站受众主要来自 iOS。
 *
 * 只覆盖最关键的 6 个界面：首屏、轮播舞台、法律页、灯箱、深色首屏、404。
 * 全页截图在 WebKit 下体积过大，交由 Chromium 基线守护。
 */

test.describe('WebKit 关键界面基线 @visual', () => {
  test('首屏', async ({ page }) => {
    await page.goto('/');
    await settleVisuals(page);
    await expect(page.locator('.hero')).toHaveScreenshot('webkit-home-hero.png');
  });

  test('轮播舞台', async ({ page }) => {
    await page.goto('/#screenshots');
    await expect(page.locator('.showcase__stage')).toBeVisible();
    await expect(page.locator('.showcase__stage')).toHaveScreenshot('webkit-showcase-stage.png');
  });

  test('法律页', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page.locator('.legal-article')).toBeVisible();
    await expect(page.locator('.legal-article')).toHaveScreenshot('webkit-legal-article.png');
  });

  test('灯箱打开', async ({ page }) => {
    await page.goto('/#screenshots');
    await page.locator('[data-carousel-expand]').click();
    const dialog = page.locator('dialog[data-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveScreenshot('webkit-lightbox-open.png');
  });

  test('深色首屏', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[data-theme-value="dark"]').click();
    await expect(page.locator('.hero')).toHaveScreenshot('webkit-home-hero-dark.png');
  });

  test('404 页面', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.locator('.error-page')).toHaveScreenshot('webkit-error-page.png');
  });
});
