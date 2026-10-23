import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

/**
 * 视觉基线证据采集：抓取线上 v1 与本地 v2 的同视口截图，用于 before/after 对比。
 *
 * 用法：
 *   1) 本地构建并启动预览：npm run build && npx astro preview --port 4321
 *   2) node scripts/capture-baseline.mjs
 *
 * 产物：docs/acceptance/baseline/{before-v1,after-v2}/*.png
 */
const targets = [
  { name: 'home-hero', path: '/', scrollY: 0 },
  { name: 'home-full', path: '/', fullPage: true },
  { name: 'legal', path: '/privacy.html' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const sources = [
  { key: 'before-v1', baseURL: 'https://jl.43322.cn' },
  { key: 'after-v2', baseURL: 'http://127.0.0.1:4321' },
];

const outDir = 'docs/acceptance/baseline';

const browser = await chromium.launch();

for (const source of sources) {
  const context = await browser.newContext();
  for (const viewport of viewports) {
    const page = await context.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const target of targets) {
      const dir = `${outDir}/${source.key}`;
      await mkdir(dir, { recursive: true });
      const file = `${dir}/${target.name}-${viewport.name}.png`;

      try {
        await page.goto(`${source.baseURL}${target.path}`, {
          waitUntil: 'load',
          timeout: 45_000,
        });
        // 等待图片解码与字体现形，避免半成品截图
        await page.waitForTimeout(2500);
        if (target.scrollY) await page.evaluate((y) => window.scrollTo(0, y), target.scrollY);
        await page.screenshot({ path: file, fullPage: Boolean(target.fullPage) });
        console.log(`✓ ${file}`);
      } catch (error) {
        console.error(`✗ ${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    await page.close();
  }
  await context.close();
}

await browser.close();
console.log('完成。');
