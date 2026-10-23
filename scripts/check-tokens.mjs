#!/usr/bin/env node
/**
 * 设计令牌门禁：禁止在令牌文件之外硬编码颜色。
 *
 * 允许：
 * - src/design/tokens.ts（设计令牌唯一事实源）
 * - src/styles/tokens.generated.css（生成产物）
 *
 * 检查范围：src 下的 .css / .astro / .ts / .tsx / .js
 * 禁止：十六进制颜色、rgb()/rgba()、hsl()/hsla()。
 *
 * 说明：SVG 路径中的 `#` 后按 3–8 位十六进制字符匹配，不会误伤普通锚点。
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');
const allowed = new Set([
  path.join(srcDir, 'design/tokens.ts'),
  path.join(srcDir, 'styles/tokens.generated.css'),
]);
const extensions = new Set(['.css', '.astro', '.ts', '.tsx', '.js', '.mjs']);
const patterns = [
  { name: 'hex', re: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'rgb', re: /\brgba?\s*\(/g },
  { name: 'hsl', re: /\bhsla?\s*\(/g },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      files.push(...(await walk(full)));
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];

for (const file of await walk(srcDir)) {
  if (allowed.has(file)) continue;
  const content = await readFile(file, 'utf8');
  const lines = content.split('\n');

  for (const [index, line] of lines.entries()) {
    // 允许注释中记录“旧值 → 新值”的说明；只检查代码行。
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;

    for (const pattern of patterns) {
      pattern.re.lastIndex = 0;
      const match = pattern.re.exec(line);
      if (!match) continue;
      violations.push({
        file: path.relative(root, file),
        line: index + 1,
        kind: pattern.name,
        value: match[0],
        text: line.trim(),
      });
    }
  }
}

if (violations.length === 0) {
  console.log('[tokens] 未发现令牌文件之外的硬编码颜色。');
  process.exit(0);
}

console.error(`[tokens] 发现 ${violations.length} 处硬编码颜色：\n`);
for (const violation of violations) {
  console.error(
    `  ${violation.file}:${violation.line} [${violation.kind}] ${violation.value}\n    ${violation.text}`,
  );
}
console.error('\n请改用 var(--color-...) 语义令牌；新增颜色请先写入 src/design/tokens.ts。');
process.exit(1);
