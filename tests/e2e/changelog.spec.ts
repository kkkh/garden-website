import { expect, test } from '@playwright/test';

/**
 * 更新日志页与首页预览。
 * 数据来源为 `src/data/releases.ts`，当前只有一条「待上架」版本。
 */

test.describe('更新日志', () => {
  test('页面结构、标题与版本条目', async ({ page }) => {
    await page.goto('/changelog.html');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('更新日志');
    await expect(page.locator('.release-timeline .release')).toHaveCount(1);
    await expect(page.locator('#v1-0-0')).toBeVisible();
    await expect(page.locator('#v1-0-0')).toContainText('首个公开版本');
    await expect(page.locator('#v1-0-0')).toContainText('待上架');
  });

  test('版本锚点可深链定位', async ({ page }) => {
    await page.goto('/changelog.html#v1-0-0');
    await expect(page.locator('#v1-0-0')).toBeInViewport();
  });

  test('SEO 使用独立 OG 与 canonical', async ({ page }) => {
    await page.goto('/changelog.html');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://jl.43322.cn/changelog.html',
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /og-changelog\.png$/,
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(3);
  });

  test('首页预览与完整页互相链接', async ({ page }) => {
    await page.goto('/#updates');
    await expect(page.locator('#updates .release')).toHaveCount(1);
    const more = page.locator('#updates a', { hasText: '查看全部更新' });
    await expect(more).toHaveAttribute('href', '/changelog.html');
    await expect(page.locator('#updates a[href="/changelog.html"]')).toHaveCount(1);
  });

  test('页脚可进入更新日志', async ({ page }) => {
    await page.goto('/');
    const footerLink = page.locator('footer a[href="/changelog.html"]');
    await expect(footerLink).toHaveText('更新日志');
    await footerLink.click();
    await expect(page).toHaveURL(/\/changelog\.html$/);
  });

  test('不加载任何第三方域名资源', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') external.push(url.href);
    });
    await page.goto('/changelog.html');
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });
});
