#!/usr/bin/env node
/**
 * 从 src/design/tokens.ts 生成 src/styles/tokens.generated.css。
 *
 * 用法：
 *   node scripts/generate-tokens.mjs           -> 写入文件
 *   node scripts/generate-tokens.mjs --check   -> 仅校验生成结果是否与文件一致
 *
 * 生成文件是只读产物，禁止手改；修改请编辑 tokens.ts。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  primitiveColors,
  lightColors,
  darkColors,
  lightShadows,
  darkShadows,
  typography,
  space,
  radii,
  motion,
  layout,
  zIndex,
  focus,
  printColors,
} from '../src/design/tokens.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'src/styles/tokens.generated.css');

const lines = [];
const push = (line = '') => lines.push(line);

/** @param {string} key */
const kebab = (key) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** @param {Record<string, string>} obj */
const declarations = (obj, prefix, transform = (v) => v, indent = '  ') => {
  for (const [key, value] of Object.entries(obj)) {
    push(`${indent}${prefix}${kebab(key)}: ${transform(value)};`);
  }
};

const colorBlock = (colors, indent = '  ') => {
  for (const [key, value] of Object.entries(colors)) {
    push(`${indent}--color-${key}: ${value};`);
  }
};

const build = () => {
  push('/* 本文件由 scripts/generate-tokens.mjs 自动生成，请勿直接编辑。 */');
  push('/* 修改设计令牌请编辑 src/design/tokens.ts 后运行 npm run tokens:build。 */');
  push('');
  push(':root {');
  push('  color-scheme: light;');
  push('');
  push('  /* ---- Primitive colors ---- */');
  colorBlock(primitiveColors);
  push('');
  push('  /* ---- Semantic colors · light ---- */');
  colorBlock(lightColors);
  push('');
  push('  /* ---- Typography ---- */');
  push(`  --font-display: ${typography.fontDisplay};`);
  push(`  --font-body: ${typography.fontBody};`);
  push(`  --font-mono: ${typography.fontMono};`);
  for (const [key, value] of Object.entries(typography.size)) {
    push(`  --text-${key}: ${value};`);
  }
  declarations(typography.leading, '--leading-');
  declarations(typography.tracking, '--tracking-');
  declarations(typography.weight, '--font-weight-');
  push('');
  push('  /* ---- Spacing · 8pt scale ---- */');
  declarations(space, '--space-');
  push('');
  push('  /* ---- Radii ---- */');
  declarations(radii, '--radius-');
  push('');
  push('  /* ---- Shadows · light ---- */');
  declarations(lightShadows, '--shadow-');
  push('');
  push('  /* ---- Motion ---- */');
  declarations(motion.duration, '--duration-');
  declarations(motion.ease, '--ease-');
  push('');
  push('  /* ---- Layout ---- */');
  declarations(layout, '--');
  push('');
  push('  /* ---- Focus ---- */');
  push(`  --focus-width: ${focus.width};`);
  push(`  --focus-offset: ${focus.offset};`);
  push('');
  push('  /* ---- Z-index ---- */');
  declarations(zIndex, '--z-');
  push('');
  push('  /* ---- Print ---- */');
  for (const [key, value] of Object.entries(printColors)) {
    push(`  --color-print-${key}: ${value};`);
  }
  push('}');
  push('');

  const darkBlock = (indent = '  ') => {
    push(`${indent}/* ---- Semantic colors · dark ---- */`);
    colorBlock(darkColors, indent);
    push('');
    push(`${indent}/* ---- Shadows · dark ---- */`);
    declarations(darkShadows, '--shadow-', (v) => v, indent);
  };

  push("[data-theme='dark'] {");
  push('  color-scheme: dark;');
  darkBlock();
  push('}');
  push('');
  push('@media (prefers-color-scheme: dark) {');
  push('  /* 无 JavaScript 时仍尊重系统深色偏好；theme-init.js 会写入 data-theme。 */');
  push('  :root:not([data-theme]) {');
  push('    color-scheme: dark;');
  darkBlock('    ');
  push('  }');
  push('}');
  push('');

  return lines.join('\n');
};

const css = build();

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = await readFile(outputPath, 'utf8');
  } catch {
    console.error(`[tokens] 缺少生成文件：${outputPath}`);
    process.exit(1);
  }
  if (current !== css) {
    console.error(
      '[tokens] tokens.generated.css 与 tokens.ts 不一致，请运行 npm run tokens:build。',
    );
    process.exit(1);
  }
  console.log('[tokens] 生成文件与 tokens.ts 一致。');
} else {
  await writeFile(outputPath, css, 'utf8');
  console.log(
    `[tokens] 已生成 ${path.relative(root, outputPath)}（${css.split('\n').length} 行）。`,
  );
}
