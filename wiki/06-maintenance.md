# 06 · 维护指南

本文件把常见维护任务拆成可执行步骤，并列出每项改动的连带影响。**任何页面改动都应改 `src/`，再构建与发布；根目录 HTML 是产物，不要手改。**

---

## 1. 先定位：内容在哪里

| 想改的内容                       | 事实源                                                                 | 备注                                       |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| 品牌名、域名、简介、平台、联系方式、备案 | `src/data/site.ts`                                                     | 页头、页脚、关于、SEO、manifest、schema 共用 |
| 首页概览数据 / 介绍卡 / 功能卡 / 系统卡 | `src/data/home.ts`                                                     | 数量由测试约束（4 / 4 / 6 / 4）            |
| 截图序号、alt、说明               | `src/data/screenshots.ts`                                              | 图片本体在 `src/assets/screenshots/`       |
| 架构图标题与说明                 | `src/data/architecture.ts`                                             | 图片本体在 `src/assets/architecture/`      |
| FAQ                              | `src/data/faq.ts`                                                      | 同时驱动页面与 FAQPage JSON-LD             |
| 隐私政策 / 用户协议              | `src/content/legal/privacy.md` / `agreement.md`                        | frontmatter + Markdown                     |
| 颜色、字号、间距、圆角、阴影、动效 | `src/design/tokens.ts`                                                 | 生成 `tokens.generated.css`，禁止手改生成物 |
| 组件结构与样式                   | `src/components/**`、`src/styles/**`                                   | 样式只使用令牌                             |
| 交互行为                         | `src/scripts/**`、`src/lib/**`                                         | 通过 `data-*` 契约连接                     |
| 元信息 / 社交分享                | `src/components/seo/Seo.astro`、`src/lib/schema.ts`                    | 图标路径来自 `data/site.ts`                |
| 发布白名单 / 同步逻辑            | `scripts/sync-root.mjs`                                                | 改动后要重新 `release`                     |
| 构建与测试                       | `astro.config.mjs`、`playwright.config.ts`、`vitest.config.ts`、`.github/workflows/ci.yml` | 改动后跑 `verify`                    |
| 设计规范 / 决策记录              | `docs/design-system/`、`docs/adr/`                                      | 架构或规范变化时同步新增/修订 ADR          |

---

## 2. 替换或新增应用截图

### 2.1 只替换现有截图（保持 22 张）

1. 用同名文件覆盖 `src/assets/screenshots/screenshot-XX.jpg`（建议 1284×2778，JPG）；
2. 若画面内容变化，更新 `src/data/screenshots.ts` 中对应的 `alt` 与 `caption`；
3. 构建并检查：

```bash
npm run build
npm run test:unit          # 数据契约
npm run test:visual:update # 截图变化会影响视觉基线
```

### 2.2 新增截图（数量变化）

1. 新增 `screenshot-23.jpg`；
2. 在 `src/data/screenshots.ts` 顶部 `import`，并在 `items` 数组追加 `{ image, alt, caption }`；
3. 同步修改数量断言：
   - `tests/unit/data.test.ts` 的 `toHaveLength(22)` 与序号数组；
   - `tests/e2e/home.spec.ts` 的 `共 22 张` 与缩略图 `toHaveCount(22)`；
4. 检查依赖「第 1 张」的逻辑：Hero 使用 `screenshots[0]`，如需更换首图请调整数组顺序；
5. 更新 OG 图文案：`scripts/generate-icons.mjs` 中 `22 张真机界面 · 10 张平台架构图`；
6. 更新 `README.md` 与 `docs/` 中的数量描述；
7. 重新生成图标并更新视觉基线：

```bash
npm run icons:build
npm run test:visual:update
```

> 功能卡的 `targetShot` 是 1-based，数据测试会校验其不超过截图总数。新增截图后如有新的关联入口，记得同步。

> 截图由 [ScreenshotCard.astro](../src/components/ui/ScreenshotCard.astro) 统一渲染，按原始比例完整展示、零裁切，
> 机型信息来自 `src/data/site.ts` 的 `screenshotDevice`。若更换拍摄机型，需同步调整机型标注、单元/E2E 断言与视觉基线；
> 任何情况下都不要恢复固定宽高比 + `object-fit: cover` 的裁切方案。

---

## 3. 新增或替换平台架构图

1. 新增 `src/assets/architecture/flow-11.png`（建议 1600×1240）；
2. 在 `src/data/architecture.ts` 中 `import` 并追加 `{ image, title, description }`；
3. 更新数量断言：
   - `tests/unit/data.test.ts` 的 `toHaveLength(10)`；
   - `tests/e2e/home.spec.ts` 灯箱计数 `01 / 10`；
4. 更新 `scripts/generate-icons.mjs` 的 OG 文案与 `README` / `docs` 中的数量；
5. 架构图卡片标题、FIG 序号由组件自动计算，无需手改；
6. 重新构建并更新视觉基线。

---

## 4. 修改首页文案与卡片

| 任务                 | 操作                                                                                   | 连带检查                                   |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| 改概览数据           | `src/data/home.ts` 的 `facts`                                                          | 数字需与截图/架构图数量一致（如 22）       |
| 改介绍卡             | `introCards`；数量保持 4 或同步数据测试                                                | 卡片索引 `01–04` 自动生成                  |
| 改功能卡             | `features`；`icon` 必须是 `FeatureIcon`；`targetShot` 在 `1..截图总数`                  | 功能卡链接会切到对应截图                   |
| 改系统与隐私         | `systemGroups`；`icon` 必须是 `SystemIcon`                                             | 文案涉及权限时必须与隐私政策一致           |
| 改 FAQ               | `src/data/faq.ts`                                                                      | 页面与 JSON-LD 同源；E2E 断言 6 项         |
| 改区块标题 / 眉题    | 对应 `src/components/home/*.astro`                                                     | 维持 `aria-labelledby` 与标题层级          |
| 改页头/页脚标签      | `src/data/site.ts`、`BaseLayout` 的 `headerLabels`、`SiteFooter.astro`                  | 同步 E2E 导航名称                          |

**文案一致性**：Hero 的「即将上架」、FAQ 的上架时间、`site.availability` 必须一致；`site.platform` 同时用于 Hero 标签、FAQ 与关于区块。

---

## 5. 修改导航

1. 页内导航改 `src/data/site.ts` 的 `navigation`（`href` 必须是 `#id`，`id` 与区块一致）；
2. 法律页入口改 `legalNavigation`；
3. 移动抽屉、页脚、页头会自动跟随；
4. 检查：
   - 目标区块存在同名 `id`；
   - `tests/e2e/home.spec.ts` 中导航名称断言；
   - `tests/unit/data.test.ts` 的锚点唯一性；
   - 新增项可能需要调整移动抽屉的序号显示（自动计算）。

---

## 6. 修改品牌、联系方式与备案

1. 改 `src/data/site.ts` 中对应字段；
2. 页头、页脚、关于区块、Seo、manifest、schema 自动同步；
3. 数据测试会校验 ICP 格式（`晋ICP备…号`）、公安备案码为纯数字、邮箱含 `@`；
4. 若域名变化，必须同步：
   - `astro.config.mjs` 的 `site`；
   - `public/robots.txt` 的 Sitemap；
   - `scripts/generate-icons.mjs` 的 OG 域名；
   - `docs/` 中部署与验收记录；
5. 若应用图标变化，替换 `src/assets/brand/app-icon.png` 后执行 `npm run icons:build`，并检查 OG 图。

---

## 7. 修改设计令牌与主题

### 7.1 标准流程

```bash
# 1. 编辑 src/design/tokens.ts（唯一事实源）
# 2. 生成 CSS
npm run tokens:build
# 3. 一致性与硬编码检查
npm run check:tokens
# 4. 对比度检查（33 项）
npm run check:contrast
# 5. 类型/构建
npm run typecheck && npm run build
# 6. 视觉基线更新（确认差异符合预期）
npm run test:visual:update
```

### 7.2 规则

- **禁止**编辑 `src/styles/tokens.generated.css`，它由脚本逐字符生成并参与一致性校验；
- 组件中禁止十六进制、`rgb()`、`hsl()`，统一 `var(--color-...)`；
- 新增语义色时，浅色与深色都要给出取值，并在 `check-contrast.mjs` 中补充对应检查项；
- 深色主题不是简单反色：需单独校准表面层级、文字、边框与金色亮度；
- `metaColors` 是给浏览器 chrome / manifest 的固定值，改动后同步检查 `theme-init` 与 `applyTheme`；
- 对比度豁免仅限纯装饰发丝线，正文与交互边界不可豁免。

### 7.3 断点与布局

断点常量在 `tokens.ts` 的 `breakpoints`，但 CSS 媒体查询是手写数值（`640px`、`768px`、`1024px` 等）。修改响应式行为时需同时搜索 `src/styles/**` 与 `src/styles/showcase.css` 中的媒体查询，保持与断点定义一致。

---

## 8. 修改法律文本

1. 编辑 `src/content/legal/*.md`；
2. frontmatter 必须包含：
   - `title`、`description`、`summary`（非空）；
   - `effectiveDate`、`updatedDate`（`YYYY-MM-DD`，会被 `z.coerce.date()` 解析）；
   - `order`（正整数，决定集合顺序）；
3. 正文用 `##` 表示章节，目录会自动生成；不要手写锚点 id；
4. 更新日期后，法律页头部、目录元信息与 `article:published_time` / `modified_time` 自动变化；
5. 检查：
   - `tests/e2e/home.spec.ts` 的隐私政策目录数（当前 9）与用户协议章节数（当前 7）；
   - `docs/design-system` 无关，但 `docs/adr/0009-legal-content.md` 如涉及事实变更需同步；
6. URL 固定为 `/privacy.html`、`/agreement.html`，不要改文件名，否则旧链接失效。

---

## 9. 依赖升级

项目采用精确版本（`--save-exact`）与 lockfile：

```bash
# 示例：升级 astro
npm install --save-exact astro@7.x.y
npm run verify

# 如果是视觉相关依赖（Chromium/字体/渲染）
npm run test:visual:update

# 升级后确认 lockfile 一并提交
git add package.json package-lock.json
```

升级注意事项：

- `astro`、`@astrojs/*`、`rehype-*`、`github-slugger` 属于高风险组合，尽量同步升级；
- `sharp` 是原生依赖，跨平台安装需重新 `npm ci`；
- `@playwright/test` 升级后可能需要重新下载浏览器并重建基线；
- 升级后必须跑 `npm run verify`，并人工查看视觉差异；
- 不要使用 `npm update` 批量漂移版本。

---

## 10. 更新视觉基线

```bash
npm run test:visual:update
git add tests/e2e/visual.spec.ts-snapshots
```

- 基线文件名包含项目、主题与平台后缀，**只在 macOS 更新**；
- 更新后查看 `reports/playwright-html` 或差异图，确认变化是预期设计调整，而不是布局破坏；
- 若只是本地字体差异，不要在非 macOS 环境提交基线；
- 基线共 64 张 PNG（12 个用例的 16 组快照 × 4 个项目），体积较大，谨慎提交无关变化。

---

## 11. 发布相关维护

| 任务                     | 操作                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| 新增根目录发布文件       | 把相对路径加入 `scripts/sync-root.mjs` 的 `SYNC_TARGETS`，重新 `release`                 |
| 停止同步某类产物         | 从 `SYNC_TARGETS` 移除，执行 `release` 会清理清单中的旧文件                              |
| 更换托管平台             | 确认平台输出目录；若为构建型可评估移除根目录同步，需新增 ADR 并更新部署文档               |
| 检查发布一致性           | `npm run check:release`                                                                  |
| 发布前完整检查           | `npm run verify` + `npm run review:independent`（需 preview）                             |
| 发布后验证               | 按 [05 · 运行与部署](05-run-and-deploy.md#7-线上部署与验证) 的 curl 与人工清单执行         |
| 回滚                     | 见 [docs/operations/rollback.md](../docs/operations/rollback.md)                          |

---

## 12. 文档同步责任

以下改动必须同步文档：

| 改动                       | 需更新                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| 架构、构建栈、运行时决策   | 新增/修订 `docs/adr/*`；更新 [01](01-architecture.md)、[04](04-dependencies.md)                   |
| 令牌、配色、组件规范       | `docs/design-system/tokens.md`、`docs/design-system/contrast-report.md`（自动生成）              |
| 模块、文件、脚本           | [02](02-modules.md)、[03](03-key-code.md)                                                       |
| 命令、门禁、发布流程       | [05](05-run-and-deploy.md)、`README.md`、`docs/operations/deployment.md`                         |
| 内容数量、截图/架构图      | [README](README.md)、[02](02-modules.md)、`README.md`、`docs/acceptance/*`                      |
| 已知缺陷与限制             | `docs/operations/known-issues.md`、`docs/adr/0010-known-limitations.md`                         |

文档原则：**能指到源码就指源码**；数量、版本、命令必须与当前仓库一致；不复制会过期的实现细节。

---

## 13. 发布前检查清单

```text
[ ] 只改了 src/、public/、scripts/、tests/、docs/，没有手改根目录 HTML
[ ] npm run verify 通过（令牌、对比度、类型、Lint、格式、单测、构建、发布一致性、Playwright）
[ ] 如改视觉：npm run test:visual:update 并人工审查差异
[ ] 如改截图/架构图数量：单测、E2E、OG 文案、README/wiki 数量全部同步
[ ] 如改法律文本：日期与章节数断言同步
[ ] 如改令牌：tokens.generated.css 已由脚本生成，未手改
[ ] npm run release 已执行，根产物与 dist/ 一致（436 个文件，随内容变化）
[ ] git status 中产物变更已一并提交
[ ] 推送 main 后按 05 的 7.1–7.5 验证线上
```

---

## 14. 常见误区

| 误区                                   | 后果 / 纠正                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------- |
| 直接编辑根目录 `index.html`            | 下次 `release` 会被覆盖；必须改 `src/pages/index.astro` 或组件               |
| 手改 `tokens.generated.css`            | `check:tokens` 失败；应改 `tokens.ts` 后重新生成                            |
| 组件里写 `#fff` / `rgba()`             | `check-tokens` 失败；改用语义令牌                                          |
| 新增截图只改数据、不改测试             | 单元/E2E 数量断言失败                                                       |
| 改了法律标题但没更新目录断言           | E2E 目录数量失败；同时 TOC 可能失配                                          |
| 在 Linux 更新视觉基线                  | 跨平台字体差异导致 CI 假失败；基线只在 macOS 更新                            |
| 忘记 `npm run release`                | 线上仍是旧版；`check:release` 与 CI 会失败                                   |
| 认为站点会请求后端                     | 站点无 API；所有内容构建期生成                                              |
| 把 `wiki/` 当运行时页面                | `wiki/` 只是文档，不参与站点构建（`.prettierignore` 也忽略该目录）            |

---

## 15. 快速命令参考

```bash
npm ci                      # 安装
npm run dev                 # 开发
npm run build               # 构建
npm run preview             # 预览
npm run verify              # 全量门禁
npm run test:unit           # 单元测试
npm run test:e2e            # E2E（含视觉）
npm run test:visual:update  # 重建视觉基线
npm run check:tokens        # 令牌门禁
npm run check:contrast      # 对比度门禁
npm run check:release       # 发布一致性
npm run release             # 构建 + 同步根目录
npm run review:independent  # 独立巡检（需 preview）
```
