#!/usr/bin/env node
/**
 * 设计令牌对比度校验（WCAG 2.1）。
 *
 * 规则：
 * - 正文类文本 ≥ 4.5:1（AA）
 * - 大号文本 / 非文本边界 ≥ 3:1（AA）
 * - 额外输出 AAA（7:1）达标情况，便于评估“高级感”是否以可读性为代价
 *
 * 产物：docs/design-system/contrast-report.md（同时打印摘要）
 * 退出码：存在未达标项时返回 1，供 CI / verify 门禁使用。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { wcagContrast } from 'culori';

import { darkColors, lightColors, primitiveColors } from '../src/design/tokens.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = path.join(root, 'docs/design-system/contrast-report.md');

const primitives = { ...primitiveColors };

/** 解析 `var(--color-x)` 或 hex 值为 hex。 */
function resolveColor(value, seen = new Set()) {
  const varMatch = /^var\((--color-[a-z0-9-]+)\)$/i.exec(value.trim());
  if (!varMatch) {
    if (/^#[0-9a-f]{3,8}$/i.test(value.trim())) return value.trim();
    throw new Error(`无法解析颜色：${value}`);
  }
  const token = varMatch[1].slice('--color-'.length);
  if (seen.has(token)) throw new Error(`颜色令牌循环引用：${token}`);
  seen.add(token);
  const next = primitives[token];
  if (!next) throw new Error(`找不到原始色令牌：--color-${token}`);
  return resolveColor(next, seen);
}

function ratio(a, b) {
  return wcagContrast(resolveColor(a), resolveColor(b));
}

const REQUIRED = 4.5;
const LARGE_REQUIRED = 3;

/**
 * 检查项：主题 × 用途 × 目标等级。
 * kind 说明：
 * - text：常规正文与关键文本，要求 ≥ 4.5:1
 * - large：大号文本（≥ 24px 或 ≥ 19px 粗体），要求 ≥ 3:1
 * - nontext：交互组件边界与焦点指示，要求 ≥ 3:1（WCAG 1.4.11）
 * - decorative：纯装饰性发丝线，WCAG 明确豁免，仅记录不判定
 */
const checks = [
  {
    theme: 'light',
    label: '正文 / 画布',
    fg: lightColors['text-primary'],
    bg: lightColors.canvas,
    kind: 'text',
  },
  {
    theme: 'light',
    label: '正文 / 卡片',
    fg: lightColors['text-primary'],
    bg: lightColors.surface,
    kind: 'text',
  },
  {
    theme: 'light',
    label: '次要文字 / 卡片',
    fg: lightColors['text-secondary'],
    bg: lightColors.surface,
    kind: 'text',
  },
  {
    theme: 'light',
    label: '次要文字 / 浅底',
    fg: lightColors['text-secondary'],
    bg: lightColors['surface-muted'],
    kind: 'text',
  },
  {
    theme: 'light',
    label: '三级文字 / 卡片',
    fg: lightColors['text-tertiary'],
    bg: lightColors.surface,
    kind: 'text',
  },
  {
    theme: 'light',
    label: '三级文字 / 浅底',
    fg: lightColors['text-tertiary'],
    bg: lightColors['surface-muted'],
    kind: 'text',
  },
  {
    theme: 'light',
    label: '品牌强调 / 卡片',
    fg: lightColors.accent,
    bg: lightColors.surface,
    kind: 'text',
  },
  {
    theme: 'light',
    label: '品牌强调 / 强调浅底',
    fg: lightColors['accent-strong'],
    bg: lightColors['accent-soft'],
    kind: 'text',
  },
  {
    theme: 'light',
    label: '链接 / 画布',
    fg: lightColors.link,
    bg: lightColors.canvas,
    kind: 'text',
  },
  {
    theme: 'light',
    label: '焦点环 / 卡片',
    fg: lightColors.focus,
    bg: lightColors.surface,
    kind: 'nontext',
  },
  {
    theme: 'light',
    label: '交互边框 / 卡片',
    fg: lightColors['border-strong'],
    bg: lightColors.surface,
    kind: 'nontext',
  },
  {
    theme: 'light',
    label: '危险色 / 卡片',
    fg: lightColors.danger,
    bg: lightColors.surface,
    kind: 'text',
  },
  {
    theme: 'light',
    label: '成功色 / 卡片',
    fg: lightColors.success,
    bg: lightColors.surface,
    kind: 'text',
  },
  {
    theme: 'light',
    label: '墨区正文 / 墨区底',
    fg: lightColors['hero-text'],
    bg: lightColors['hero-surface'],
    kind: 'text',
  },
  {
    theme: 'light',
    label: '墨区次要文字 / 墨区底',
    fg: lightColors['hero-text-muted'],
    bg: lightColors['hero-surface'],
    kind: 'text',
  },
  {
    theme: 'light',
    label: '墨区金色装饰文字 / 墨区底',
    fg: '#e2c987',
    bg: lightColors['hero-surface'],
    kind: 'text',
  },
  {
    theme: 'light',
    label: '发丝线 / 卡片',
    fg: lightColors['border-subtle'],
    bg: lightColors.surface,
    kind: 'decorative',
  },

  {
    theme: 'dark',
    label: '正文 / 画布',
    fg: darkColors['text-primary'],
    bg: darkColors.canvas,
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '正文 / 卡片',
    fg: darkColors['text-primary'],
    bg: darkColors.surface,
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '次要文字 / 卡片',
    fg: darkColors['text-secondary'],
    bg: darkColors.surface,
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '次要文字 / 浅底',
    fg: darkColors['text-secondary'],
    bg: darkColors['surface-muted'],
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '三级文字 / 卡片',
    fg: darkColors['text-tertiary'],
    bg: darkColors.surface,
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '三级文字 / 浅底',
    fg: darkColors['text-tertiary'],
    bg: darkColors['surface-muted'],
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '品牌强调 / 卡片',
    fg: darkColors.accent,
    bg: darkColors.surface,
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '品牌强调 / 强调浅底',
    fg: darkColors['accent-strong'],
    bg: darkColors['accent-soft'],
    kind: 'text',
  },
  { theme: 'dark', label: '链接 / 画布', fg: darkColors.link, bg: darkColors.canvas, kind: 'text' },
  {
    theme: 'dark',
    label: '焦点环 / 卡片',
    fg: darkColors.focus,
    bg: darkColors.surface,
    kind: 'nontext',
  },
  {
    theme: 'dark',
    label: '交互边框 / 卡片',
    fg: darkColors['border-strong'],
    bg: darkColors.surface,
    kind: 'nontext',
  },
  {
    theme: 'dark',
    label: '危险色 / 卡片',
    fg: darkColors.danger,
    bg: darkColors.surface,
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '成功色 / 卡片',
    fg: darkColors.success,
    bg: darkColors.surface,
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '墨区正文 / 墨区底',
    fg: darkColors['hero-text'],
    bg: darkColors['hero-surface'],
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '墨区次要文字 / 墨区底',
    fg: darkColors['hero-text-muted'],
    bg: darkColors['hero-surface'],
    kind: 'text',
  },
  {
    theme: 'dark',
    label: '发丝线 / 卡片',
    fg: darkColors['border-subtle'],
    bg: darkColors.surface,
    kind: 'decorative',
  },
];

const requiredFor = (kind) => (kind === 'text' ? REQUIRED : LARGE_REQUIRED);

const results = checks.map((check) => {
  const value = ratio(check.fg, check.bg);
  const required = requiredFor(check.kind);
  return {
    ...check,
    value,
    required,
    pass: check.kind === 'decorative' ? true : value >= required,
    aaa: value >= 7,
  };
});

const failures = results.filter((item) => !item.pass);
const exempted = results.filter((item) => item.kind === 'decorative');

const fmt = (n) => n.toFixed(2);

const lines = [
  '# 设计令牌对比度报告（WCAG 2.1）',
  '',
  '> 本文件由 `npm run check:contrast` 生成，请勿手工编辑。',
  `> 生成时间：${new Date().toISOString()}`,
  '',
  '判定标准：',
  '',
  '- 常规文本 ≥ 4.5:1（AA）',
  '- 大号文本（≥ 24px 或 ≥ 19px 粗体）≥ 3:1',
  '- 交互组件边界与焦点指示 ≥ 3:1（WCAG 1.4.11）',
  '- 纯装饰性发丝线按 WCAG 1.4.11 豁免，仅记录数值不参与判定',
  '',
  '| 主题 | 用途 | 前景 | 背景 | 对比度 | 要求 | 结果 | AAA |',
  '| --- | --- | --- | --- | ---: | ---: | :---: | :---: |',
  ...results.map(
    (item) =>
      `| ${item.theme === 'light' ? '浅色' : '深色'} | ${item.label} | \`${resolveColor(item.fg)}\` | \`${resolveColor(item.bg)}\` | ${fmt(item.value)}:1 | ${item.kind === 'decorative' ? '豁免' : `${item.required}:1`} | ${item.kind === 'decorative' ? '—' : item.pass ? '✅' : '❌'} | ${item.aaa ? '✅' : '—'} |`,
  ),
  '',
  `检查项合计：${results.length}（其中装饰性豁免 ${exempted.length} 项），通过：${results.length - failures.length}，未通过：${failures.length}。`,
  '',
];

if (failures.length > 0) {
  lines.push('## 未通过项', '');
  for (const item of failures) {
    lines.push(
      `- ${item.theme === 'light' ? '浅色' : '深色'} · ${item.label}：${fmt(item.value)}:1 < ${item.required}:1`,
    );
  }
  lines.push('');
}

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${lines.join('\n')}\n`, 'utf8');

console.log(
  `[contrast] 检查 ${results.length} 项，未通过 ${failures.length} 项。报告：docs/design-system/contrast-report.md`,
);

if (failures.length > 0) {
  for (const item of failures) {
    console.error(
      `  ✗ ${item.theme} · ${item.label}：${fmt(item.value)}:1（要求 ${item.required}:1）`,
    );
  }
  process.exit(1);
}
