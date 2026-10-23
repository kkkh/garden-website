# 05 · 运行与部署

## 1. 环境要求

| 项          | 要求                                        |
| ----------- | ------------------------------------------- |
| Node.js     | ≥ 22（`package.json` 的 `engines`）          |
| npm         | 随 Node 22 提供                              |
| 操作系统    | macOS / Linux（`sharp` 需对应平台二进制）    |
| 浏览器      | 现代浏览器；E2E 使用 Playwright Chromium     |
| 磁盘        | 依赖 + 构建产物 + 视觉基线，建议预留 ≥ 1 GB  |
| 网络        | 首次 `npm ci` 与 Playwright 浏览器下载需要   |

> `scripts/generate-tokens.mjs` 直接 `import '../src/design/tokens.ts'`，依赖 Node 22+ 的原生 TypeScript 支持。Node 版本过低会在生成令牌阶段失败。

---

## 2. 安装与本地开发

```bash
npm ci            # 严格按 package-lock.json 安装
npm run dev       # 生成令牌 → astro dev（默认 http://localhost:4321）
```

开发服务器会监听 `src/` 变化并热更新；`npm run dev` **只生成令牌，不生成图标**。若修改了 `src/assets/brand/app-icon.png`，需手动执行：

```bash
npm run icons:build
```

生产构建与预览：

```bash
npm run build     # tokens:build → icons:build → astro build → dist/
npm run preview   # 预览 dist/（默认端口 4321）
```

构建配置（[astro.config.mjs](../astro.config.mjs)）：

- `site: 'https://jl.43322.cn'`：canonical、sitemap、OG 绝对地址；
- `build.format: 'file'`：输出 `privacy.html` 等文件路径；
- `inlineStylesheets: 'auto'`：小型样式自动内联；
- `compressHTML: true`；
- `prefetch`: 默认 `hover`，不预取全部；
- `@astrojs/sitemap` 过滤 `/404`；
- Markdown 使用 `rehype-slug` + `rehype-autolink-headings`；
- `devToolbar` 关闭。

---

## 3. 脚本清单

| 命令                       | 实际执行                                                                 | 用途 / 时机                          |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| `npm run dev`              | `tokens:build` + `astro dev`                                             | 本地开发                             |
| `npm run build`            | `tokens:build` + `icons:build` + `astro build`                           | 生产构建                             |
| `npm run preview`          | `astro preview`                                                          | 预览 `dist/`                         |
| `npm run astro`            | `astro`                                                                  | 直接调用 Astro CLI                   |
| `npm run tokens:build`     | `node scripts/generate-tokens.mjs`                                       | 重新生成令牌 CSS                    |
| `npm run icons:build`      | `node scripts/generate-icons.mjs`                                        | 生成 favicon / PWA 图标 / OG 图     |
| `npm run check`            | `astro check`                                                            | 类型检查（同 `typecheck`）           |
| `npm run typecheck`        | `astro check`                                                            | 类型检查                             |
| `npm run lint`             | `eslint .`                                                               | 静态检查                             |
| `npm run lint:fix`         | `eslint . --fix`                                                         | 自动修复可修项                       |
| `npm run format`           | `prettier --write .`                                                     | 格式化                               |
| `npm run format:check`     | `prettier --check .`                                                     | 格式门禁                             |
| `npm test` / `test:unit`   | `vitest run`                                                             | 单元测试                             |
| `npm run test:e2e`         | `build` + `playwright test`                                              | 全量 E2E（含视觉）                   |
| `npm run test:a11y`        | `build` + `playwright test tests/e2e/a11y.spec.ts`                       | 只跑可访问性                         |
| `npm run test:visual`      | `build` + `playwright test tests/e2e/visual.spec.ts`                     | 只跑视觉回归                         |
| `npm run test:visual:update` | `build` + `playwright test tests/e2e/visual.spec.ts --update-snapshots` | 重建视觉基线                         |
| `npm run check:release`    | `node scripts/sync-root.mjs --check`                                     | 校验根产物与 `dist/` 一致            |
| `npm run check:tokens`     | `generate-tokens --check` + `check-tokens`                               | 令牌一致性与硬编码颜色扫描           |
| `npm run check:contrast`   | `node scripts/check-contrast.mjs`                                        | 33 项 WCAG 对比度                    |
| `npm run review:independent` | `node scripts/independent-review.mjs`                                  | 独立渲染巡检（需先 build + preview） |
| `npm run release`          | `build` + `sync-root` + `sync-root --check`                              | 发布前同步产物                       |
| `npm run verify`           | 见下节                                                                   | 一键完整门禁                         |
| `npm run audit`            | `npm audit --audit-level=high`                                           | 依赖漏洞扫描                         |

---

## 4. 质量门禁

`npm run verify` 按以下顺序执行，任一失败即中断：

```text
check:tokens → check:contrast → typecheck → lint → format:check
→ test:unit → build → check:release → playwright test
```

| 门禁                    | 判定内容                                                                 | 失败含义                                   |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| `check:tokens`          | 生成 CSS 与 `tokens.ts` 完全一致；`src/` 无颜色字面量                     | 手改生成物或组件硬编码颜色                 |
| `check:contrast`        | 33 项对比度：正文 ≥ 4.5、大文本/非文本 ≥ 3、装饰线豁免                    | 令牌调整导致可读性下降                     |
| `typecheck`             | Astro + TS strict（含 `noUncheckedIndexedAccess`）                        | 类型错误                                   |
| `lint`                  | ESLint：JS/TS/Astro、禁 `any`、`console` 仅允许 warn/error                | 代码规范问题                               |
| `format:check`          | Prettier（100 列、单引号、尾逗号）                                        | 未格式化                                   |
| `test:unit`             | 3 个文件 37 个用例                                                        | 轮播算法、主题、数据契约回归               |
| `build`                 | Astro 构建成功，4 个页面输出                                              | 组件/内容/图片管线错误                     |
| `check:release`         | 根目录产物与 `dist/` 体积、清单一致，无残留旧文件                        | 忘记同步产物                               |
| `playwright test`       | 结构、交互、a11y、响应式、减弱动效、视觉基线                              | 功能或像素回归                             |
| `review:independent`    | 独立实现的 A–K 巡检（不包含在 verify 内）                                 | 交叉验证失败，建议在发布前执行             |
| `audit`                 | high 及以上漏洞（CI 中 `continue-on-error`）                              | 依赖风险，需人工评估                       |

最近一次验收记录：37 个单元测试、100 个 Playwright 用例通过，`npm run verify` 退出码 0（详见 [docs/acceptance/verification-report.md](../docs/acceptance/verification-report.md)）。该记录是时点证据，不代表当前工作区一定已重新跑过。

---

## 5. 测试体系

### 5.1 单元测试（Vitest）

```bash
npm run test:unit
```

- 环境 `node`，入口 `tests/unit/**/*.test.ts`；
- 别名 `@` → `src`；
- 覆盖 `wrapIndex` / `formatIndex` / `isHorizontalSwipe`、主题读写与应用、数据契约与 schema；
- 覆盖率报告输出到 `reports/coverage`，范围为 `src/lib`、`src/scripts`、`src/data`。

### 5.2 E2E（Playwright）

```bash
npm run test:e2e        # 先 build，再跑全部项目
```

`playwright.config.ts` 的关键配置：

| 项           | 值                                                                  |
| ------------ | ------------------------------------------------------------------- |
| 测试目录     | `tests/e2e`                                                          |
| webServer    | `npm run preview -- --port 4321 --host 127.0.0.1`，复用本地已启动服务 |
| baseURL      | `http://127.0.0.1:4321`                                              |
| 报告         | `reports/playwright-html`、`reports/playwright-results.json`          |
| 视觉容差     | `maxDiffPixelRatio: 0.02`，禁用动画，隐藏光标                         |
| 失败证据     | trace 保留、失败截图；不录视频                                       |

项目划分：

| 项目             | 设备 / 主题                          | 运行的测试                              |
| ---------------- | ------------------------------------ | --------------------------------------- |
| `desktop-light`  | Desktop Chrome，light                | 全部                                    |
| `desktop-dark`   | Desktop Chrome，dark                 | `visual` / `theme` 匹配的测试            |
| `tablet-light`   | iPad (gen 7) 视口，Chromium          | `visual`                                |
| `mobile-light`   | iPhone 13 视口，Chromium             | `visual` / `mobile`                     |
| `reduced-motion` | Desktop Chrome，`reducedMotion: reduce` | `reduced-motion`                     |

### 5.3 视觉基线

首次运行或有意改版后：

```bash
npm run test:visual:update
```

- 基线位于 `tests/e2e/visual.spec.ts-snapshots/`，文件名含项目、主题与平台后缀（如 `home-hero-desktop-dark-darwin.png`）；
- 共 12 个视觉用例，产生 16 组快照名 × 4 个项目 = 64 张 PNG；
- **只在 macOS 生成/更新**，CI 的视觉任务固定在 `macos-latest`，避免跨平台字体渲染差异；
- 更新基线后必须人工查看差异图，确认是预期变化。

### 5.4 独立巡检

```bash
npm run build
npx astro preview --port 4321    # 另开终端
npm run review:independent
```

不复用 E2E 代码，独立检查首页结构、轮播、灯箱、主题、导航、法律页、404、资源、移动端、axe 与第三方请求；输出 `docs/acceptance/independent-review.json` / `.md` 与截图。

---

## 6. 发布流程

当前策略是**推送即上线**，且产物同时存在于 `dist/` 与仓库根目录。

```bash
# 1. 完整门禁（含 check:release 与 Playwright）
npm run verify

# 2. 构建 + 同步根目录 + 校验一致性
npm run release

# 3. 提交源码与同步产物
git add -A
git commit -m "release: v2 <说明>"

# 4. 推送 main，触发平台更新
git push origin main
```

`npm run release` 等价于：

```text
npm run build
node scripts/sync-root.mjs
node scripts/sync-root.mjs --check
```

发布产物（共 371 个文件，随内容变化）：

```text
index.html  privacy.html  agreement.html  404.html
_astro/                 # 哈希命名的 CSS/JS/AVIF/WebP/图片
icons/                  # favicon、Apple Touch Icon、192/512
og/og-default.png       # 1200×630 分享图
beian/beian.png
.well-known/apple-app-site-association
robots.txt  site.webmanifest  sitemap-index.xml  sitemap-0.xml
.release-manifest.json  # 同步清单
```

### 为什么同步到仓库根

平台输出目录无法从代码侧确认，因此双兼容：

| 平台配置                   | 实际服务内容             | 结果 |
| -------------------------- | ------------------------ | ---- |
| 纯静态，服务仓库根         | 根目录同步产物           | 正常 |
| 构建型，输出 `dist`        | 平台构建产物             | 正常 |
| 构建型，输出根目录         | 平台构建产物（同位置）   | 正常 |
| 构建型但构建失败           | 根目录同步产物兜底       | 正常 |

决策见 [ADR-0011](../docs/adr/0011-release-sync.md)（修订 [ADR-0007](../docs/adr/0007-deployment.md)）。

---

## 7. 线上部署与验证

| 项       | 值                                                                 |
| -------- | ------------------------------------------------------------------ |
| 域名     | `https://jl.43322.cn`                                               |
| 仓库     | `https://github.com/kkkh/garden-website`                            |
| 分支     | `main`                                                              |
| 托管     | 腾讯云 EdgeOne Makers（静态）                                       |
| 发布方式 | 推送 `main` 即更新                                                  |

发布后逐项验证：

```bash
BASE=https://jl.43322.cn

# 7.1 页面状态码
for p in / /privacy.html /agreement.html; do
  printf "%-16s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE$p"
done

# 7.2 确认线上是 v2
curl -s "$BASE" | grep -c 'data-carousel'                # 期望 2
curl -s "$BASE" | grep -o 'application/ld+json' | wc -l   # 期望 3
curl -s "$BASE" | grep -c 'site.webmanifest'              # 期望 1

# 7.3 新增资源
for p in /site.webmanifest /robots.txt /sitemap-index.xml /og/og-default.png /icons/icon-192.png /.well-known/apple-app-site-association; do
  printf "%-44s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE$p"
done

# 7.4 未知路径应返回品牌化 404
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/not-exist-page"

# 7.5 缓存与响应头
curl -sI "$BASE" | grep -iE 'cache-control|server'
```

浏览器人工确认：

- [ ] 首屏为 v2 版式（墨蓝 + 鎏金 + 设备框），无主题闪烁；
- [ ] 22 张截图可切换，缩略图与灯箱正常；
- [ ] 深/浅主题切换后刷新保持；
- [ ] 移动端抽屉导航可用，无横向滚动；
- [ ] 页脚两个备案链接可打开；
- [ ] 首页出现「常见问题」区块。

---

## 8. 缓存建议

| 路径                                           | 建议响应头                                      |
| ---------------------------------------------- | ----------------------------------------------- |
| `/_astro/*`                                    | `Cache-Control: public, max-age=31536000, immutable` |
| `/icons/*`、`/og/*`、`/beian/*`                 | `Cache-Control: public, max-age=86400`          |
| `/*.html`                                      | `Cache-Control: public, max-age=300, must-revalidate` |
| `/site.webmanifest`、`/robots.txt`、`/sitemap*.xml` | `Cache-Control: public, max-age=3600`       |

v2 不再使用 `?v=` 手工版本号：CSS/JS/图片文件名带内容哈希，HTML 短缓存即可保证更新及时。

---

## 9. 故障排查

| 现象                     | 可能原因                                   | 处理                                                                 |
| ------------------------ | ------------------------------------------ | -------------------------------------------------------------------- |
| 推送后线上仍是旧版       | 平台未监听 `main` / 部署未触发 / CDN 缓存  | 查看平台部署记录；`curl -sI` 检查 `Cache-Control` 与 `Last-Modified`；刷新缓存 |
| 线上 404                 | 根目录产物缺失或未同步                     | 本地 `npm run release` 后提交并重新推送                               |
| 页面无样式               | `_astro/` 未上传或被错误缓存               | 检查 `/_astro/*.css` 是否 200                                          |
| 部分图片 404             | 产物未完整同步                             | `node scripts/sync-root.mjs --check` 定位缺失文件                      |
| 根产物过期               | 改了源码但未执行 `release`                 | `npm run release` 并提交；CI 的 `check:release` 也会拦截               |
| 首屏闪浅色               | 内联主题脚本未执行或被移除                 | 检查 `BaseLayout` 的 `is:inline` 注入与 CSP                           |
| 轮播不工作               | DOM 契约缺失 / 脚本加载失败                | 看控制台 `[garden] 轮播初始化失败`；核对 `data-carousel-*`              |
| 视觉回归大面积失败       | 字体/浏览器版本变化、非 macOS 更新了基线   | 在 macOS 重新 `test:visual:update`，人工审查差异                       |
| `check:release` 失败     | 根产物与 `dist/` 不一致                    | 重新 `release`；确认没有手改根目录 HTML                                |
| `check:tokens` 失败      | 手改生成 CSS 或组件写了颜色字面量          | 改 `tokens.ts` 后 `tokens:build`；或改用 `var(--color-...)`            |
| `npm run dev` 启动失败   | Node < 22 / 依赖未按 lockfile 安装          | 升级 Node；`npm ci` 重装                                               |

---

## 10. 回滚

- **代码回滚**：`git revert` 最近的发布提交，重新 `npm run release` 并推送；根目录产物随提交一起回滚。
- **产物回滚**：从上一个发布提交检出根目录产物与 `dist/`，确认 `check:release` 通过后推送。
- **平台缓存**：若回滚后仍显示新版本，刷新 EdgeOne 缓存。
- 详细步骤与演练记录见 [docs/operations/rollback.md](../docs/operations/rollback.md)。

已知限制、未覆盖项与残余风险见 [docs/operations/known-issues.md](../docs/operations/known-issues.md)。
