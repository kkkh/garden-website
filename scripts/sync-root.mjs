#!/usr/bin/env node
/**
 * 发布产物同步：把 `dist/` 的内容同步到仓库根目录。
 *
 * 为什么需要这一步（见 docs/adr/0007-deployment.md）：
 * - v1 时代线上直接服务仓库根目录；v2 使用 Astro，产物在 `dist/`。
 * - 托管平台的「输出目录」配置无法从代码侧确认，因此同时满足两种情况：
 *     · 平台为「构建型」（执行 build + 指定 dist）→ 使用平台构建产物；
 *     · 平台为「纯静态根目录」→ 直接服务仓库根，即为本次同步的产物。
 * - 从而保证「推送即上线」在任何一种配置下都不会出现 404。
 *
 * 用法：
 *   node scripts/sync-root.mjs            # 同步（幂等）
 *   node scripts/sync-root.mjs --check    # 仅校验根目录与 dist 是否一致
 *
 * 同步清单记录在 `.release-manifest.json`，用于在下次同步时清理已不存在的旧产物。
 */
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const manifestPath = path.join(root, '.release-manifest.json');

/** 需要同步的顶层条目；这些名字与源码目录不存在冲突。 */
const SYNC_TARGETS = [
  'index.html',
  '404.html',
  'privacy.html',
  'agreement.html',
  'changelog.html',
  'robots.txt',
  'site.webmanifest',
  'sitemap-index.xml',
  'sitemap-0.xml',
  '_astro',
  'icons',
  'og',
  'beian',
  '.well-known',
];

const check = process.argv.includes('--check');

/** 递归列出 dist 下所有文件（相对路径） */
async function listFiles(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(full, base)));
    } else if (entry.isFile()) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

if (!existsSync(distDir)) {
  console.error('[release] 找不到 dist/，请先执行 npm run build。');
  process.exit(1);
}

const missingTargets = [];
for (const target of SYNC_TARGETS) {
  if (!existsSync(path.join(distDir, target))) missingTargets.push(target);
}
if (missingTargets.length > 0) {
  console.error(`[release] dist/ 缺少预期条目：${missingTargets.join(', ')}`);
  process.exit(1);
}

const nextFiles = new Set();
for (const target of SYNC_TARGETS) {
  const source = path.join(distDir, target);
  const info = await stat(source);
  if (info.isDirectory()) {
    for (const relative of await listFiles(source)) {
      nextFiles.add(path.join(target, relative));
    }
  } else {
    nextFiles.add(target);
  }
}

/** 读取上一次同步的清单；文件不存在或损坏时返回空数组（首次同步）。 */
async function readManifest() {
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    return Array.isArray(manifest.files) ? manifest.files : [];
  } catch {
    return [];
  }
}

const previousFiles = await readManifest();

// ── 校验模式 ──────────────────────────────────────────────────────────────
if (check) {
  const problems = [];

  for (const relative of nextFiles) {
    const target = path.join(root, relative);
    const source = path.join(distDir, relative);
    if (!existsSync(target)) {
      problems.push(`缺失：${relative}`);
      continue;
    }
    const [sourceInfo, targetInfo] = await Promise.all([stat(source), stat(target)]);
    if (sourceInfo.size !== targetInfo.size) {
      problems.push(`体积不一致：${relative}（dist ${sourceInfo.size} / 根 ${targetInfo.size}）`);
    }
  }

  const stale = previousFiles.filter((relative) => !nextFiles.has(relative));
  for (const relative of stale) {
    if (existsSync(path.join(root, relative))) problems.push(`残留旧产物：${relative}`);
  }

  const manifestMatches =
    previousFiles.length === nextFiles.size &&
    previousFiles.every((relative) => nextFiles.has(relative));
  if (!manifestMatches) problems.push('清单与 dist 不一致（.release-manifest.json 过期）');

  if (problems.length > 0) {
    console.error(`[release] 根目录产物与 dist 不一致（${problems.length} 项）：`);
    for (const problem of problems.slice(0, 15)) console.error(`  ✗ ${problem}`);
    if (problems.length > 15) console.error(`  … 其余 ${problems.length - 15} 项省略`);
    console.error('\n请运行 npm run release 重新同步并提交。');
    process.exit(1);
  }

  console.log(`[release] 根目录产物与 dist 一致（${nextFiles.size} 个文件）。`);
  process.exit(0);
}

// ── 同步模式 ──────────────────────────────────────────────────────────────
let copied = 0;
for (const relative of nextFiles) {
  const source = path.join(distDir, relative);
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  copied += 1;
}

let removed = 0;
for (const relative of previousFiles) {
  if (nextFiles.has(relative)) continue;
  const target = path.join(root, relative);
  if (!existsSync(target)) continue;
  await rm(target, { force: true });
  removed += 1;
}

await writeFile(
  manifestPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), count: nextFiles.size, files: [...nextFiles].sort() }, null, 2)}\n`,
  'utf8',
);

console.log(`[release] 已同步 ${copied} 个产物到仓库根目录，清理 ${removed} 个旧产物。`);
console.log('[release] 提交后即可推送；平台无论配置为「根目录」还是「dist」，站点均可正常服务。');
