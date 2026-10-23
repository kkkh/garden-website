/**
 * 生成每页独立 OG 图（1200×630）。
 *
 * 一次性执行并提交产物：`node scripts/generate-og.mjs`
 * - 不进入 `build`，避免 CI 字体差异导致文字渲染异常或构建变慢；
 * - 颜色全部取自设计令牌，保持与站点一致；
 * - 文案改动后重新执行即可。
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { primitiveColors } from '../src/design/tokens.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'og');

const ink = primitiveColors['ink-900'];
const inkSoft = primitiveColors['ink-800'];
const paper = primitiveColors['paper-50'];
const muted = primitiveColors['ink-200'];
const faint = primitiveColors['ink-300'];
const gold = primitiveColors['gold-300'];
const goldDeep = primitiveColors['gold-500'];

const pages = [
  {
    slug: 'privacy',
    eyebrow: 'PRIVACY POLICY',
    title: '隐私政策',
    subtitle: '数据最小化 · 本地优先 · 无第三方统计',
  },
  {
    slug: 'agreement',
    eyebrow: 'TERMS OF USE',
    title: '用户协议',
    subtitle: '使用规则 · 内容声明 · 责任范围',
  },
  {
    slug: 'changelog',
    eyebrow: 'CHANGELOG',
    title: '更新日志',
    subtitle: '新增功能 · 体验改进 · 问题修复',
  },
];

const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function renderSvg({ eyebrow, title, subtitle }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ink}"/>
      <stop offset="1" stop-color="${inkSoft}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.08" r="0.7">
      <stop offset="0" stop-color="${gold}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${gold}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <g stroke="${goldDeep}" stroke-opacity="0.35">
    <line x1="80" y1="0" x2="80" y2="630"/>
    <line x1="1120" y1="0" x2="1120" y2="630"/>
  </g>

  <rect x="80" y="104" width="56" height="3" fill="${gold}"/>

  <text x="152" y="112" font-family="Helvetica Neue, Arial, sans-serif" font-size="22" letter-spacing="5" fill="${gold}">${escapeXml(eyebrow)}</text>

  <text x="80" y="300" font-family="Songti SC, Noto Serif CJK SC, serif" font-size="92" font-weight="600" fill="${paper}">${escapeXml(title)}</text>

  <text x="80" y="372" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="30" fill="${muted}">${escapeXml(subtitle)}</text>

  <rect x="80" y="470" width="1040" height="1" fill="${goldDeep}" fill-opacity="0.4"/>

  <text x="80" y="530" font-family="Songti SC, Noto Serif CJK SC, serif" font-size="30" fill="${paper}">园枢</text>
  <text x="150" y="530" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="24" fill="${faint}">校园信息聚合应用</text>
  <text x="80" y="574" font-family="Helvetica Neue, Arial, sans-serif" font-size="22" letter-spacing="2" fill="${gold}">jl.43322.cn</text>
</svg>`;
}

await mkdir(outDir, { recursive: true });

for (const page of pages) {
  const file = path.join(outDir, `og-${page.slug}.png`);
  await sharp(Buffer.from(renderSvg(page)))
    .png({ compressionLevel: 9, palette: true })
    .toFile(file);
  const info = await sharp(file).metadata();
  console.log(`[og] ${path.relative(root, file)} ${info.width}×${info.height}`);
}
