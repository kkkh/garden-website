# 02 · 模块职责

本文件回答两个问题：**某段代码属于哪个模块**、**修改它会牵动哪些模块**。所有路径均相对于仓库根目录。

---

## 1. 模块地图

```text
src/
├── pages/          路由与页面编排
├── layouts/        HTML 骨架与两类页面模板
├── components/
│   ├── seo/        元信息与结构化数据
│   ├── chrome/     站点框架（页头、抽屉导航、页脚、回到顶部）
│   ├── home/       首页八个区块
│   └── ui/         可复用小部件（图标、主题切换、灯箱）
├── data/           站点常量与内容索引（构建期只读）
├── lib/            主题、埋点、日期、结构化数据等纯函数/浏览器服务
├── scripts/        运行时交互增强（轮播、灯箱、导航、显现、目录）
├── content/legal/  法律 Markdown（内容集合）
├── design/         设计令牌唯一事实源
├── styles/         令牌生成物与七个样式层
└── content.config.ts  法律内容集合 schema

scripts/            构建与门禁脚本（令牌、图标、对比度、发布同步、独立巡检）
tests/              单元与端到端测试
.github/workflows/  CI 两条流水线
```

---

## 2. 页面层（`src/pages/`）

| 模块                     | 职责                                                                                                                         | 依赖                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `index.astro`            | 组装首页八个区块；生成 `websiteSchema + mobileApplicationSchema + faqSchema` 数组并传给布局                                   | `BaseLayout`、8 个首页组件、`data/faq`、`data/site`、`lib/schema`                               |
| `[slug].astro`           | 读取 `legal` 集合生成静态路径；渲染 Markdown；从正文提取 H2 并用 `GithubSlugger` 生成目录锚点；路径强制 `.html`              | `astro:content`、`github-slugger`、`LegalLayout`                                                |
| `404.astro`              | 品牌化 404，提供首页、截图、架构、隐私政策四个出口；`noindex`                                                                 | `BaseLayout`                                                                                    |
| `site.webmanifest.ts`    | 静态 `APIRoute`，输出 Web App Manifest（名称、主题色、三个图标）                                                               | `data/site`、`design/tokens` 的 `metaColors`                                                    |

**边界**：页面只做编排与路由，不写可复用业务逻辑；区块内容一律来自 `data/` 或内容集合。

---

## 3. 布局层（`src/layouts/`）

| 模块                | 职责                                                                                                                                                         | 关键 Props                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `BaseLayout.astro`  | 输出 `<!doctype>`、`lang="zh-CN"`、内联主题初始化、`Seo`、跳转链接、页头、`<main>`、页脚、回到顶部、全局灯箱和脚本入口；计算首页/非首页的 `homeHref` | `title`、`description`、`path`、`type`、`noindex`、`publishedTime`、`modifiedTime`、`jsonLd`、`lightboxTitle`、`bodyClass` |
| `LegalLayout.astro` | 法律页双栏布局：目录（含生效/更新日期）+ 文章（标题、摘要、正文、联系声明、跨页导航）；生成 `WebSite + BreadcrumbList` JSON-LD；`article` 类型与发布时间 | `title`、`description`、`summary`、`path`、`effectiveDate`、`updatedDate`、`headings`                                  |

`BaseLayout` 把 `navigation` / `legalNavigation` 与一组中文标签传给 `SiteHeader`；非首页时把 `#anchor` 解析为 `/#anchor`，这是跨页锚点的唯一实现点。

---

## 4. SEO 模块（`src/components/seo/Seo.astro`）

| 职责           | 说明                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------ |
| 标题           | 首页直接使用传入标题；其他页面追加 `· 园枢`                                                |
| 基础元信息     | `description`、`author`、`keywords`、`format-detection`、`theme-color`（浅/深两条 media）   |
| 规范与索引     | `canonical` 由 `site.domain + path` 生成；`noindex` 可关闭索引                              |
| 社交分享       | Open Graph（type、locale、title、description、url、image 尺寸与 alt）与 Twitter Card       |
| 图标与 manifest | favicon PNG/SVG、Apple Touch Icon、`/site.webmanifest`                                     |
| 结构化数据     | 遍历 `jsonLd` 数组输出 `application/ld+json`                                               |
| 文章时间       | 可选 `article:published_time` / `article:modified_time`                                    |

所有图标路径来自 `src/data/site.ts` 的 `assets` 常量，与 `generate-icons.mjs` 的产物路径一一对应。

---

## 5. 站点框架组件（`src/components/chrome/`）

| 组件                | 职责                                                                                                          | 关键 DOM 契约 / 事件                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `SiteHeader.astro`  | 品牌、桌面主导航、主题切换、CTA、移动端菜单按钮；非首页时链接自动带首页前缀                                  | `data-site-header`、`data-nav-link`、`data-nav-section`、`data-nav-toggle`、`data-track`                   |
| `MobileNav.astro`   | 原生 `<dialog>` 抽屉，包含六个页内导航 + 两个法律页 + 页脚说明                                                | `data-mobile-nav`、`data-nav-close`                                                                        |
| `SiteFooter.astro`  | 品牌与标语、站点导航、法律与联系、版权、ICP 与公安备案外链、域名说明                                          | `data-track="nav:click"` / `outbound:click`                                                                |
| `ToTop.astro`       | 回到顶部按钮，复用左箭头并旋转 90°；`print-hidden`                                                             | `data-to-top`                                                                                              |

组件本身不绑定事件；行为由 `src/scripts/app.ts` 统一启动的模块按属性查询增强。

---

## 6. 首页区块（`src/components/home/`）

| 组件                      | 内容与数据源                                                                                                   | 关键交互 / 契约                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `HeroSection.astro`       | 品牌、定位、简介、两个 CTA、首张截图（`screenshots[0]`）、平台标签                                             | 首图 `eager` + `fetchpriority="high"`；CTA 埋点                                                        |
| `FactBand.astro`          | 4 项概览数据（`facts`）                                                                                        | `data-reveal` + `reveal-delay-*`                                                                      |
| `IntroSection.astro`      | 同时渲染「应用介绍」（4 卡，`introCards`）与「功能特性」（6 卡，`features`）                                   | 功能卡链接带 `data-shot-target`，点击后轮播跳到对应截图                                               |
| `ShowcaseSection.astro`   | 22 张截图：舞台、前后箭头、查看大图、说明计数、缩略图轨、隐藏灯箱数据源、操作提示                              | `data-carousel-*`、`data-lightbox-*`、`data-shot-target` 的目标                                          |
| `ArchitectureSection.astro` | 10 张架构图卡片（标题、FIG 序号、说明），点击打开灯箱                                                        | `data-lightbox-trigger` / `data-lightbox-item`，组名 `architecture`                                   |
| `SystemSection.astro`     | 4 组系统与隐私说明（运行环境、权限、网络、存储）+ 官网隐私声明                                                | 无脚本依赖                                                                                           |
| `FaqSection.astro`        | 6 项 FAQ，使用原生 `<details>`，首项默认展开                                                                   | 组件内 `<style>` 定义 FAQ 局部样式                                                                    |
| `AboutSection.astro`      | 开发与运营信息、内容版权说明、联系方式、备案信息                                                              | 邮件与备案外链埋点                                                                                   |

区块文案几乎全部来自 `src/data/home.ts`、`src/data/faq.ts`、`src/data/site.ts`；组件只保留结构性文字（标题、眉题、提示语）。

---

## 7. 通用 UI（`src/components/ui/`）

| 组件                 | 职责                                                                                          | 说明                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Icon.astro`         | 24×24 线性 SVG 图标库，按 `name` 查表输出路径                                                  | 覆盖功能/系统图标与箭头、展开、关闭、信息、菜单；`aria-hidden`          |
| `ThemeToggle.astro`  | 三态主题按钮组（浅色/深色/跟随系统），`role="group"` + `aria-pressed`                          | 初始 `aria-pressed` 以 system 为 true，脚本加载后按实际偏好同步          |
| `ScreenshotCard.astro` | 无边框截图卡片：图片按 1284×2778 原始比例完整展示，零裁切                                   | `data-device-model="iphone-13-pro-max"`；Hero 与轮播共用；仅圆角、发丝高光与分层阴影 |
| `Lightbox.astro`     | 全局 `<dialog>` 灯箱骨架：标题、计数、图片区、说明、前后按钮、关闭按钮                          | `data-lightbox`、`data-lightbox-image`、`data-lightbox-count` 等          |

`Icon` 的图标表是纯数据映射；新增图标需要同时改 `name` 类型与 `PATHS`。

---

## 8. 数据模块（`src/data/`）

| 模块               | 导出                                                                                                                                             | 被谁消费                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `site.ts`          | `site`（品牌、域名、描述、关键词、平台、开发者、联系方式、备案、主题色）、`assets`（图标/OG 路径）、`navigation`、`legalNavigation`、两个类型 | 布局、页头、页脚、关于、Seo、manifest、schema、测试             |
| `home.ts`          | `facts`、`introCards`、`features`、`systemGroups`                                                                                                | Hero 之外的首页区块、数据测试                                  |
| `screenshots.ts`   | `screenshots`：22 项 `{ index, image, alt, caption }`                                                                                            | Hero、Showcase、功能卡（`targetShot`）、数据测试、灯箱          |
| `architecture.ts`  | `architectureFigures`：10 项 `{ index, image, title, description }`                                                                              | Architecture、数据测试、灯箱                                    |
| `faq.ts`           | `faqItems`：6 项问答                                                                                                                             | FaqSection、`faqSchema`、数据测试                               |
| `types.ts`         | `Screenshot`、`ArchitectureFigure`、`Feature`、`IntroCard`、`SystemGroup`、`Fact` 等接口                                                          | 数据模块与组件 Props                                            |

**单一事实源规则**：同一文案只允许存在一处。例如备案号只在 `site.filing` 定义，三处页面引用；FAQ 同源驱动可见列表与 JSON-LD。

---

## 9. 库层（`src/lib/`）

| 模块                   | 职责                                                                                                         | 运行期 / 构建期        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `theme.ts`             | 主题偏好的读、写、解析、应用；绑定三态按钮与系统主题变化                                                     | 运行期                 |
| `theme-init.ts`        | 导出内联脚本字符串，在 `<head>` 中提前设置 `data-theme`、`color-scheme` 并添加 `.js` 类                       | 构建期注入 / 运行期执行 |
| `analytics.ts`         | `track()` 本地事件缓冲（上限 200）+ `CustomEvent`；`initAnalytics()` 通过 `data-track` 统一委托               | 运行期                 |
| `format.ts`            | 中文日期格式化（固定 `Asia/Shanghai`）与 ISO 日期切片                                                        | 构建期                 |
| `schema.ts`            | `websiteSchema`、`mobileApplicationSchema`、`breadcrumbSchema`、`faqSchema`                                    | 构建期                 |

`lib/` 不依赖任何组件；其中 `theme.ts` 与 `analytics.ts` 有单元测试覆盖。

### 9.1 类型声明

| 文件                     | 职责                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `src/env.d.ts`           | 引入 `astro/client` 类型，提供 `ImageMetadata` 等 Astro 客户端类型                           |
| `src/types/global.d.ts`  | 扩展 `Window`：`__gardenRevealReady`、`__gardenCarouselReady`，供 E2E 等待初始化完成           |

`Window.__gardenEvents` 的类型在 `src/lib/analytics.ts` 内部通过 `declare global` 声明，不放在全局类型文件中。

---

## 10. 运行时脚本（`src/scripts/`）

| 模块              | 职责                                                                                                       | 对外 API / 契约                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `app.ts`          | 唯一启动入口：按顺序初始化各模块；轮播失败兜底；绑定 `data-shot-target` 点击                        | 无导出，导入即执行                                                                |
| `carousel.ts`     | 截图轮播类与纯函数；箭头/缩略图/键盘/滑动切换、相邻预加载、缩略图居中、ARIA 同步、埋点                    | `ScreenshotCarousel`、`wrapIndex`、`formatIndex`、`isHorizontalSwipe`             |
| `lightbox.ts`     | 灯箱类；按组读取 `data-lightbox-item`、打开/切换/关闭、焦点恢复、滚动锁定、相邻预加载、加载错误态         | `Lightbox`、`initLightbox`                                                        |
| `header.ts`       | 滚动状态（`data-scrolled`）、当前区块 `aria-current`、回到顶部按钮显隐、阅读进度线                       | `initHeader`                                                                      |
| `hero-tilt.ts`    | Hero 设备框桌面指针微倾斜（最大 3°，触控/减弱动效禁用）                                                     | `initHeroTilt`                                                                    |
| `mobile-nav.ts`   | 原生 `<dialog>` 打开/关闭、`aria-expanded`、`body.is-locked`、关闭恢复焦点、桌面断点自动关闭                 | `initMobileNav`                                                                   |
| `reveal.ts`       | IntersectionObserver 显现；无 IO 或减弱动效时全部直接显示；暴露 `revealAll`                                 | `initReveal`、`revealAll`                                                         |
| `legal-toc.ts`    | 重建法律页目录、Observer 高亮当前章节                                                                       | `initLegalToc`                                                                    |

所有模块都通过 `data-*` 查询 DOM，不依赖组件内部 class；样式类只用于视觉，不作为行为选择器（轮播的缩略图轨 `.showcase__rail` 是唯一例外，用于滚动容器定位）。

---

## 11. 样式模块（`src/styles/`）

| 文件                    | 层         | 职责                                                                          | 是否手写           |
| ----------------------- | ---------- | ----------------------------------------------------------------------------- | ------------------ |
| `tokens.generated.css`  | 令牌       | 原始色、语义色（浅/深）、字体、间距、圆角、阴影、动效、布局、层级、打印色      | 否，脚本生成       |
| `base.css`              | 基础       | 重置、排版基线、链接/表单/图片默认、焦点、跳转链接、打印、对比度与减弱动效媒体查询 | 是                 |
| `utilities.css`         | 工具       | 容器、区块、网格、标题组、眉题、标签、通知、显现动画、`sr-only`、`js-only`     | 是                 |
| `components.css`        | 组件       | 按钮、Tag/Chip、卡片、功能卡、系统卡、统计条、截图卡片                        | 是                 |
| `chrome.css`            | 框架       | 页头、桌面导航、主题切换、移动导航、页脚、回到顶部                              | 是                 |
| `showcase.css`          | 展示       | Hero、概览数据带、截图轮播、灯箱、架构图卡片、时间线                            | 是                 |
| `interactions.css`      | 交互       | 主按钮高光、按压回弹、缩略图选中、说明区切换、灯箱加载金环                      | 是                 |
| `editorial.css`         | 编辑       | 法律页双栏、目录、长文排版、关于我们、错误页、通知                              | 是                 |

`global.css` 只按顺序 `@import` 以上文件；Fontsource 字体也在此导入。样式文件之间不互相 `@import`。

---

## 12. 内容集合（`src/content/legal/`）

| 文件             | 章节数（H2） | 关键 frontmatter                                                              |
| ---------------- | ------------ | ----------------------------------------------------------------------------- |
| `privacy.md`     | 9            | `title`、`description`、`summary`、`effectiveDate: 2026-09-25`、`updatedDate: 2026-10-23`、`order: 1` |
| `agreement.md`   | 7            | 同上，`updatedDate: 2026-09-25`、`order: 2`                                    |

`src/content.config.ts` 使用 `glob({ pattern: '**/*.md', base: './src/content/legal' })` 与 zod schema：标题/描述/摘要非空、日期可解析、`order` 为正整数。

---

## 13. 构建与门禁脚本（`scripts/`）

| 脚本                       | 职责                                                                                           | 产物 / 退出行为                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `generate-tokens.mjs`      | 由 `tokens.ts` 生成完整 CSS；`--check` 做逐字符比对                                             | `src/styles/tokens.generated.css`；不一致退出 1                   |
| `generate-icons.mjs`       | 由应用图标生成 4 个 PNG、内嵌位图 SVG 与 1200×630 OG 图                                          | `public/icons/*`、`public/og/og-default.png`                      |
| `check-tokens.mjs`         | 扫描 `src/` 的颜色字面量；允许令牌源与生成物                                                    | 违规列出文件与行号，退出 1                                        |
| `check-contrast.mjs`       | 解析令牌引用并计算 33 项 WCAG 对比度；正文 4.5、大文本/非文本 3                                 | `docs/design-system/contrast-report.md`；不达标退出 1              |
| `sync-root.mjs`            | 把 `dist/` 白名单产物同步到仓库根；`--check` 比对体积、残留与清单                              | 437 个文件 + `.release-manifest.json`                             |
| `capture-baseline.mjs`     | 抓取线上 v1 与本地 v2 的桌面/移动截图，用于 before/after 证据                                    | `docs/acceptance/baseline/**`（按需运行，不入 CI）                |
| `independent-review.mjs`   | 不复用 E2E 代码的独立巡检（A–K 11 组），含 axe 与截图                                            | `docs/acceptance/independent-review.json` 与截图                   |

---

## 14. 测试与配置模块

| 模块                         | 职责                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `tests/unit/carousel.test.ts` | 环形索引、两位序号、滑动判定（阈值/比例/斜向）                                                                    |
| `tests/unit/theme.test.ts`    | 偏好校验、系统解析、DOM/meta 应用、存储读写与异常降级                                                             |
| `tests/unit/data.test.ts`     | 导航、备案、22 张截图、10 张架构图、4/6/4 内容数量、功能卡目标范围、四类 schema 契约                              |
| `tests/e2e/home.spec.ts`      | 结构、SEO、导航、轮播、灯箱、主题、FAQ、法律页、外链安全、404                                                     |
| `tests/e2e/a11y.spec.ts`      | axe 扫描四个页面 + 深色主题、键盘路径、触控目标、正文对比度抽样                                                    |
| `tests/e2e/mobile.spec.ts`    | 无横向溢出、抽屉/桌面导航切换、缩略图滚动、Hero 可读性                                                            |
| `tests/e2e/reduced-motion.spec.ts` | 内容直接可见、无持续动画、过渡近似 0、锚点非平滑滚动                                                         |
| `tests/e2e/visual.spec.ts`    | 页面与组件状态视觉基线（12 个用例产生 16 组快照，4 个项目共 64 张 PNG）                                          |
| `playwright.config.ts`       | 5 个项目、`astro preview` webServer、报告输出、1% 像素容差                                                         |
| `vitest.config.ts`           | Node 环境、`@` 别名、覆盖率范围                                                                                   |
| `eslint.config.mjs`          | JS/TS/Astro 规则、禁 `any`、console 限制、忽略发布产物                                                             |
| `.prettierrc.json`           | 100 列、单引号、尾逗号、Astro 插件                                                                                 |
| `.github/workflows/ci.yml`   | Ubuntu 门禁 + macOS 视觉回归 + 报告/产物上传                                                                       |

---

## 15. 模块依赖矩阵

| 模块          | 依赖                                                                                                                   | 被谁依赖                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `data/site.ts` | `design/tokens.ts`（`metaColors`）                                                                                     | 布局、页头、页脚、关于、Seo、manifest、schema、测试   |
| `data/home.ts` | `data/types.ts`                                                                                                        | Intro、System、FactBand、测试                         |
| `data/screenshots.ts` | `assets/screenshots/*`、`data/types.ts`                                                                          | Hero、Showcase、测试                                  |
| `data/architecture.ts` | `assets/architecture/*`、`data/types.ts`                                                                         | Architecture、测试                                    |
| `data/faq.ts` | `data/site.ts`、`lib/schema.ts`（类型）                                                                                | FaqSection、schema、测试                              |
| `lib/schema.ts` | `data/site.ts`                                                                                                        | 首页、法律页、测试                                    |
| `lib/theme.ts` | `design/tokens.ts`（`metaColors`）                                                                                     | `app.ts`、单元测试                                     |
| `lib/analytics.ts` | 无                                                                                                                  | 轮播、灯箱、`app.ts`、各组件埋点属性                   |
| `scripts/*`   | `lib/analytics`、`lib/theme`、各 `data-*` 契约                                                                          | `app.ts`（通过组件内的 `<script>` 引入）               |
| `components/**` | `data/*`、`lib/schema`、`assets/*`                                                                                    | 页面与布局                                            |
| `layouts/*`   | `components/*`、`data/site`、`lib/*`、`styles/global.css`                                                               | 页面                                                  |
| `pages/*`     | `layouts/*`、`components/*`、`data/*`、`lib/schema`                                                                    | Astro 路由                                            |

---

## 16. 改动影响速查

| 改动                         | 必须同步                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| 截图数量                     | `data/screenshots.ts`、`tests/unit/data.test.ts`（22）、`tests/e2e/home.spec.ts`（22）、OG 文案、视觉基线 |
| 功能卡文案或目标截图         | `data/home.ts`、`targetShot` 范围测试、FAQ/文案一致性                                             |
| 导航项                       | `data/site.ts`、页头/抽屉/页脚、E2E 导航断言、区块锚点                                             |
| 备案号 / 联系方式            | `data/site.ts`、数据测试、页脚与关于区块（自动同步）                                               |
| 法律文本章节                 | `content/legal/*.md`、E2E 目录/章节数断言、日期                                                 |
| 设计令牌                     | `design/tokens.ts` → `tokens:build` → 对比度门禁 → 视觉基线                                       |
| 交互脚本 DOM 契约            | 对应组件属性、`03-key-code.md`、E2E                                                              |
| 发布白名单                   | `sync-root.mjs`、`.release-manifest.json`、部署文档                                                |
| 依赖版本                     | `package.json` / lockfile、`verify`、视觉基线、CI Node 版本                                        |
