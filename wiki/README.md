# 园枢官网 · Code Wiki

> 「园枢」是面向山西晋中理工学院师生、考生与家长的校园信息聚合 iOS 应用的官方网站。
> 本 Wiki 面向维护者与开发者，按「架构 → 模块 → 关键代码 → 依赖 → 运行部署 → 维护」组织，覆盖 v2 仓库内的全部源码、构建脚本与测试。

**文档基准**：`main` 分支 commit `3c9d801`（2026-10-23），对应 `package.json` 版本 `2.0.0`。
**历史归档**：v1（纯静态 HTML / CSS / JS）时代的旧版 Code Wiki 保留在 [archive-v1/](archive-v1/README.md)，描述重构前的实现，仅供追溯；本套文档为 v2 Astro 架构的现行版本。

---

## 1. 项目速览

| 项目               | 说明                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 项目类型           | 静态展示型官网（Marketing / 官方信息站），面向访客介绍 iOS 应用                                                            |
| 技术栈             | Astro 7.4.2（静态输出）+ TypeScript 6.0.3（strict）+ 原生 CSS 设计令牌 + 原生 TypeScript 浏览器模块                        |
| 页面数量           | 4 个 HTML 页面：首页、隐私政策、用户协议、404                                                                                     |
| 构建工具           | Astro + Vite；`scripts/` 下的 Node 脚本负责令牌、图标与发布同步                                                    |
| 后端 / 数据库      | 无。页面内容在构建期确定，运行时不请求任何数据接口                                                                                |
| 第三方运行时依赖   | 0 个网络请求。字体随包打包，无 CDN、无第三方脚本、无统计 SDK                                                                       |
| 样式入口           | [src/styles/global.css](../src/styles/global.css)，按令牌、基础、工具、组件、框架、展示、编辑七层拆分                     |
| 交互入口           | [src/scripts/app.ts](../src/scripts/app.ts)，统一启动轮播、灯箱、导航、主题、显现动画与本地埋点                            |
| 内容事实源         | `src/data/*`（文案与索引）、`src/content/legal/*.md`（法律文本）、`src/design/tokens.ts`（设计令牌）                              |
| 图片资源           | 22 张 iPhone 13 Pro Max 真机截图（苍岭绿）、10 张平台架构图、1 个应用图标，位于 `src/assets/`，构建期转为 AVIF/WebP 多尺寸 |
| 构建产物           | `dist/` 371 个文件；同时由 [scripts/sync-root.mjs](../scripts/sync-root.mjs) 同步到仓库根目录，兼容两种平台配置               |
| 质量门禁           | 令牌一致性、硬编码颜色扫描、33 项对比度、类型检查、ESLint、Prettier、38 个单元测试、E2E / axe / 视觉回归、发布一致性 |
| 线上域名           | <https://jl.43322.cn>（2026-10-23 已上线 v2，动效升级 commit `34710dd`）                                                            |
| 部署方式           | 腾讯云 EdgeOne Makers 静态托管；推送 `main` 即上线（详见 [05](05-run-and-deploy.md)）                                         |
| 运行环境           | Node.js ≥ 24；本地开发默认端口 `4321`                                                                                            |

---

## 2. 文档目录

| 文档                                    | 内容                                                                                       | 适合谁                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| [01 · 整体架构](01-architecture.md)     | 系统边界、技术选型、构建期/运行期分层、渲染与数据流、SEO/主题/可访问性、发布架构、约束      | 首次接手、技术评审、架构改动       |
| [02 · 模块职责](02-modules.md)          | 页面、布局、组件、数据、库、脚本、样式、内容集合、构建脚本、测试的职责与依赖矩阵            | 定位「某段代码属于哪里」           |
| [03 · 关键代码说明](03-key-code.md)     | DOM 契约、关键组件/类/函数逐项说明、轮播与灯箱状态机、主题与埋点、构建脚本算法、测试要点    | 改代码前必读                       |
| [04 · 依赖关系](04-dependencies.md)     | 运行时/开发依赖、内部依赖图、路径别名、资源管线、外部链接、浏览器 API、依赖风险            | 评估改动影响、排查 404/构建失败    |
| [05 · 运行与部署](05-run-and-deploy.md) | 本地启动、脚本清单、质量门禁、测试与视觉基线、发布流程、部署验证、缓存与故障排查            | 本地预览、上线发布、排障           |
| [06 · 维护指南](06-maintenance.md)      | 换图/加截图、改文案、改主题、改法律文本、升级依赖、重建基线的逐步操作与回归清单             | 日常内容与设计维护                 |

建议阅读路径：

- **第一次接触**：本文 → [01 整体架构](01-architecture.md) → [02 模块职责](02-modules.md) → [05 运行与部署](05-run-and-deploy.md)。
- **准备改代码**：[03 关键代码说明](03-key-code.md) → [04 依赖关系](04-dependencies.md) → [06 维护指南](06-maintenance.md)。
- **只改文案/图片**：[06 维护指南](06-maintenance.md) 的任务清单。
- **查设计依据**：[docs/adr/](../docs/adr/README.md) 与 [docs/design-system/tokens.md](../docs/design-system/tokens.md)。

---

## 3. 目录结构

```text
garden-website/
├── src/
│   ├── assets/
│   │   ├── brand/app-icon.png          # 图标源文件，供 generate-icons 派生
│   │   ├── screenshots/                # screenshot-01.jpg … 22.jpg（1284×2778）
│   │   └── architecture/               # flow-01.png … flow-10.png（1600×1240）
│   ├── components/
│   │   ├── chrome/                     # SiteHeader、MobileNav、SiteFooter、ToTop
│   │   ├── home/                       # Hero、FactBand、Intro、Showcase、Architecture、System、FAQ、About
│   │   ├── seo/Seo.astro               # meta、OG、canonical、JSON-LD
│   │   └── ui/                         # Icon、ThemeToggle、Lightbox
│   ├── content/legal/                  # privacy.md、agreement.md（内容集合）
│   ├── data/                           # site / home / screenshots / architecture / faq / types
│   ├── design/tokens.ts                # 设计令牌唯一事实源
│   ├── layouts/                        # BaseLayout、LegalLayout
│   ├── lib/                            # theme、theme-init、analytics、format、schema
│   ├── pages/                          # index、[slug]、404、site.webmanifest
│   ├── scripts/                        # app、carousel、header、mobile-nav、lightbox、reveal、legal-toc
│   ├── styles/                         # 令牌生成物 + 七个手写样式层
│   ├── content.config.ts               # 法律内容集合 schema
│   └── env.d.ts / types/global.d.ts    # Astro 客户端类型与全局标记
├── public/                             # 原样拷贝：favicon 派生、备案徽标、robots、AASA
├── scripts/                            # 令牌、图标、对比度、发布同步、独立巡检
├── tests/
│   ├── unit/                           # Vitest：轮播算法、主题、数据契约
│   └── e2e/                            # Playwright：首页、移动端、a11y、减弱动效、视觉基线
├── docs/
│   ├── adr/                            # 11 篇架构决策记录
│   ├── design-system/                  # 令牌规范与对比度报告
│   ├── acceptance/                     # 验收报告、覆盖矩阵、独立复核
│   └── operations/                     # 部署、回滚、已知问题
├── dist/                               # Astro 构建产物（不入库）
├── _astro/ icons/ og/ beian/ .well-known/  # 同步到仓库根的产物（入库）
├── .release-manifest.json              # 发布同步清单（371 个文件）
├── astro.config.mjs                    # Astro 配置
├── package.json                        # 脚本与锁定版本依赖
└── wiki/                               # 本 Code Wiki（v2 现行文档 + archive-v1 历史归档）
```

> 根目录的 `index.html`、`privacy.html`、`agreement.html`、`404.html`、`_astro/`、`icons/`、`og/`、`beian/`、`.well-known/` 都是**构建产物**，请勿手改；源文件在 `src/` 与 `public/`。

---

## 4. 五分钟开始

```bash
# 环境要求：Node.js ≥ 24
npm ci                # 严格按 lockfile 安装
npm run dev           # 先生成令牌，再启动 Astro 开发服务器（http://localhost:4321）
```

生产构建与预览：

```bash
npm run build         # 生成令牌与图标 → Astro 构建 → dist/
npm run preview       # 本地预览 dist/
```

构建会自动完成两件事：

1. [scripts/generate-tokens.mjs](../scripts/generate-tokens.mjs) 读取 `src/design/tokens.ts`，生成 `src/styles/tokens.generated.css`；
2. [scripts/generate-icons.mjs](../scripts/generate-icons.mjs) 由 `src/assets/brand/app-icon.png` 生成 favicon、PWA 图标与 1200×630 OG 分享图。

本地验收至少确认：

1. 首页七个内容区块（intro / features / screenshots / architecture / system / faq / about）齐备，导航锚点可跳转；
2. 截图轮播显示 `01 / 22`，箭头、缩略图、方向键、Home/End 与滑动都能切换；
3. 「查看大图」灯箱可打开、左右切换、Esc 关闭并把焦点还给触发按钮；
4. 浅色 / 深色 / 跟随系统切换即时生效，刷新后保持；
5. 隐私政策目录与正文标题锚点一致，两个法律页可互相往返；
6. 窄屏（≤1024px）使用抽屉导航，页面无横向溢出。

完整验收命令与门禁说明见 [05 · 运行与部署](05-run-and-deploy.md)。

---

## 5. 核心概念与术语

| 术语             | 含义                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| 构建期 / 运行期  | 构建期指 `astro build` 生成 HTML 与资源；运行期指浏览器加载静态文件后执行的小型脚本          |
| 单一事实源       | 同一信息只在一处定义：站点常量在 `src/data/site.ts`，设计令牌在 `src/design/tokens.ts`      |
| 设计令牌         | 原始色 → 语义色两层命名，组件只消费 CSS 变量，由 `check:tokens` 拦截硬编码颜色                |
| 内容集合         | `src/content/legal/*.md`，由 `src/content.config.ts` 的 zod schema 校验，构建期渲染为法律页    |
| DOM 契约         | 组件输出 `data-carousel-*`、`data-lightbox-*`、`data-theme-toggle` 等属性，脚本按属性增强       |
| 门禁（gate）     | `npm run verify` 串联的自动检查；任一失败即阻塞发布                                                    |
| 发布同步         | `sync-root.mjs` 把 `dist/` 复制到仓库根，使「根目录托管」与「构建型托管」都能正常服务          |
| 本地埋点         | `track()` 只把事件写入 `window.__gardenEvents` 并派发 `garden:event`，不发网络请求              |

---

## 6. 重要边界说明

- **本仓库不包含 iOS 应用源码**。页面中的「12 大服务中枢」「三级缓存」等是应用架构的介绍文案与配图，本站不实现这些逻辑。
- **无后端、无数据库、无账号体系**。所有页面在构建期生成，运行时不请求任何 API。
- **无第三方运行时请求**。字体由 npm 包随构建打包，页面不加载远程字体、统计、客服或广告脚本；仅在用户主动点击备案外链时离开本站。
- **唯一的浏览器持久化是主题偏好**。`localStorage['garden:theme']` 记录 `light` / `dark`，选择「跟随系统」时删除该项；无 Cookie、无身份信息。
- **根目录 HTML 是产物**。任何页面改动都应修改 `src/`，再执行 `npm run build` 与 `npm run release`，不要直接编辑根目录文件。
- **文档与代码同步责任**：修改页面结构、数据数量、断点、脚本行为或发布流程后，需同步更新本 Wiki 对应章节与 `docs/` 下的规范文档。
