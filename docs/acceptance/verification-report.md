# 验收报告

- 验收对象：`main`，发布 commit `78b9fcd`（v2 Astro + 截图零裁切 + 点击反馈与灯箱交互增强）
- 验收时间：2026-10-23（本地门禁 + 生产发布后验证）
- 验收执行者：实施方（自动化门禁）；独立复核见第 5 节
- 结论口径：**在下列证据与已知缺陷下达到验收标准**（不使用「完美 / 零缺陷 / 极致」等表述）

---

## 1. 门禁总览

命令：`npm run verify`（等价于下表顺序执行）

| #   | 门禁命令                       | 结果 | 关键输出                                                                                     | 日志                                               |
| --- | ------------------------------ | ---- | -------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | `npm run check:tokens`         | ✅   | 生成文件与 `tokens.ts` 一致；未发现令牌文件之外的硬编码颜色                                  | `docs/acceptance/logs/verify.txt`                  |
| 2   | `npm run check:contrast`       | ✅   | 检查 33 项，未通过 0 项                                                                      | `docs/design-system/contrast-report.md`            |
| 3   | `npm run typecheck`            | ✅   | Result (55 files): 0 errors / 0 warnings / 0 hints                                           | 同上日志                                           |
| 4   | `npm run lint`                 | ✅   | 无输出（0 problems）                                                                         | 同上日志                                           |
| 5   | `npm run format:check`         | ✅   | All matched files use Prettier code style                                                    | 同上日志                                           |
| 6   | `npm run test:unit`            | ✅   | Test Files 3 passed；Tests 38 passed                                                         | 同上日志                                           |
| 7   | `npm run build`                | ✅   | 4 page(s) built；`[build] Complete!`                                                         | 同上日志                                           |
| 8   | `npx playwright test`          | ✅   | **105 passed**                                                                               | `docs/acceptance/logs/playwright-results.json`     |
| 9   | `npm audit --audit-level=high` | ✅   | found 0 vulnerabilities                                                                      | 见第 4 节                                          |
| 10  | 生产部署与线上验证             | ✅   | 推送 `main` 后线上切换 v2；4 页 200、资源 200、未知路径 404、`index.html` 与根产物逐字节一致 | `docs/acceptance/logs/deployment-verification.txt` |

`npm run verify` 退出码：**0**（日志：`docs/acceptance/logs/verify.txt`）。

---

## 2. 测试明细

### 2.1 单元测试（Vitest，38 项）

| 文件                          | 用例数 | 覆盖内容                                                                                                                                                |
| ----------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/carousel.test.ts` |     12 | 环形索引归一化（越界、负数、NaN、小数）、序号补零、滑动判定阈值与纵横比                                                                                 |
| `tests/unit/theme.test.ts`    |      9 | 偏好合法性、系统偏好解析、`data-theme`/`color-scheme`/meta 主题色写入、存储禁用时的降级                                                                 |
| `tests/unit/data.test.ts`     |     17 | 导航与法律导航契约、备案与联系方式格式、截图数量与设备标注/分辨率、架构图数量、首页数据结构、结构化数据（WebSite/MobileApplication/FAQPage/Breadcrumb） |

### 2.2 端到端测试（Playwright，105 项，5 个项目）

| 项目             | 设备/条件                       | 用例                                                                                                              |
| ---------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `desktop-light`  | Desktop Chrome 1280×720，浅色   | 结构、SEO、结构化数据、导航、轮播全交互、灯箱、主题、FAQ、法律页、外链安全、404、a11y、响应式、视觉基线、组件状态 |
| `desktop-dark`   | Desktop Chrome，深色            | 视觉基线（深色）                                                                                                  |
| `tablet-light`   | iPad (gen 7) 视口，Chromium     | 视觉基线                                                                                                          |
| `mobile-light`   | iPhone 13 视口 + 触控，Chromium | 移动端响应式与视觉基线                                                                                            |
| `reduced-motion` | `reducedMotion: reduce`         | 减弱动效降级（4 项）                                                                                              |

关键断言（节选）：

- 首屏 `html[data-theme]` 在 `waitUntil: 'commit'` 时已写入 → 无主题闪烁；
- 轮播：初始 `01 / 22`、箭头环形、缩略图 `aria-current` + roving tabindex、方向键/Home/End、横向滑动生效且纵向不生效、快速连续操作不崩；
- 灯箱：打开/切换/Esc 关闭、焦点回归触发元素、滚动锁定与恢复；
- 功能卡「查看消息中心」直达第 17 张；
- 页面加载阶段**零第三方域名请求**；
- 备案外链均带 `rel="noopener noreferrer"` 与 `target="_blank"`；
- 未知路径返回 404 且页面为品牌化 404、带 `noindex`。

### 2.3 可访问性（axe-core）

- 4 个页面（首页 / 隐私 / 协议 / 404）× 浅色，加首页深色，共 5 次扫描；
- 判定：`wcag2a`、`wcag2aa`、`wcag21a`、`wcag21aa`、`best-practice` 标签下 **serious / critical 级违规 = 0**；
- 豁免规则：仅 `region`（理由见 ADR-0008）；
- 触控目标尺寸抽样：头部按钮、主题切换、箭头、缩略图、回到顶部均 ≥ 40×40（多数 44×44）；
- 正文对比度抽样（8 处计算样式）≥ 4.5:1。

### 2.4 视觉回归

- 基线数量：**64 张 PNG**（4 项目 × 16 场景，含桌面浅色 / 桌面深色 / 平板 / 手机），位于 `tests/e2e/visual.spec.ts-snapshots/`；
- 覆盖：首页首屏/全页、轮播舞台与切换后状态、隐私页、404、按钮 default/hover/focus、卡片 default/hover、主题切换控件、灯箱打开、深色首页、深色法律页；
- 判定：`maxDiffPixelRatio: 0.02`，动画禁用；
- CI 拆分：视觉用例带 `@visual` 标记，仅在 macOS runner 执行（基线含 `-darwin` 平台后缀），其他任务用 `--grep-invert=@visual` 跳过。

### 2.5 before / after 证据

| 证据              | 路径                                                                        |
| ----------------- | --------------------------------------------------------------------------- |
| v1 线上（before） | `docs/acceptance/baseline/before-v1/`（桌面 + 手机 × 首页首屏/全页/隐私页） |
| v2 本地（after）  | `docs/acceptance/baseline/after-v2/`（同视口同场景）                        |
| 采集脚本          | `scripts/capture-baseline.mjs`                                              |

---

## 3. 构建与资源

| 指标                        | 数值                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 生成页面                    | 4（`index.html`、`privacy.html`、`agreement.html`、`404.html`）                                                                                  |
| 额外产物                    | `site.webmanifest`、`robots.txt`、`sitemap-index.xml`、`sitemap-0.xml`、`icons/*`、`og/og-default.png`、`.well-known/apple-app-site-association` |
| `dist/` 体积                | 约 30 MB（含 22 张截图与 10 张架构图的多格式多尺寸派生）                                                                                         |
| HTML 体积                   | 首页 119 KB；404 14 KB；协议 20 KB；隐私 22 KB                                                                                                   |
| 图片格式                    | AVIF + WebP + 原格式回退，多尺寸 `srcset`                                                                                                        |
| 首屏资源                    | 首张截图 `fetchpriority="high"`；其余 `loading="lazy"`                                                                                           |
| 路由验证（`astro preview`） | `/`、`/privacy.html`、`/agreement.html` → 200；未知路径 → 404；manifest/robots/sitemap/og/icons/AASA → 200                                       |

---

## 4. 依赖与安全

| 项               | 结果                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| 依赖总数         | 6 个运行时依赖 + 16 个开发依赖（全部 `--save-exact` 锁定确切版本）                                 |
| 锁文件           | `package-lock.json` 入库                                                                           |
| 漏洞扫描         | `npm audit --registry=https://registry.npmjs.org --audit-level=high` → **found 0 vulnerabilities** |
| 客户端第三方脚本 | 0（无 CDN、无统计、无字体 CDN）                                                                    |
| 数据上传         | 0（无 Cookie、无请求携带用户数据；主题偏好仅本地 `localStorage`）                                  |
| 外链安全         | 所有 `_blank` 外链带 `rel="noopener noreferrer"`（E2E 断言）                                       |
| XSS 面           | 无用户输入、无服务端渲染的用户内容；`innerHTML` 未在最终实现中使用                                 |

注：`npm audit` 在镜像 registry（`registry.npmmirror.com`）上返回 `NOT_IMPLEMENTED`，因此改用官方 registry 复核，结论有效。

---

## 5. 独立复核（实施与验收分离）

本项目的「独立」含义与边界：

| 环节             | 执行者                                                                    | 方式                                                                 | 结论                                                                 |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 自动化门禁       | 实施方                                                                    | `npm run verify`                                                     | 全部通过（第 1 节）                                                  |
| 独立渲染巡检     | 独立实现路径（`scripts/independent-review.mjs`，不复用 `tests/e2e` 代码） | 真实浏览器访问构建产物，19 项结构/交互/资源/网络检查 + 5 次 axe 扫描 | **19/19 通过**（`docs/acceptance/independent-review.md`）            |
| 浏览器子代理复核 | 独立子代理                                                                | 尝试执行 14 项渲染验收                                               | 该子代理未真正执行浏览器操作，**不能作为有效独立证据**，不计入通过项 |
| 人工验收         | 项目负责人（用户）                                                        | 真机/浏览器操作、读屏朗读                                            | **待执行**                                                           |

> 明确声明：上述「独立渲染巡检脚本」虽与 E2E 测试分离实现，但仍由同一实施会话编写，
> **不等同于第三方机构审计或真人用户测试**；它用于交叉验证，不替代屏幕阅读器朗读验证、
> 真机跨浏览器验证与业务合规审查（详见 `docs/acceptance/assumptions.md` AS-06 与
> `docs/operations/known-issues.md` P1）。在人工验收完成前，本报告不宣称「已通过独立验收」。

### 5.1 独立渲染巡检结果

产物：`docs/acceptance/independent-review.md`、`docs/acceptance/independent-review.json`、截图目录 `docs/acceptance/independent-review/`。

| 分组          | 检查项                                                                | 结果 |
| ------------- | --------------------------------------------------------------------- | :--: |
| A 首页结构    | 地标唯一、跳转链接、`lang`、7 个区块、SEO 元信息与 3 类结构化数据     |  ✅  |
| A 首屏        | 设备框完整、未横向溢出视口（1440 视口下 box 宽 288px，右边界 1080）   |  ✅  |
| B 轮播        | 初始 `01 / 22`、箭头序列 `02>03>04>03`、缩略图第 8 项联动、方向键切换 |  ✅  |
| C 灯箱        | 打开（`09 / 22`）、下一张（`10 / 22`）、Esc 关闭、滚动锁定/恢复       |  ✅  |
| D 主题        | 深色切换、`localStorage` 持久化、刷新保持、meta theme-color 同步      |  ✅  |
| E 导航/FAQ    | 锚点跳转、6 条 FAQ、第二项展开、首项默认展开                          |  ✅  |
| F 法律页      | 隐私 9 章目录与锚点、协议 7 章、日期显示                              |  ✅  |
| G 404         | 状态码 404、品牌化页面、`noindex`、返回入口                           |  ✅  |
| H 资源        | manifest / robots / sitemap / OG / 图标 / 备案图 / AASA 全部 200      |  ✅  |
| I 移动端      | 无横向溢出、抽屉 8 项、点击关闭并跳转、缩略图可横滑                   |  ✅  |
| J 可访问性    | 5 次 axe 扫描（含深色）无 serious/critical                            |  ✅  |
| K 隐私/运行时 | 0 第三方请求、0 控制台错误、0 未捕获异常                              |  ✅  |

**巡检期间发现并修复的问题**：`#intro` 区块缺少 `id`，导致结构巡检报告「缺失 intro」；已补 id 并重新构建复验。
这说明独立巡检并非形式化通过，而是实际发现了 v1 遗留/新引入的结构缺口。

### 5.2 仍需人工完成的验收

1. 真机（iPhone Safari / iPad / Android Chrome）走查首屏、轮播、灯箱、主题与移动导航；
2. VoiceOver 完整朗读首页与法律页，检查读屏顺序与说明更新；
3. 打印法律页为 PDF，检查分页与标题断裂。

> EdgeOne Makers 发布已于 2026-10-23 通过 `git push origin main` 完成，发布后验证见第 8 节与
> `docs/acceptance/logs/deployment-verification.txt`；不再需要手动修改平台输出目录。

---

## 6. 覆盖矩阵结论

逐项结论见 `docs/acceptance/coverage-matrix.md`：13 项中 **11 项完成**、**2 项部分完成**（测试跨浏览器、SEO 与埋点的服务端聚合），
未完成项与理由均在该文件中逐条列明。

---

## 7. 剩余人工验收（不阻塞线上运行）

1. 真机走查（iPhone Safari + 桌面 Safari/Chrome）；
2. 用 VoiceOver 做一次完整朗读走查；
3. 打印法律页为 PDF 并复核分页；
4. 本报告在人工验收完成后追加「人工验收记录」章节。

---

## 8. 生产发布记录（2026-10-23）

| 项             | 值                                                                                    |
| -------------- | ------------------------------------------------------------------------------------- |
| 发布提交       | `033f444`（`main`，同时推送 `refactor/v2-astro` 留档）                                |
| 发布方式       | `git push origin main`，EdgeOne Makers 自动更新                                       |
| 生效时间       | 推送后轮询 23 次（5s 间隔）观察到 v1 → v2，约 110 秒                                  |
| 线上首页       | 119 KB v2 页面，`data-carousel`、3 段 JSON-LD、manifest 均存在                        |
| 页面状态       | `/`、`/privacy.html`、`/agreement.html`、`/404.html` 均 200；未知路径 404 + `noindex` |
| 资源状态       | manifest、robots、sitemap、OG、图标、备案图、AASA、CSS 全部 200                       |
| 产物一致性     | 线上 `index.html` 与仓库根发布产物 `cmp` 逐字节一致                                   |
| 线上浏览器烟测 | Playwright 桌面 + 移动 21 项断言全部通过，0 控制台错误、0 第三方请求                  |
| 证据           | `docs/acceptance/logs/deployment-verification.txt`                                    |

发布后结论：**在本地门禁、独立巡检与线上验证证据下达到发布验收标准**；仍保留第 5.2 节的
真机、VoiceOver 与打印人工验收项，以及 `docs/operations/known-issues.md` 中的 P1/P2 残余项。

### 8.1 CI Node 版本修复（2026-10-23）

首次推送 `main` 后 GitHub Actions 在 `typecheck` 阶段失败：`setup-node` 的 `node-version: '22'`
解析为 `22.23.3`，而 Astro 7.4.2 要求 `>=22.23.4`。本地 Node 24.19.0 不受影响。

处置：

- `package.json` 的 `engines.node` 从 `>=22.0.0` 调整为 `>=24.0.0`，并同步 `package-lock.json`；
- `.github/workflows/ci.yml` 的两个 job 均固定 `node-version: '24'`；
- README、Code Wiki、ADR 与已知问题中的 Node 版本说明同步为 24；
- 调整后本地 `npm run verify` 再次通过（37 单测、100 E2E、发布一致性），等待新 CI 运行复核。

### 8.2 CI 复核结果（2026-10-23）

| 运行                                                                           | 分支                | 结果       | 说明                                                        |
| ------------------------------------------------------------------------------ | ------------------- | ---------- | ----------------------------------------------------------- |
| [39929163165](https://github.com/kkkh/garden-website/actions/runs/39929163165) | `main`              | ✅ success | 「门禁与测试」与「视觉回归（macOS 基线）」两个 job 全部通过 |
| [39929147604](https://github.com/kkkh/garden-website/actions/runs/39929147604) | `refactor/v2-astro` | ✅ success | 同一提交的双分支复核，全部通过                              |

此前 `beeb015` 的运行在 `typecheck` 阶段失败（Node 22.23.3 < Astro 要求的 22.23.4）；
固定 Node 24 后，上述两次运行均成功，CI 缺陷闭环。

### 8.3 设备框改版发布（2026-10-23）

| 项             | 值                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| 发布提交       | `423fb63`（`main`）                                                                                  |
| 变更           | 新增 `DeviceFrame.astro`；截图展示区改为 iPhone 13 Pro Max 苍岭绿；新增 alpine/device 令牌与机型标注 |
| 生效观察       | 推送后轮询 18 次（5s 间隔）切到新版，约 85 秒                                                        |
| 设备判据       | 线上 HTML 含 `data-device-model="iphone-13-pro-max"` 与 `data-device-finish="alpine-green"`          |
| 页面与资源     | 4 个页面 200；未知路径 404；manifest/sitemap/OG/图标/备案图/AASA/CSS 全部 200                        |
| 产物一致性     | 线上 `index.html` 与仓库根产物 `cmp` 逐字节一致                                                      |
| 线上浏览器烟测 | Playwright 桌面 + 移动 25 项断言全部通过；0 控制台错误、0 未捕获异常、0 第三方请求                   |
| 视觉证据       | `docs/acceptance/baseline/v2-device/`（桌面 Hero、桌面轮播、移动轮播）                               |
| 证据           | `docs/acceptance/logs/deployment-verification.txt`                                                   |

### 8.4 全方位动效升级发布（2026-10-23）

| 项             | 值                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| 发布提交       | `34710dd`（`main`）                                                                                      |
| 变更           | Hero 首屏编排、指针微倾斜、滚动显现缩放、轮播方向感知、灯箱/抽屉入场、导航下划线、阅读进度线、图标微动   |
| 生效观察       | 推送后轮询 21 次（5s 间隔）切到新版，约 105 秒                                                           |
| 动效判据       | `data-scroll-progress` 存在；阅读进度线 `scaleX` 随滚动变化；轮播 `data-position` 为 before/active/after |
| 页面与资源     | 4 个页面 200；未知路径 404；全部静态资源 200                                                             |
| 产物一致性     | 线上 `index.html` 与仓库根产物 `cmp` 逐字节一致                                                          |
| 线上浏览器烟测 | Playwright 桌面 + 移动 + 减弱动效 28/28 通过；0 控制台错误、0 未捕获异常、0 第三方请求                   |
| 视觉证据       | `docs/acceptance/baseline/v2-polish/`                                                                    |
| 视觉稳定性     | 首屏/全页用例强制显现终态并等待编排完成，双分支 CI 复跑全绿                                              |
| 证据           | `docs/acceptance/logs/deployment-verification.txt`                                                       |

### 8.5 设备框正面黑边与刘海融合修正（2026-10-23，已被 8.6 修订）

用户反馈设备框图片观感异常。定位为正面绿色边框过厚、CSS 刘海像悬浮黑色胶囊。

| 项             | 值                                                                                  |
| -------------- | ----------------------------------------------------------------------------------- |
| 发布提交       | `21d319d`（`main`）                                                                 |
| 变更           | 外侧改为窄苍岭绿金属边；正面增加黑色玻璃边框；刘海与黑边同色融合；减小屏幕内缩      |
| 生效观察       | 推送后轮询 11 次（5s 间隔）切到新版，约 55 秒                                       |
| 页面与资源     | 4 个页面 200；未知路径 404；静态资源抽样全部 200                                    |
| 产物一致性     | 线上 `index.html` 与仓库根产物 `cmp` 逐字节一致                                     |
| 线上浏览器烟测 | 14/14 通过；0 控制台错误、0 第三方请求                                              |
| 视觉证据       | `docs/acceptance/baseline/v2-device/hero-live-fixed.png`、`showcase-live-fixed.png` |
| CI             | 运行 `39945314644` / `39945319392` 双 job 全绿                                      |

### 8.6 设备框边到边贴合修正（2026-10-23，已被 8.7 修订）

用户复验后反馈「图片还有黑边没贴合」。8.5 的黑色玻璃正面与 CSS 刘海仍被判定为黑边，本次改为真正的边到边贴合。

| 项             | 值                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------- |
| 发布提交       | `252136a`（`main` 与 `refactor/v2-astro`）                                                      |
| 变更           | 移除黑色玻璃面板、CSS 刘海、侧键与屏幕阴影叠层；仅保留 2–3px 苍岭绿金属边框与圆角               |
| 屏幕           | 截图 `object-fit: cover` + `object-position: top center` 完整铺满，无任何遮挡或内缩             |
| 令牌           | 删除 `device-notch` 语义令牌；设备框颜色仍全部来自 `tokens.ts`，0 硬编码                        |
| 生效观察       | 推送后轮询 19 次（5s 间隔）切到 `/_astro/BaseLayout.CoUDVcAa.css`，约 95 秒                     |
| 线上 CSS 判据  | `.device-frame` 的 `padding` 为 `clamp(2px, .5vw, 3px)`；`device-notch` 命中 0                  |
| 页面与资源     | 4 个页面 200；未知路径 404                                                                      |
| 产物一致性     | 线上 `index.html` 与仓库根产物逐字节一致                                                        |
| 线上浏览器烟测 | 13/13 通过：无黑色刘海/侧键叠层、窄边框贴合 3px、轮播、灯箱、移动端；0 控制台错误、0 第三方请求 |
| 视觉证据       | `docs/acceptance/baseline/v2-device/hero-live-clean.png`、`showcase-live-clean.png`             |
| CI             | 运行 `39949296050` / `39949303220` 双 job 全绿                                                  |

### 8.7 移除手机壳、截图零裁切（2026-10-23）

用户最终要求「去掉手机壳，用其他更完美的方案，确保图片不裁切、完整」。本次不再模拟任何机身，改为无边框截图卡片。

| 项             | 值                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| 发布提交       | `25a5d4f`（`main` 与 `refactor/v2-astro`）                                                                           |
| 组件           | 删除 `DeviceFrame.astro`，新增 `ScreenshotCard.astro`；截图卡仅保留圆角、发丝内高光与分层阴影                        |
| 零裁切         | 移除容器固定 `aspect-ratio` 与 `object-fit: cover`；图片 `width: 100%; height: auto` 按原始比例撑开                  |
| 轮播           | 视口改为宽度驱动（桌面 22rem / 移动 14.5rem），比例与 1284×2778 一致；图片 `object-fit: contain`                     |
| 令牌           | 删除 `device-frame*`、`device-screen` 与 5 个未使用 alpine 色阶；`tokens.generated.css` 同步                         |
| 操作区         | 「查看大图」移入截图信息区，不再悬浮遮挡截图；移动端箭头 44×44 内收，与卡片保持 6px 间距                             |
| 生效观察       | 推送后轮询 25 次（5s 间隔）切到 `/_astro/BaseLayout.DBAqLkF7.css`，约 125 秒                                         |
| 零裁切判据     | Hero 显示比例 0.4619 / 原图 0.4622；轮播 0.4619 / 0.4620；误差 < 0.005                                               |
| 页面与资源     | 4 个页面 200；未知路径 404；静态资源抽样全部 200                                                                     |
| 产物一致性     | 线上 `index.html` 与仓库根产物逐字节一致                                                                             |
| 线上浏览器烟测 | 17/17 通过：无 `.device-frame`、卡片 padding 0、截图零裁切、按钮不遮挡、移动端箭头不遮挡；0 控制台错误、0 第三方请求 |
| 自动化门禁     | 38 unit、102 E2E（新增零裁切断言）、48 视觉基线、19/19 独立巡检                                                      |
| 视觉证据       | `docs/acceptance/baseline/v2-noshell/hero-live.png`、`showcase-live.png`                                             |
| CI             | 运行 `39955177922` / `39955185277` 双 job 全绿                                                                       |

### 8.8 点击反馈与灯箱交互增强（2026-10-23）

用户要求继续增强功能与点击交互动效。本次新增独立交互反馈层，并补齐截图放大路径。

| 项             | 值                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------- |
| 发布提交       | `d5b9287`（点击反馈）→ `78b9fcd`（灯箱加载占位，最终线上）                                          |
| 交互反馈       | 新增 `interactions.css`：主按钮 560ms 高光扫过、全局按压回弹、缩略图选中回弹、说明区 360ms 轻移淡入 |
| 截图放大       | 轻点截图或舞台聚焦后按回车直接打开灯箱；`cursor: zoom-in` 提示可点                                  |
| 防误触         | 指针位移 < 6px 判定为轻点；超过阈值按横向滑动切图，不会误开灯箱                                     |
| 灯箱加载       | 图区最小高度 46vh，加载时显示金环指示，避免空白与布局跳变；悬停即预取高清图                         |
| 生效观察       | 推送后轮询 23 次（5s 间隔）切到 `/_astro/BaseLayout.CL6nEc2O.css`，约 115 秒                        |
| 页面与资源     | 4 个页面 200；未知路径 404；静态资源抽样全部 200                                                    |
| 产物一致性     | 线上 `index.html` 与仓库根产物逐字节一致                                                            |
| 线上浏览器烟测 | 19/19 通过：轻点/回车开灯箱、拖动切图不误开、灯箱零裁切、箭头不遮挡；0 控制台错误、0 第三方请求     |
| 自动化门禁     | 38 unit、105 E2E、48 视觉基线、19/19 独立巡检                                                       |
| 视觉证据       | `docs/acceptance/baseline/v2-interactions/hero-live.png`、`showcase-live.png`、`lightbox-live.png`  |
| CI             | 运行 `39961272620` / `39961278145` 双 job 全绿                                                      |
