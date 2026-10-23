# 部署与发布

> 当前发布策略：**推送即上线**（`git push origin main`）。
> 产物同时在 `dist/` 与仓库根目录，兼容「纯静态根目录」与「构建型平台」两种平台配置。
> 决策依据见 `docs/adr/0011-release-sync.md`（修订 ADR-0007）。

---

## 1. 线上形态

| 项          | 值                                          | 证据                             |
| ----------- | ------------------------------------------- | -------------------------------- |
| 域名        | `https://jl.43322.cn`                       | 站点正文与页脚                   |
| 仓库        | `https://github.com/kkkh/garden-website`    | `git remote -v`                  |
| 分支        | `main`（推送即触发线上更新）                | 用户确认                         |
| 托管        | 腾讯云 EdgeOne Makers（静态）               | 响应头 `Server: edgeone makers`  |
| v1 服务位置 | 仓库根目录                                  | v1 仓库结构（`index.html` 在根） |
| v2 服务位置 | 仓库根目录（同步产物）+ `dist/`（构建产物） | `scripts/sync-root.mjs`          |

---

## 2. 发布流程（三步）

```bash
# 1. 构建并把产物同步到仓库根（同时校验一致性）
npm run release

# 2. 提交（源码 + 同步后的产物）
git add -A
git commit -m "release: v2 <说明>"

# 3. 推送 main（触发线上更新）
git push origin main
```

> `npm run release` = `npm run build` + `node scripts/sync-root.mjs` + `--check` 校验。
> 如果只改源码却忘记同步，`npm run verify` 与 CI 的 `check:release` 会失败。

### 为什么需要「同步到根目录」

v1 时代平台直接从仓库根目录服务静态文件；v2 使用 Astro，产物在 `dist/`。
平台的输出目录配置无法从代码侧确认，因此采取双兼容：

| 平台配置            | 站点实际服务的内容           | 结果 |
| ------------------- | ---------------------------- | ---- |
| 纯静态，根目录      | 根目录同步产物               | ✅   |
| 构建型，输出 `dist` | 平台构建产物                 | ✅   |
| 构建型，输出根目录  | 平台构建产物（覆盖同一位置） | ✅   |
| 构建型但构建失败    | 根目录同步产物兜底           | ✅   |

---

## 3. 产物清单

`npm run release` 后，以下条目同时存在于 `dist/` 与仓库根（共 436 个文件）：

```text
index.html  privacy.html  agreement.html  404.html
_astro/                 # 哈希命名的 CSS / JS / 图片（AVIF + WebP + 原格式多尺寸）
icons/                  # favicon-32.png、favicon.svg、apple-touch-icon.png、icon-192/512.png
og/og-default.png       # 1200×630 分享图
beian/beian.png
.well-known/apple-app-site-association
robots.txt  site.webmanifest  sitemap-index.xml  sitemap-0.xml
.release-manifest.json  # 同步清单（用于清理旧产物与门禁校验）
```

---

## 4. 发布后验证（必须逐项执行）

```bash
BASE=https://jl.43322.cn

# 4.1 三个页面与 404
for p in / /privacy.html /agreement.html; do
  printf "%-16s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE$p"
done

# 4.2 确认线上是 v2（关键判据）
curl -s "$BASE" | grep -c 'data-carousel'                 # 期望 2
curl -s "$BASE" | grep -o 'application/ld+json' | wc -l    # 期望 3
curl -s "$BASE" | grep -c 'site.webmanifest'               # 期望 1（v1 没有）
curl -s "$BASE" | grep -c 'carousel'                       # v1 的实现里没有该标记类

# 4.3 新增资源
for p in /site.webmanifest /robots.txt /sitemap-index.xml /og/og-default.png /icons/icon-192.png /.well-known/apple-app-site-association; do
  printf "%-44s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE$p"
done

# 4.4 未知路径应返回品牌化 404
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/not-exist-page"

# 4.5 缓存与安全头抽查
curl -sI "$BASE" | grep -iE 'cache-control|server'
```

浏览器端人工确认：

- [ ] 首屏为墨蓝 + 鎏金 + 设备框（v2 版式），无主题闪烁
- [ ] 22 张截图可切换，缩略图与灯箱正常
- [ ] 深浅主题切换后刷新保持
- [ ] 移动端抽屉导航可用，无横向滚动
- [ ] 页脚两个备案链接可打开
- [ ] 出现「常见问题」区块（v1 没有）

---

## 5. 缓存建议（平台侧可配置项）

| 路径                                                | 建议响应头                                            |
| --------------------------------------------------- | ----------------------------------------------------- |
| `/_astro/*`                                         | `Cache-Control: public, max-age=31536000, immutable`  |
| `/icons/*`、`/og/*`、`/beian/*`                     | `Cache-Control: public, max-age=86400`                |
| `/*.html`                                           | `Cache-Control: public, max-age=300, must-revalidate` |
| `/site.webmanifest`、`/robots.txt`、`/sitemap*.xml` | `Cache-Control: public, max-age=3600`                 |

v2 不再使用 `?v=` 手工版本号：CSS 与图片文件名带内容哈希，HTML 短缓存即可保证更新及时。

---

## 6. 故障排查

| 现象              | 可能原因                                 | 处理                                                                                     |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 推送后线上仍是 v1 | 平台未监听该分支 / 部署未触发 / CDN 缓存 | 检查平台部署记录；`curl -sI` 看 `Cache-Control` 与 `Last-Modified`；必要时在平台刷新缓存 |
| 线上 404          | 根目录产物缺失                           | 本地 `npm run release` 后提交并重新推送                                                  |
| 页面无样式        | `_astro/` 未上传或被缓存                 | 检查 `/_astro/*.css` 是否 200                                                            |
| 部分图片 404      | 产物未完整同步                           | `node scripts/sync-root.mjs --check` 定位缺失文件                                        |
| 根目录产物过期    | 改了源码但没跑 `release`                 | 跑 `npm run release` 并提交；CI 的 `check:release` 也会拦截                              |

---

## 7. 发布清单（可复制）

```text
[ ] npm run verify 通过（含 check:release）
[ ] npm run release 已执行，root 与 dist 一致（436 个文件）
[ ] git status 中产物变更已一并提交
[ ] 推送 main 完成，平台部署状态为成功
[ ] 第 4 节 4.1–4.5 全部通过（尤其 4.2 的 v2 判据）
[ ] 浏览器端人工确认 6 项
[ ] 记录本次发布的 commit hash 与时间，保留上一版以便回滚
```

---

## 8. 发布记录

### 2026-10-23 · v2 上线（commit `033f444`）

| 项             | 结果                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| 推送分支       | `main`（`refactor/v2-astro` 同步留档），来源提交 `26a3c68` → `033f444`（8 个提交，620 个文件）              |
| 生效观察       | 推送后轮询 23 次（间隔 5s）由 v1 切到 v2，约 110 秒                                                         |
| 页面（4.1）    | `/`、`/privacy.html`、`/agreement.html`、`/404.html` 全部 200；未知路径 404                                 |
| v2 判据（4.2） | `data-carousel` 存在、`application/ld+json` × 3、`site.webmanifest` × 1、v1 `cvr-stage` × 0                 |
| 资源（4.3）    | manifest、robots、两个 sitemap、OG、192/512 图标、Apple Touch Icon、favicon.svg、备案图、AASA、CSS 全部 200 |
| 发布后来源     | 线上 `index.html` 与仓库根产物 `cmp` 逐字节一致 → 确认为「根目录同步产物」直接服务                          |
| 浏览器烟测     | Playwright 桌面 + 移动 21 项断言全部通过；0 控制台错误、0 未捕获异常、0 第三方请求                          |
| 证据           | `docs/acceptance/logs/deployment-verification.txt`                                                          |

结论：**在本地门禁、独立巡检（19/19）与上述线上验证证据下达到发布验收标准**。仍待人工完成的
项目见 [验收报告第 5.2 节](../acceptance/verification-report.md)（真机走查、VoiceOver 朗读、打印复核）。

### 2026-10-23 · iPhone 13 Pro Max 苍岭绿设备框（commit `423fb63`）

| 项         | 结果                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| 变更       | 新增 `DeviceFrame.astro`；Hero 与截图轮播共用苍岭绿机身框；新增机型/配色标注        |
| 生效观察   | 推送后轮询 18 次（5s 间隔）由旧版切到新版，约 85 秒                                 |
| 线上判据   | `data-device-model="iphone-13-pro-max"`、`data-device-finish="alpine-green"` 均存在 |
| 页面与资源 | 4 个页面 200；未知路径 404；全部静态资源 200                                        |
| 产物一致性 | 线上 `index.html` 与仓库根产物逐字节一致                                            |
| 浏览器烟测 | Playwright 桌面 + 移动 25/25 通过；0 控制台错误、0 第三方请求                       |
| 视觉证据   | `docs/acceptance/baseline/v2-device/`                                               |
| 证据       | `docs/acceptance/logs/deployment-verification.txt`                                  |

### 2026-10-23 · 全方位动效升级（commit `34710dd`）

| 项         | 结果                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| 变更       | Hero 首屏编排、指针微倾斜、轮播方向感知、灯箱/抽屉入场、导航下划线、阅读进度线、图标微动 |
| 生效观察   | 推送后轮询 21 次（5s 间隔）由旧版切到新版，约 105 秒                                     |
| 动效判据   | 阅读进度线 `scaleX` 随滚动变化；轮播 `data-position` 为 before/active/after              |
| 页面与资源 | 4 个页面 200；未知路径 404；全部静态资源 200                                             |
| 产物一致性 | 线上 `index.html` 与仓库根产物逐字节一致                                                 |
| 浏览器烟测 | Playwright 桌面 + 移动 + 减弱动效 28/28 通过；0 控制台错误、0 第三方请求                 |
| 视觉证据   | `docs/acceptance/baseline/v2-polish/`                                                    |
| 证据       | `docs/acceptance/logs/deployment-verification.txt`                                       |

### 2026-10-23 · 设备框正面黑边与刘海融合（commit `21d319d`，已被下一节修订）

| 项         | 结果                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| 变更       | 外侧窄苍岭绿金属边 + 正面黑色玻璃边框；刘海与黑边融合；减小屏幕内缩                 |
| 生效观察   | 推送后轮询 11 次（5s 间隔）切换完成，约 55 秒                                       |
| 页面与资源 | 4 个页面 200；未知路径 404；静态资源抽样全部 200                                    |
| 产物一致性 | 线上 `index.html` 与仓库根产物逐字节一致                                            |
| 浏览器烟测 | 14/14 通过；0 控制台错误、0 第三方请求                                              |
| 视觉证据   | `docs/acceptance/baseline/v2-device/hero-live-fixed.png`、`showcase-live-fixed.png` |
| CI         | `39945314644` / `39945319392` 双 job 全绿                                           |

### 2026-10-23 · 设备框边到边贴合（commit `252136a`，已被下一节修订）

| 项         | 结果                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| 变更       | 移除黑色玻璃面板、CSS 刘海、侧键与屏幕阴影叠层；截图边到边铺满，仅保留 2–3px 金属边框 |
| 生效观察   | 推送后轮询 19 次（5s 间隔）切换完成，约 95 秒；线上 CSS 为 `BaseLayout.CoUDVcAa.css`  |
| CSS 判据   | `.device-frame` padding 为 `clamp(2px, .5vw, 3px)`；`device-notch` 命中 0             |
| 页面与资源 | 4 个页面 200；未知路径 404；静态资源抽样全部 200                                      |
| 产物一致性 | 线上 `index.html` 与仓库根产物逐字节一致                                              |
| 浏览器烟测 | 13/13 通过；0 控制台错误、0 第三方请求                                                |
| 视觉证据   | `docs/acceptance/baseline/v2-device/hero-live-clean.png`、`showcase-live-clean.png`   |
| CI         | `39949296050` / `39949303220` 双 job 全绿                                             |

### 2026-10-23 · 移除手机壳、截图零裁切（commit `25a5d4f`）

| 项         | 结果                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| 变更       | 删除 `DeviceFrame`，改为无边框 `ScreenshotCard`；图片按原始比例自然撑开，零裁切       |
| 轮播       | 视口宽度驱动（桌面 22rem / 移动 14.5rem）；图片 `object-fit: contain`；按钮移入信息区 |
| 生效观察   | 推送后轮询 25 次（5s 间隔）切换完成，约 125 秒；线上 CSS 为 `BaseLayout.DBAqLkF7.css` |
| CSS 判据   | `.screenshot-card` 命中 23；`.device-frame` 命中 0；卡片 `padding: 0px`               |
| 零裁切判据 | Hero 显示比例 0.4619 / 原图 0.4622；轮播 0.4619 / 0.4620                              |
| 页面与资源 | 4 个页面 200；未知路径 404；静态资源抽样全部 200                                      |
| 产物一致性 | 线上 `index.html` 与仓库根产物逐字节一致                                              |
| 浏览器烟测 | 17/17 通过；0 控制台错误、0 第三方请求                                                |
| 视觉证据   | `docs/acceptance/baseline/v2-noshell/hero-live.png`、`showcase-live.png`              |
| CI         | `39955177922` / `39955185277` 双 job 全绿                                             |

### 2026-10-23 · 点击反馈与灯箱增强（commit `78b9fcd`）

| 项         | 结果                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------- |
| 变更       | 新增交互反馈层（高光扫过、按压回弹、缩略图回弹、说明区轻移）；截图轻点/回车放大；灯箱加载占位与预取 |
| 生效观察   | 推送后轮询 23 次（5s 间隔）切换完成，约 115 秒；线上 CSS 为 `BaseLayout.CL6nEc2O.css`               |
| CSS 判据   | `thumb-select`、`meta-shift`、`lightbox-spin`、`is-switching` 均命中                                |
| 交互判据   | 轻点截图打开大图；拖动 > 6px 切图且不误开；Esc 关闭；灯箱图 1284×2778 完整展示                      |
| 页面与资源 | 4 个页面 200；未知路径 404；静态资源抽样全部 200                                                    |
| 产物一致性 | 线上 `index.html` 与仓库根产物逐字节一致                                                            |
| 浏览器烟测 | 19/19 通过；0 控制台错误、0 第三方请求                                                              |
| 视觉证据   | `docs/acceptance/baseline/v2-interactions/`                                                         |
| CI         | `39961272620` / `39961278145` 双 job 全绿                                                           |

### 2026-10-23 · 首屏性能、WebKit 基线、架构图长描述（commit `a1e91dc`）

| 项         | 结果                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| 变更       | 主样式全部内联；轮播预取改为浏览器选源；新增 WebKit 6 项视觉基线；架构图补长描述；字形渲染细化            |
| 性能基线   | 移动端 performance 82 / FCP 2.9s / LCP 3.6s / 566 KiB；桌面 94 / LCP 1.4s                                 |
| 性能复测   | 移动端 **91 / 2.2s / 3.1s / 309 KiB**；桌面 **99 / LCP 0.9s**；两轮均为线上真实地址 + Lighthouse 默认节流 |
| 预加载结论 | LCP 元素为中文文本，Hero 图与字体不在 LCP 关键路径，故不加 preload；改以消除阻塞请求与无效预取收益更高    |
| 生效判据   | 线上 `index.html` 内含 `<style>`（无外链 CSS），脚本哈希 `yVmALTYE`；与仓库根产物逐字节一致               |
| 页面与资源 | 4 个页面 200；未知路径 404；静态资源抽样全部 200                                                          |
| 产物       | 根目录与 `dist` 均为 436 个文件（原外链 CSS 消失）                                                        |
| 浏览器烟测 | 111 项 Playwright 全通过（含 6 项 WebKit 视觉）；0 控制台错误                                             |
| CI         | `39974296407`（main）success                                                                              |

### 2026-10-24 · v3 下载入口、更新日志与安全头（commit `0d87273`）

| 项         | 结果                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| 变更       | 下载入口状态机、应用信息区、最近更新、`/changelog.html`、独立 OG、无损 WebP 架构图、`edgeone.json` 安全头与 301 |
| 生效观察   | 推送后轮询约 125 秒，`/changelog.html` 返回 200                                                                 |
| 页面       | `/`、`/privacy.html`、`/agreement.html`、`/changelog.html`、`/404.html` 均 200；未知路径 404                    |
| 重定向     | `GET /changelog` → 301 `Location: /changelog.html`                                                              |
| 安全头     | 线上命中 CSP、`Referrer-Policy`、`X-Content-Type-Options`、`X-Frame-Options`、`Permissions-Policy`              |
| 产物一致性 | 线上 `index.html`、`changelog.html` 与仓库根产物逐字节一致                                                      |
| 产物数量   | 仓库根与 `dist` 均为 **443** 个文件                                                                             |
| 渲染巡检   | Chromium + WebKit × 5 页面 × 明暗主题：0 控制台错误、0 失败请求、0 4xx/5xx、无溢出、无破图                      |
| 无障碍     | axe 双引擎 × 双主题 × 5 页面全通过；修复轮播计数 2.92:1 对比度问题                                              |
| 性能       | `/changelog.html` Lighthouse：performance 92、a11y 100、best-practices 100、SEO 100，LCP 2.8s、CLS 0            |
| 自动化     | 54 unit、132 E2E（1 项 tablet 视觉按设计跳过）、74 视觉基线、33 项对比度                                        |
| 未完成     | HTTP → HTTPS 301 与 HSTS 需在 EdgeOne 控制台开启（代码侧无法下发）                                              |
