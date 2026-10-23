/**
 * 一次性压缩 source 图片（不改变视觉）。
 *
 * - 架构图 PNG → 无损 WebP（逐像素比对，必须完全一致）；
 * - 截图 JPG → mozjpeg 重编码，PSNR ≥ 45dB 且体积更小才替换；
 * - 不进入 build，执行后由人工确认并提交产物。
 *
 * 用法：node scripts/optimize-assets.mjs
 */
import { readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const architectureDir = path.join(root, 'src/assets/architecture');
const screenshotDir = path.join(root, 'src/assets/screenshots');

const PSNR_THRESHOLD = 45;

function psnr(a, b) {
  let sum = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  const mse = sum / length;
  if (mse === 0) return Infinity;
  return 10 * Math.log10((255 * 255) / mse);
}

async function raw(file) {
  return sharp(file).raw().toBuffer({ resolveWithObject: true });
}

async function optimizeArchitecture() {
  const files = (await readdir(architectureDir)).filter((name) => name.endsWith('.png'));
  let saved = 0;

  for (const name of files) {
    const source = path.join(architectureDir, name);
    const before = await stat(source);
    const target = path.join(architectureDir, name.replace(/\.png$/, '.webp'));
    await sharp(source).webp({ lossless: true, effort: 6 }).toFile(target);
    const after = await stat(target);

    const [a, b] = await Promise.all([raw(source), raw(target)]);
    const identical = a.data.length === b.data.length && Buffer.compare(a.data, b.data) === 0;

    if (!identical || after.size >= before.size) {
      await rm(target, { force: true });
      console.log(`[assets] 跳过 ${name}（像素不一致或体积未下降）`);
      continue;
    }

    await rm(source);
    saved += before.size - after.size;
    console.log(
      `[assets] ${name} → ${path.basename(target)} ${(before.size / 1024).toFixed(0)}KB → ${(
        after.size / 1024
      ).toFixed(0)}KB（像素一致）`,
    );
  }
  return saved;
}

async function optimizeScreenshots() {
  const files = (await readdir(screenshotDir)).filter((name) => /\.(jpe?g)$/i.test(name));
  let saved = 0;

  for (const name of files) {
    const source = path.join(screenshotDir, name);
    const before = await stat(source);
    const original = await readFile(source);
    const optimized = await sharp(original)
      .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toBuffer();

    if (optimized.length >= before.size * 0.95) {
      console.log(`[assets] 跳过 ${name}（体积下降不足 5%）`);
      continue;
    }

    const tmp = path.join(screenshotDir, `${name}.tmp`);
    await writeFile(tmp, optimized);

    const [a, b] = await Promise.all([raw(source), raw(tmp)]);
    const quality = psnr(a.data, b.data);

    if (quality < PSNR_THRESHOLD) {
      await rm(tmp, { force: true });
      console.log(`[assets] 跳过 ${name}（PSNR ${quality.toFixed(1)}dB < ${PSNR_THRESHOLD}）`);
      continue;
    }

    await rename(tmp, source);
    saved += before.size - optimized.length;
    console.log(
      `[assets] ${name} ${(before.size / 1024).toFixed(0)}KB → ${(optimized.length / 1024).toFixed(
        0,
      )}KB（PSNR ${quality.toFixed(1)}dB）`,
    );
  }
  return saved;
}

const archSaved = await optimizeArchitecture();
const shotSaved = await optimizeScreenshots();
console.log(
  `[assets] 合计减少 ${((archSaved + shotSaved) / 1024 / 1024).toFixed(2)} MB；架构图 import 需手动改为 .webp`,
);
