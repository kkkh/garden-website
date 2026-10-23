#!/usr/bin/env node
/**
 * 从 src/assets/brand/app-icon.png 生成站点图标与社交分享图。
 *
 * 产物（提交入库，路径稳定，便于 manifest / apple-touch-icon / OG 引用）：
 *   public/icons/favicon-32.png
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/icons/apple-touch-icon.png
 *   public/icons/favicon.svg
 *   public/og/og-default.png   （1200×630）
 *
 * 依赖：sharp（已作为项目依赖锁定版本）。字体使用系统字体栈，渲染失败时保留纯图形版本。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src/assets/brand/app-icon.png');
const iconDir = path.join(root, 'public/icons');
const ogDir = path.join(root, 'public/og');

const INK = '#070c14';
const INK_ALT = '#0d1524';
const GOLD = '#b8934a';
const GOLD_LIGHT = '#e2c987';
const PAPER = '#fbf9f3';

async function buildIcons() {
  await mkdir(iconDir, { recursive: true });

  const sizes = [
    { file: 'favicon-32.png', size: 32 },
    { file: 'icon-192.png', size: 192 },
    { file: 'icon-512.png', size: 512 },
    { file: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { file, size } of sizes) {
    await sharp(source)
      .resize(size, size, { fit: 'cover', kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toFile(path.join(iconDir, file));
  }

  // SVG favicon：以内嵌位图保证与 PNG 完全一致，同时提供矢量容器。
  const iconBuffer = await sharp(source).resize(64, 64, { fit: 'cover' }).png().toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <clipPath id="r"><rect width="64" height="64" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <image href="data:image/png;base64,${iconBuffer.toString('base64')}" width="64" height="64"/>
  </g>
</svg>
`;
  await writeFile(path.join(iconDir, 'favicon.svg'), svg, 'utf8');
}

async function buildOgImage() {
  await mkdir(ogDir, { recursive: true });

  const width = 1200;
  const height = 630;
  const icon = await sharp(source).resize(168, 168, { fit: 'cover' }).png().toBuffer();
  const iconB64 = icon.toString('base64');

  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${INK}"/>
      <stop offset="0.55" stop-color="${INK_ALT}"/>
      <stop offset="1" stop-color="#101a2b"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.06" r="0.72">
      <stop offset="0" stop-color="${GOLD}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="88" height="88" patternUnits="userSpaceOnUse">
      <path d="M88 0H0V88" fill="none" stroke="${PAPER}" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <rect x="28" y="28" width="${width - 56}" height="${height - 56}" fill="none" stroke="${GOLD}" stroke-opacity="0.32"/>
  <rect x="0" y="0" width="10" height="${height}" fill="${GOLD}"/>
  <g transform="translate(96, 120)">
    <rect width="168" height="168" rx="38" fill="#0a1220" stroke="${GOLD}" stroke-opacity="0.5"/>
    <image href="data:image/png;base64,${iconB64}" x="0" y="0" width="168" height="168"/>
  </g>
  <text x="304" y="212" font-family="PingFang SC, Songti SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif" font-size="112" font-weight="600" fill="${PAPER}" letter-spacing="10">园枢</text>
  <text x="308" y="272" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif" font-size="30" fill="${GOLD_LIGHT}" letter-spacing="4">山西晋中理工学院校园移动应用</text>
  <line x1="308" y1="316" x2="1104" y2="316" stroke="${GOLD}" stroke-opacity="0.45"/>
  <text x="308" y="368" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif" font-size="27" fill="#b8c2d0">聚合官网要闻 · 通知公告 · 院系专业 · 招生资讯</text>
  <text x="308" y="414" font-family="PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, sans-serif" font-size="27" fill="#b8c2d0">无需注册 · 不收集信息 · 收藏搜索与本地提醒</text>
  <g transform="translate(96, 486)">
    <rect width="188" height="52" rx="26" fill="none" stroke="${GOLD}" stroke-opacity="0.65"/>
    <text x="94" y="34" text-anchor="middle" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="21" fill="${GOLD_LIGHT}">iOS 26.0+</text>
  </g>
  <text x="1104" y="566" text-anchor="end" font-family="SFMono-Regular, Menlo, monospace" font-size="22" fill="${GOLD_LIGHT}">jl.43322.cn</text>
  <text x="1104" y="522" text-anchor="end" font-family="PingFang SC, Hiragino Sans GB, sans-serif" font-size="21" fill="#8a96a6">22 张真机界面 · 10 张平台架构图</text>
</svg>`;

  await sharp(Buffer.from(overlay))
    .png({ compressionLevel: 9 })
    .toFile(path.join(ogDir, 'og-default.png'));
}

await buildIcons();
await buildOgImage();
console.log('[icons] 已生成 public/icons 与 public/og/og-default.png');
