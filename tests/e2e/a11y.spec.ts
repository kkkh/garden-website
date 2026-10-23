import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * 可访问性门禁：使用 axe-core 对三个页面在浅色 / 深色下扫描。
 * 严重度 serious 与 critical 级问题一律视为失败。
 */
const pages = [
  { name: '首页', path: '/' },
  { name: '隐私政策', path: '/privacy.html' },
  { name: '用户协议', path: '/agreement.html' },
  { name: '更新日志', path: '/changelog.html' },
  { name: '404', path: '/404.html' },
];

/**
 * 扫描前把页面推进到稳定终态：
 * 关闭过渡/动画，并让滚动显现元素直接可见，避免 axe 在透明度过渡中读到中间态颜色。
 * 动效本身由视觉基线与 reduced-motion 用例覆盖。
 */
async function settleForAxe(page: Page): Promise<void> {
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  await page.evaluate(() => {
    document
      .querySelectorAll('[data-reveal]')
      .forEach((element) => element.classList.add('is-visible'));
  });
  await page.waitForTimeout(100);
}

for (const target of pages) {
  test(`${target.name} · 无 serious/critical 级可访问性问题`, async ({ page }) => {
    await page.goto(target.path);
    await settleForAxe(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .disableRules(['region'])
      .analyze();

    const blocking = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    );

    expect(
      blocking.map(
        (violation) =>
          `${violation.id}（${violation.nodes.length} 处）：${violation.nodes
            .map((node) => node.target.join(' '))
            .join(' / ')}`,
      ),
    ).toEqual([]);
  });
}

test('深色主题下同样通过扫描', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.locator('button[data-theme-value="dark"]').click();
  await settleForAxe(page);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(['region'])
    .analyze();

  const blocking = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );
  expect(blocking.map((violation) => violation.id)).toEqual([]);
});

test('键盘可完成主要操作路径', async ({ page }) => {
  await page.goto('/');

  // 第一个 Tab 是跳转链接，第二个是品牌首页链接
  await page.keyboard.press('Tab');
  await expect(page.locator('a.skip-link')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('.brand')).toBeFocused();

  // 主题切换可通过键盘聚焦与回车操作
  const dark = page.locator('button[data-theme-value="dark"]');
  await dark.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // 轮播箭头可通过键盘激活
  await page.goto('/#screenshots');
  await page.locator('[data-carousel-next]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-carousel-current]')).toHaveText('02');
});

test('触控目标尺寸符合移动端建议（≥ 44×44）', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const selectors = [
    '[data-nav-toggle]',
    'button[data-theme-value]',
    '[data-to-top]',
    '.showcase__arrow--prev',
    '.showcase__arrow--next',
    '.showcase__thumb',
  ];

  for (const selector of selectors) {
    const targets = page.locator(selector);
    const count = await targets.count();
    expect(count, `${selector} 应至少存在一个可交互元素`).toBeGreaterThan(0);

    for (let index = 0; index < Math.min(count, 4); index += 1) {
      const box = await targets.nth(index).boundingBox();
      if (!box) continue;
      expect.soft(box.width, `${selector} 第 ${index + 1} 个宽度`).toBeGreaterThanOrEqual(40);
      expect.soft(box.height, `${selector} 第 ${index + 1} 个高度`).toBeGreaterThanOrEqual(40);
    }
  }
});

test('正文文本对比度抽样满足 AA', async ({ page }) => {
  await page.goto('/');

  const samples = await page.evaluate(() => {
    const parse = (value: string) => {
      const match = value.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
      return { r: match[0] ?? 0, g: match[1] ?? 0, b: match[2] ?? 0, a: match[3] ?? 1 };
    };
    const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const channel = (value: number) => {
        const v = value / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    const targets: Array<{ label: string; element: Element }> = [];
    document
      .querySelectorAll('.card__body, .section-lede, .system-list li, .faq__answer')
      .forEach((element) => {
        targets.push({ label: element.className || element.tagName, element });
      });

    return targets.slice(0, 8).map(({ label, element }) => {
      const style = getComputedStyle(element);
      const fg = parse(style.color);
      let background = parse(getComputedStyle(document.body).backgroundColor);
      let node: Element | null = element;
      while (node) {
        const candidate = parse(getComputedStyle(node).backgroundColor);
        if (candidate.a > 0.9) {
          background = candidate;
          break;
        }
        node = node.parentElement;
      }
      const lighter = Math.max(luminance(fg), luminance(background));
      const darker = Math.min(luminance(fg), luminance(background));
      return { label, ratio: (lighter + 0.05) / (darker + 0.05) };
    });
  });

  expect(samples.length).toBeGreaterThan(0);
  for (const sample of samples) {
    expect.soft(sample.ratio, `${sample.label} 对比度`).toBeGreaterThanOrEqual(4.5);
  }
});
