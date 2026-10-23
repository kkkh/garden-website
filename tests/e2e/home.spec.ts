import { expect, test } from '@playwright/test';

/**
 * 首页核心流程端到端测试。
 * 覆盖：结构、导航、轮播（箭头/缩略图/键盘/滑动）、灯箱、主题切换、FAQ、外链安全属性。
 */

test.describe('首页结构', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('标题、语言与关键地标齐备', async ({ page }) => {
    await expect(page).toHaveTitle(/园枢/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('header.site-header')).toHaveCount(1);
    await expect(page.locator('footer.site-footer')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('SEO 元信息完整且唯一', async ({ page }) => {
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://jl.43322.cn/',
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /校园信息聚合/,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /og-default\.png$/,
    );
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });

  test('结构化数据可被解析且类型正确', async ({ page }) => {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const schemas = blocks.map((block) => JSON.parse(block) as Record<string, unknown>);
    const types = schemas.map((schema) => schema['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('MobileApplication');
    expect(types).toContain('FAQPage');
  });

  test('跳转链接指向主内容', async ({ page }) => {
    const skip = page.locator('a.skip-link');
    await skip.focus();
    await expect(skip).toBeVisible();
    await expect(skip).toHaveAttribute('href', '#main');
  });
});

test.describe('导航与锚点', () => {
  test('锚点跳转并更新当前区域状态', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '应用截图' }).first().click();
    await expect(page).toHaveURL(/#screenshots$/);
    await expect(page.locator('#screenshots')).toBeInViewport();
  });

  test('移动端抽屉可打开并跳转', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 900 });
    await page.goto('/');

    const toggle = page.locator('[data-nav-toggle]');
    await toggle.click();

    const dialog = page.locator('[data-mobile-nav]');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('link', { name: /平台架构/ }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#architecture$/);
  });

  test('回到顶部按钮在滚动后出现', async ({ page }) => {
    await page.goto('/');
    const toTop = page.locator('[data-to-top]');
    const progress = page.locator('[data-scroll-progress]');
    await expect(toTop).not.toHaveClass(/is-visible/);
    await expect(progress).toHaveAttribute('aria-hidden', 'true');
    await page.evaluate(() => window.scrollTo(0, 2000));
    await expect(toTop).toHaveClass(/is-visible/);
    const transform = await progress.evaluate((element) => getComputedStyle(element).transform);
    expect(transform).not.toBe('matrix(0, 0, 0, 1, 0, 0)');
  });
});

test.describe('截图轮播', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#screenshots');
  });

  test('初始状态为第 1 张，共 22 张', async ({ page }) => {
    await expect(page.locator('[data-carousel-current]')).toHaveText('01');
    await expect(page.locator('.showcase__counter')).toContainText('22');
    await expect(page.locator('[data-carousel-slide][data-active="true"]')).toHaveCount(1);
    await expect(page.locator('[data-carousel-slide][data-position="active"]')).toHaveCount(1);
    await expect(page.locator('[data-carousel-thumb]')).toHaveCount(22);
  });

  test('截图标注 iPhone 13 Pro Max · 苍岭绿', async ({ page }) => {
    const card = page.locator('[data-carousel-slide][data-active="true"] .screenshot-card');
    await expect(card).toHaveAttribute('data-device-model', 'iphone-13-pro-max');
    await expect(card).toHaveAttribute('data-device-finish', 'alpine-green');
    await expect(page.locator('[data-device-label]')).toContainText('iPhone 13 Pro Max');
    await expect(page.locator('[data-device-label]')).toContainText('苍岭绿');
    await expect(page.locator('.hero__device .screenshot-card')).toHaveAttribute(
      'data-device-model',
      'iphone-13-pro-max',
    );
  });

  test('截图完整展示不裁切', async ({ page }) => {
    const heroImage = page.locator('.hero__device .screenshot-card img');
    await expect(heroImage).toBeVisible();

    const metrics = await heroImage.evaluate((image) => {
      const img = image as HTMLImageElement;
      const rect = img.getBoundingClientRect();
      return {
        displayedRatio: rect.width / rect.height,
        naturalRatio: img.naturalWidth / img.naturalHeight,
        fit: getComputedStyle(img).objectFit,
      };
    });

    expect(metrics.fit).not.toBe('cover');
    expect(Math.abs(metrics.displayedRatio - metrics.naturalRatio)).toBeLessThan(0.01);
  });

  test('箭头可前进与环形回退', async ({ page }) => {
    await page.locator('[data-carousel-next]').click();
    await expect(page.locator('[data-carousel-current]')).toHaveText('02');

    await page.locator('[data-carousel-prev]').click();
    await expect(page.locator('[data-carousel-current]')).toHaveText('01');

    await page.locator('[data-carousel-prev]').click();
    await expect(page.locator('[data-carousel-current]')).toHaveText('22');
  });

  test('缩略图点击切换并同步 ARIA 状态', async ({ page }) => {
    const thumb = page.locator('[data-carousel-thumb]').nth(5);
    await thumb.click();

    await expect(page.locator('[data-carousel-current]')).toHaveText('06');
    await expect(page.locator('[data-carousel-thumb][aria-current="true"]')).toHaveCount(1);
    await expect(thumb).toHaveAttribute('aria-current', 'true');
    await expect(thumb).toHaveAttribute('tabindex', '0');
    await expect(page.locator('[data-carousel-thumb]').nth(0)).toHaveAttribute('tabindex', '-1');
  });

  test('说明文字随切换更新', async ({ page }) => {
    const caption = page.locator('[data-carousel-caption-body]');
    const before = await caption.textContent();
    await page.locator('[data-carousel-thumb]').nth(2).click();
    await expect(caption).not.toHaveText(before ?? '');
    await expect(page.locator('[data-carousel-caption-body]')).toContainText('资讯详情');
  });

  test('舞台支持左右方向键切换', async ({ page }) => {
    await page.locator('[data-carousel-stage]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-carousel-current]')).toHaveText('02');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[data-carousel-current]')).toHaveText('01');
  });

  test('缩略图支持方向键、Home 与 End', async ({ page }) => {
    const first = page.locator('[data-carousel-thumb]').first();
    await first.focus();
    await page.keyboard.press('End');
    await expect(page.locator('[data-carousel-current]')).toHaveText('22');

    await page.keyboard.press('Home');
    await expect(page.locator('[data-carousel-current]')).toHaveText('01');

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-carousel-current]')).toHaveText('02');
  });

  test('滑动切换：横向生效，纵向不生效', async ({ page }) => {
    const stage = page.locator('[data-carousel-stage]');
    await stage.scrollIntoViewIfNeeded();
    const box = await stage.boundingBox();
    if (!box) throw new Error('舞台不可见');

    // 取舞台可见区域内的一点（避开顶部右侧的“查看大图”按钮与本页折叠区域）
    const startX = box.x + box.width / 2;
    const startY = Math.max(box.y + 60, 80);

    // 纵向拖动不应切换
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY - 120, { steps: 6 });
    await page.mouse.up();
    await expect(page.locator('[data-carousel-current]')).toHaveText('01');

    // 横向拖动应前进
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 160, startY, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator('[data-carousel-current]')).toHaveText('02');

    // 反向拖动应回退
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 160, startY, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator('[data-carousel-current]')).toHaveText('01');
  });

  test('功能卡「查看相关界面」直达对应截图', async ({ page }) => {
    await page.goto('/#features');
    await page.getByRole('link', { name: /查看消息中心/ }).click();
    await expect(page.locator('[data-carousel-current]')).toHaveText('17');
  });

  test('记录切换事件用于埋点断言', async ({ page }) => {
    await page.goto('/#screenshots');
    await page.locator('[data-carousel-next]').click();
    const events = await page.evaluate(() =>
      (window.__gardenEvents ?? []).map((event) => event.name),
    );
    expect(events).toContain('showcase:change');
  });
});

test.describe('灯箱', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#screenshots');
  });

  test('打开、切换、关闭并返回焦点', async ({ page }) => {
    const expand = page.locator('[data-carousel-expand]');
    await expand.click();

    const dialog = page.locator('dialog[data-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-lightbox-count]')).toHaveText('01 / 22');

    await page.locator('[data-lightbox-next]').click();
    await expect(page.locator('[data-lightbox-count]')).toHaveText('02 / 22');

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('[data-lightbox-count]')).toHaveText('01 / 22');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(expand).toBeFocused();
  });

  test('打开时锁定页面滚动，关闭后恢复', async ({ page }) => {
    await page.locator('[data-carousel-expand]').click();
    await expect(page.locator('body')).toHaveClass(/is-locked/);
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/is-locked/);
  });

  test('轻点截图直接打开大图', async ({ page }) => {
    const dialog = page.locator('dialog[data-lightbox]');
    await page.locator('[data-carousel-slide][data-active="true"] .screenshot-card').click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-lightbox-count]')).toHaveText('01 / 22');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('键盘回车打开大图', async ({ page }) => {
    const dialog = page.locator('dialog[data-lightbox]');
    await page.locator('[data-carousel-stage]').focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('横向拖动切图且不会误开大图', async ({ page }) => {
    const dialog = page.locator('dialog[data-lightbox]');
    const stage = page.locator('[data-carousel-stage]');
    await stage.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.7, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.3, y, { steps: 8 });
    await page.mouse.up();

    await expect(page.locator('[data-carousel-current]')).toHaveText('02');
    await expect(dialog).toBeHidden();
  });

  test('架构图可放大查看', async ({ page }) => {
    await page.goto('/#architecture');
    await page.locator('.architecture-card__button').first().click();
    const dialog = page.locator('dialog[data-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-lightbox-title]')).toHaveText('平台架构图');
    await expect(page.locator('[data-lightbox-count]')).toHaveText('01 / 10');
  });
});

test.describe('主题切换', () => {
  test('浅色 / 深色 / 跟随系统切换并持久化', async ({ page }) => {
    await page.goto('/');

    const dark = page.locator('button[data-theme-value="dark"]');
    await dark.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(dark).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'dark');

    const system = page.locator('button[data-theme-value="system"]');
    await system.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');

    const stored = await page.evaluate(() => localStorage.getItem('garden:theme'));
    expect(stored).toBeNull();

    const light = page.locator('button[data-theme-value="light"]');
    await light.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('首屏不出现主题闪烁（html 在脚本前已带 data-theme）', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('garden:theme', 'dark'));
    await page.goto('/', { waitUntil: 'commit' });
    const attr = await page.locator('html').getAttribute('data-theme');
    expect(attr).toBe('dark');
  });
});

test.describe('FAQ 与法律页面', () => {
  test('FAQ 默认展开第一项且可切换', async ({ page }) => {
    await page.goto('/#faq');
    const items = page.locator('.faq__item');
    await expect(items).toHaveCount(6);
    await expect(items.first()).toHaveAttribute('open', '');

    await items.nth(1).locator('summary').click();
    await expect(items.nth(1)).toHaveAttribute('open', '');
  });

  test('隐私政策：目录锚点与正文标题一致', async ({ page }) => {
    await page.goto('/privacy.html');

    const tocLinks = page.locator('[data-legal-toc] a');
    await expect(tocLinks).toHaveCount(9);

    const firstHref = await tocLinks.first().getAttribute('href');
    expect(firstHref).toBeTruthy();
    await tocLinks.first().click();
    await expect(page.locator(firstHref ?? '#')).toBeInViewport();
  });

  test('用户协议：含 7 个章节与返回首页入口', async ({ page }) => {
    await page.goto('/agreement.html');
    await expect(page.locator('.legal-prose h2')).toHaveCount(7);
    await page.getByRole('link', { name: '返回首页' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('法律页可在两页之间往返', async ({ page }) => {
    await page.goto('/privacy.html');
    await page.locator('.legal-article__nav').getByRole('link', { name: '用户协议' }).click();
    await expect(page).toHaveURL(/agreement\.html$/);
    await expect(page.locator('h1')).toHaveText('用户协议');
  });
});

test.describe('外链与安全属性', () => {
  test('备案外链带 noopener noreferrer 且指向官方站点', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a[href^="https://beian."]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);

    for (let index = 0; index < count; index += 1) {
      const link = links.nth(index);
      await expect(link).toHaveAttribute('rel', /noopener/);
      await expect(link).toHaveAttribute('rel', /noreferrer/);
      await expect(link).toHaveAttribute('target', '_blank');
    }
  });

  test('页面加载阶段不请求第三方域名', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) external.push(request.url());
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    expect(external).toEqual([]);
  });
});

test.describe('404 页面', () => {
  test('未知路径返回品牌化 404 并提供出口', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist.html');
    expect(response?.status()).toBe(404);
    await expect(page.locator('.error-page__code')).toHaveText('404');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
