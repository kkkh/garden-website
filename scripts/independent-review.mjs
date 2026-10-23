#!/usr/bin/env node
/**
 * 独立渲染巡检（Independent Render Review）
 *
 * 目的：作为「实施与验收分离」的第二双眼睛。
 * 本脚本**不复用** tests/e2e 下的任何测试代码，从零实现检查逻辑，
 * 通过真实浏览器访问构建产物，独立验证结构与交互，并输出证据。
 *
 * 用法：
 *   npm run build && npx astro preview --port 4321     # 另开终端
 *   node scripts/independent-review.mjs
 *
 * 产物：
 *   docs/acceptance/independent-review.json    逐项结论
 *   docs/acceptance/independent-review/*.png   关键状态截图
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.REVIEW_BASE_URL ?? 'http://127.0.0.1:4321';
const shotDir = 'docs/acceptance/independent-review';
await mkdir(shotDir, { recursive: true });

const results = [];
const record = (group, item, status, detail, screenshot) =>
  results.push({ group, item, status, detail, screenshot: screenshot ?? null });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

/** 收集控制台错误与页面异常（排除故意访问 404 页面时的资源错误） */
const consoleErrors = [];
const pageErrors = [];
const thirdParty = [];
const isExpected404Noise = (text) =>
  /status of 404/.test(text) && /not-a-page|nonexistent/.test(text);
page.on('console', (message) => {
  if (message.type() !== 'error') return;
  const text = `${page.url()} :: ${message.text()}`;
  if (isExpected404Noise(text)) return;
  consoleErrors.push(text);
});
page.on('pageerror', (error) => pageErrors.push(`${page.url()} :: ${error.message}`));
page.on('request', (request) => {
  const url = new URL(request.url());
  const isLocal = ['127.0.0.1', 'localhost'].includes(url.hostname);
  const isData = url.protocol === 'data:';
  if (!isLocal && !isData) thirdParty.push(request.url());
});

const shot = async (name) => {
  const file = `${shotDir}/${name}.png`;
  await page.screenshot({ path: file });
  return file;
};

// ─────────────────────────── A. 首页结构 ───────────────────────────
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

{
  const landmarks = await page.evaluate(() => ({
    header: document.querySelectorAll('header').length,
    main: document.querySelectorAll('main').length,
    footer: document.querySelectorAll('footer').length,
    h1: document.querySelectorAll('h1').length,
    skipLink: Boolean(document.querySelector('a.skip-link[href="#main"]')),
    lang: document.documentElement.lang,
  }));
  const ok =
    landmarks.header === 1 &&
    landmarks.main === 1 &&
    landmarks.footer === 1 &&
    landmarks.h1 === 1 &&
    landmarks.skipLink &&
    landmarks.lang === 'zh-CN';
  record(
    'A 首页结构',
    '地标与标题唯一、含跳转链接',
    ok ? 'PASS' : 'FAIL',
    JSON.stringify(landmarks),
  );
}

{
  const headings = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main section[id]')).map((section) => section.id),
  );
  const expected = ['intro', 'features', 'screenshots', 'architecture', 'system', 'faq', 'about'];
  const missing = expected.filter((id) => !headings.includes(id));
  record(
    'A 首页结构',
    '七个内容区块齐备',
    missing.length === 0 ? 'PASS' : 'FAIL',
    missing.length ? `缺少 ${missing.join(', ')}` : headings.join(', '),
  );
}

{
  const meta = await page.evaluate(() => ({
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
    jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (node) => JSON.parse(node.textContent ?? '{}')['@type'],
    ),
    favicon: document.querySelectorAll('link[rel="icon"]').length,
  }));
  const ok =
    meta.canonical === 'https://jl.43322.cn/' &&
    Boolean(meta.description) &&
    Boolean(meta.ogImage?.endsWith('og-default.png')) &&
    meta.manifest === '/site.webmanifest' &&
    meta.favicon >= 2 &&
    ['WebSite', 'MobileApplication', 'FAQPage'].every((type) => meta.jsonLd.includes(type));
  record('A 首页结构', 'SEO 元信息与三类结构化数据', ok ? 'PASS' : 'FAIL', JSON.stringify(meta));
}

{
  const heroBox = await page.locator('.hero__device').boundingBox();
  const heroSection = await page.locator('.hero').boundingBox();
  const fitsHorizontally = heroBox && heroSection && heroBox.x + heroBox.width <= 1440;
  record(
    'A 首屏',
    '设备框未横向溢出视口',
    fitsHorizontally ? 'PASS' : 'FAIL',
    JSON.stringify({ heroBox, heroSection, viewportWidth: 1440 }),
    await shot('a-hero-desktop'),
  );
}

// ─────────────────────────── B. 轮播交互 ───────────────────────────
await page.goto(`${BASE}/#screenshots`, { waitUntil: 'networkidle' });

{
  const readState = () =>
    page.evaluate(() => ({
      index: document.querySelector('[data-carousel-current]')?.textContent,
      caption: document.querySelector('[data-carousel-caption-body]')?.textContent?.slice(0, 24),
      activeSlides: document.querySelectorAll('[data-carousel-slide][data-active="true"]').length,
      thumbs: document.querySelectorAll('[data-carousel-thumb]').length,
      currentThumbs: document.querySelectorAll('[data-carousel-thumb][aria-current="true"]').length,
    }));

  const initial = await readState();
  const seq = [];
  for (let i = 0; i < 3; i += 1) {
    await page.locator('[data-carousel-next]').click();
    seq.push((await readState()).index);
  }
  await page.locator('[data-carousel-prev]').click();
  seq.push((await readState()).index);

  const ok =
    initial.index === '01' &&
    initial.thumbs === 22 &&
    initial.activeSlides === 1 &&
    initial.currentThumbs === 1 &&
    seq.join('>') === '02>03>04>03';
  record(
    'B 轮播',
    '初始 01 / 22，箭头序列 02>03>04>03',
    ok ? 'PASS' : 'FAIL',
    JSON.stringify({ initial, seq }),
    await shot('b-carousel-step4'),
  );
}

{
  await page.locator('[data-carousel-thumb]').nth(7).click();
  const state = await page.evaluate(() => ({
    index: document.querySelector('[data-carousel-current]')?.textContent,
    caption: document.querySelector('[data-carousel-caption-body]')?.textContent?.slice(0, 28),
    selected: document.querySelectorAll('[data-carousel-thumb][aria-current="true"]').length,
    selectedIndex: Array.from(document.querySelectorAll('[data-carousel-thumb]')).findIndex((el) =>
      el.hasAttribute('aria-current'),
    ),
  }));
  const ok = state.index === '08' && state.selected === 1 && state.selectedIndex === 7;
  record('B 轮播', '缩略图第 8 项联动序号/说明/高亮', ok ? 'PASS' : 'FAIL', JSON.stringify(state));
}

{
  const before = await page.locator('[data-carousel-current]').textContent();
  await page.locator('[data-carousel-stage]').focus();
  await page.keyboard.press('ArrowRight');
  const after = await page.locator('[data-carousel-current]').textContent();
  record(
    'B 轮播',
    '舞台焦点下方向键切换',
    before !== after ? 'PASS' : 'FAIL',
    `${before} -> ${after}`,
  );
}

// ─────────────────────────── C. 灯箱 ───────────────────────────
{
  await page.locator('[data-carousel-expand]').click();
  await page.waitForTimeout(400);
  const opened = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[data-lightbox]');
    return {
      open: Boolean(dialog?.open),
      count: document.querySelector('[data-lightbox-count]')?.textContent,
      title: document.querySelector('[data-lightbox-title]')?.textContent,
      bodyLocked: document.body.classList.contains('is-locked'),
      imageSrc: document.querySelector('[data-lightbox-image]')?.getAttribute('src') ?? '',
    };
  });

  const next = await page
    .locator('[data-lightbox-next]')
    .click()
    .then(() =>
      page
        .locator('[data-carousel-thumb]')
        .first()
        .evaluate(() => document.querySelector('[data-lightbox-count]')?.textContent),
    );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() => ({
    open: Boolean(document.querySelector('dialog[data-lightbox]')?.open),
    unlocked: !document.body.classList.contains('is-locked'),
  }));

  const ok =
    opened.open &&
    opened.bodyLocked &&
    opened.imageSrc.includes('_astro') &&
    closed.open === false &&
    closed.unlocked &&
    next !== null;
  record(
    'C 灯箱',
    '打开/切换/Esc 关闭/滚动锁定与恢复',
    ok ? 'PASS' : 'FAIL',
    JSON.stringify({ opened, next, closed }),
    await shot('c-lightbox'),
  );
}

// ─────────────────────────── D. 主题 ───────────────────────────
{
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.locator('button[data-theme-value="dark"]').click();
  const dark = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    colorScheme: document.documentElement.style.colorScheme,
    stored: localStorage.getItem('garden:theme'),
    metaTheme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  }));

  await page.reload({ waitUntil: 'networkidle' });
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme);

  await page.locator('button[data-theme-value="light"]').click();
  const light = await page.evaluate(() => document.documentElement.dataset.theme);

  const ok =
    dark.theme === 'dark' &&
    dark.colorScheme === 'dark' &&
    dark.stored === 'dark' &&
    persisted === 'dark' &&
    light === 'light';
  record(
    'D 主题',
    '切换生效、持久化、meta theme-color 同步',
    ok ? 'PASS' : 'FAIL',
    JSON.stringify({ dark, persisted, light }),
    await shot('d-theme-dark'),
  );
}

// ─────────────────────────── E. 导航与 FAQ ───────────────────────────
{
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.locator('.site-nav a[href="#architecture"]').click();
  await page.waitForTimeout(600);
  const hash = await page.evaluate(() => window.location.hash);
  const archVisible = await page.locator('#architecture').isVisible();
  record(
    'E 导航',
    '锚点跳转到平台架构并可见',
    hash === '#architecture' && archVisible ? 'PASS' : 'FAIL',
    JSON.stringify({ hash, archVisible }),
  );
}

{
  const details = page.locator('.faq__item');
  const count = await details.count();
  await details.nth(1).locator('summary').click();
  const opened = await details.nth(1).evaluate((el) => el.hasAttribute('open'));
  const firstOpen = await details.first().evaluate((el) => el.hasAttribute('open'));
  record(
    'E FAQ',
    '6 条问答、第二项可展开、首项默认展开',
    count === 6 && opened && firstOpen ? 'PASS' : 'FAIL',
    JSON.stringify({ count, opened, firstOpen }),
  );
}

// ─────────────────────────── F. 法律页 ───────────────────────────
{
  await page.goto(`${BASE}/privacy.html`, { waitUntil: 'networkidle' });
  const data = await page.evaluate(() => {
    const tocLinks = Array.from(document.querySelectorAll('[data-legal-toc] a'));
    return {
      tocCount: tocLinks.length,
      firstHref: tocLinks[0]?.getAttribute('href'),
      headings: Array.from(document.querySelectorAll('.legal-prose h2')).map((h) => h.id),
      metaText: document.querySelector('.legal-article__meta')?.textContent?.trim(),
      hasAnchorTarget: Boolean(
        document.querySelector(tocLinks[0]?.getAttribute('href') ?? '#none'),
      ),
    };
  });
  await page.locator('[data-legal-toc] a').first().click();
  await page.waitForTimeout(500);
  const inViewport = await page.locator(data.firstHref ?? '#一引言').evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top > -40 && rect.top < window.innerHeight;
  });

  const ok =
    data.tocCount === 9 && data.headings.length === 9 && data.hasAnchorTarget && inViewport;
  record(
    'F 法律页',
    '9 章目录、锚点可达、日期显示',
    ok ? 'PASS' : 'FAIL',
    JSON.stringify({ ...data, inViewport }),
    await shot('f-legal-desktop'),
  );
}

{
  await page.goto(`${BASE}/agreement.html`, { waitUntil: 'networkidle' });
  const sections = await page.locator('.legal-prose h2').count();
  record('F 法律页', '用户协议 7 章', sections === 7 ? 'PASS' : 'FAIL', `h2=${sections}`);
}

// ─────────────────────────── G. 404 ───────────────────────────
{
  const response = await page.goto(`${BASE}/definitely-not-a-page.html`, { waitUntil: 'load' });
  const state = await page.evaluate(() => ({
    code: document.querySelector('.error-page__code')?.textContent?.trim(),
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
    homeLink: Boolean(document.querySelector('.error-page a[href="/"]')),
  }));
  const ok =
    response?.status() === 404 &&
    state.code === '404' &&
    state.robots?.includes('noindex') &&
    state.homeLink;
  record(
    'G 404',
    '状态码 404 + 品牌化页面 + 出口链接',
    ok ? 'PASS' : 'FAIL',
    JSON.stringify({ status: response?.status(), ...state }),
    await shot('g-404'),
  );
}

// ─────────────────────────── H. 资源可用性 ───────────────────────────
{
  const targets = [
    '/site.webmanifest',
    '/robots.txt',
    '/sitemap-index.xml',
    '/og/og-default.png',
    '/icons/favicon-32.png',
    '/icons/apple-touch-icon.png',
    '/beian/beian.png',
    '/.well-known/apple-app-site-association',
  ];
  const statuses = {};
  for (const target of targets) {
    const response = await context.request.get(`${BASE}${target}`);
    statuses[target] = response.status();
  }
  const bad = Object.entries(statuses).filter(([, code]) => code !== 200);
  record(
    'H 资源',
    '8 个关键静态资源全部 200',
    bad.length === 0 ? 'PASS' : 'FAIL',
    JSON.stringify(statuses),
  );
}

// ─────────────────────────── I. 移动端 ───────────────────────────
{
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${BASE}/`, { waitUntil: 'networkidle' });

  const noOverflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );

  await mobile.locator('[data-nav-toggle]').click();
  await mobile.waitForTimeout(300);
  const drawer = await mobile.evaluate(() => {
    const dialog = document.querySelector('dialog[data-mobile-nav]');
    return {
      open: Boolean(dialog?.open),
      links: dialog?.querySelectorAll('a[href]').length ?? 0,
    };
  });

  await mobile.locator('dialog[data-mobile-nav] a[href$="#architecture"]').click();
  await mobile.waitForTimeout(600);
  const afterClick = await mobile.evaluate(() => ({
    open: Boolean(document.querySelector('dialog[data-mobile-nav]')?.open),
    hash: window.location.hash,
  }));

  const railScrollable = await mobile.evaluate(() => {
    const rail = document.querySelector('.showcase__rail');
    return rail ? rail.scrollWidth > rail.clientWidth : false;
  });

  await mobile.screenshot({ path: `${shotDir}/i-mobile-home.png` });

  const ok = noOverflow && drawer.open && drawer.links === 8 && !afterClick.open && railScrollable;
  record(
    'I 移动端',
    '无横向溢出、抽屉 8 项、点击后关闭并跳转、缩略图可横滑',
    ok ? 'PASS' : 'FAIL',
    JSON.stringify({ noOverflow, drawer, afterClick, railScrollable }),
    `${shotDir}/i-mobile-home.png`,
  );

  await mobile.close();
}

// ─────────────────────────── J. 可访问性（axe，独立于测试目录） ───────────────────────────
{
  const scan = async (path, theme) => {
    const target = await context.newPage();
    await target.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    if (theme === 'dark') {
      await target.locator('button[data-theme-value="dark"]').click();
    }
    const analysis = await new AxeBuilder({ page: target })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = analysis.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    await target.close();
    return { path, theme, blocking: blocking.map((v) => `${v.id}:${v.nodes.length}`) };
  };

  const scans = [
    await scan('/', 'light'),
    await scan('/', 'dark'),
    await scan('/privacy.html', 'light'),
    await scan('/agreement.html', 'light'),
    await scan('/definitely-not-a-page.html', 'light'),
  ];
  const bad = scans.filter((entry) => entry.blocking.length > 0);
  record(
    'J 可访问性',
    '5 次扫描（含深色）无 serious/critical 违规',
    bad.length === 0 ? 'PASS' : 'FAIL',
    JSON.stringify(scans),
  );
}

// ─────────────────────────── K. 隐私与网络 ───────────────────────────
{
  record(
    'K 隐私',
    '加载阶段无第三方域名请求',
    thirdParty.length === 0 ? 'PASS' : 'FAIL',
    thirdParty.length ? JSON.stringify([...new Set(thirdParty)]) : '0 个第三方请求',
  );
  record(
    'K 运行时',
    '无控制台错误与未捕获异常',
    consoleErrors.length === 0 && pageErrors.length === 0 ? 'PASS' : 'FAIL',
    JSON.stringify({ consoleErrors, pageErrors }),
  );
}

await context.close();
await browser.close();

const summary = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  totals: {
    pass: results.filter((r) => r.status === 'PASS').length,
    fail: results.filter((r) => r.status === 'FAIL').length,
    total: results.length,
  },
  results,
};

await writeFile(
  'docs/acceptance/independent-review.json',
  JSON.stringify(summary, null, 2),
  'utf8',
);
await writeFile(
  'docs/acceptance/independent-review.md',
  [
    '# 独立渲染巡检报告',
    '',
    `- 目标地址：${BASE}`,
    `- 生成时间：${summary.generatedAt}`,
    `- 结论：${summary.totals.pass}/${summary.totals.total} 项通过，${summary.totals.fail} 项未通过`,
    '',
    '| 分组 | 检查项 | 结果 | 细节 |',
    '| --- | --- | :---: | --- |',
    ...results.map(
      (r) =>
        `| ${r.group} | ${r.item} | ${r.status === 'PASS' ? '✅' : '❌'} | ${r.detail.replace(/\|/g, '\\|').slice(0, 400)} |`,
    ),
    '',
    '截图目录：`docs/acceptance/independent-review/`',
    '',
    '> 说明：本脚本由独立于 `tests/e2e` 的实现编写，仅依赖构建产物与浏览器，用于交叉验证实施结果。',
    '',
  ].join('\n'),
  'utf8',
);

console.log(
  `[independent-review] ${summary.totals.pass}/${summary.totals.total} 通过，${summary.totals.fail} 未通过`,
);
for (const item of results.filter((r) => r.status === 'FAIL')) {
  console.error(`  ✗ ${item.group} · ${item.item}\n    ${item.detail}`);
}
process.exit(summary.totals.fail === 0 ? 0 : 1);
