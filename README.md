# 园枢 · 山西晋中理工学院校园移动应用官方网站

「园枢」是面向山西晋中理工学院师生、考生与家长的校园信息聚合 iOS 应用的官方网站。
站点为**纯静态站**：构建产物是普通 HTML/CSS/JS 与优化后的图片，可直接托管在任何静态服务器上。

- 线上地址：<https://jl.43322.cn>
- 技术栈：Astro 7（静态输出）+ TypeScript（strict）+ 原生 CSS 设计令牌体系
- 运行时依赖：无第三方脚本、无远程字体、无统计组件、无 Cookie

---

## 快速开始

```bash
# 环境要求：Node.js ≥ 24
npm ci              # 按 lockfile 安装依赖

npm run dev         # 本地开发（默认 http://localhost:4321）
npm run build       # 生产构建，输出到 dist/
npm run preview     # 预览构建产物
```

构建会自动完成两件事：

1. `scripts/generate-tokens.mjs` 由 `src/design/tokens.ts` 生成 `src/styles/tokens.generated.css`；
2. `scripts/generate-icons.mjs` 由 `src/assets/brand/app-icon.png` 生成站点图标与 OG 分享图。

---

## 质量门禁

```bash
npm run verify      # 一键执行下列全部检查
```

| 命令                         | 作用                                                               | 失败即阻塞 |
| ---------------------------- | ------------------------------------------------------------------ | :--------: |
| `npm run check:tokens`       | 校验生成令牌与 `tokens.ts` 一致，且代码中无硬编码颜色              |     ✅     |
| `npm run check:contrast`     | 33 项配色对比度检查（WCAG 2.1 AA），输出报告                       |     ✅     |
| `npm run typecheck`          | Astro + TypeScript strict 类型检查                                 |     ✅     |
| `npm run lint`               | ESLint（含 astro / typescript 规则）                               |     ✅     |
| `npm run format:check`       | Prettier 格式检查                                                  |     ✅     |
| `npm run test:unit`          | Vitest 单元测试（轮播逻辑、主题、数据契约、结构化数据）            |     ✅     |
| `npm run build`              | 生产构建                                                           |     ✅     |
| `npm run check:release`      | 校验仓库根产物与 `dist/` 一致（推送前必须通过）                    |     ✅     |
| `npx playwright test`        | E2E、可访问性（axe）、响应式、减弱动效、视觉回归                   |     ✅     |
| `npm run review:independent` | 独立实现路径的渲染巡检（需先 `npm run build` + `npm run preview`） |    建议    |
| `npm run audit`              | 依赖漏洞扫描（high 及以上）                                        |    建议    |

首次运行视觉回归前需生成基线：

```bash
npm run test:visual:update
```

---

## 目录结构

```text
.
├── src/
│   ├── assets/                 # 原始图片（参与构建优化，不直接对外）
│   │   ├── brand/app-icon.png
│   │   ├── screenshots/        # 22 张真机截图 1284×2778
│   │   └── architecture/       # 10 张平台架构图 1600×1240
│   ├── components/
│   │   ├── chrome/             # 页头、移动导航、页脚、回到顶部
│   │   ├── home/               # 首页各区块
│   │   ├── legal/              # （由 layouts/LegalLayout 承担）
│   │   ├── seo/Seo.astro       # 元信息与结构化数据
│   │   └── ui/                 # Icon、ThemeToggle、Lightbox
│   ├── content/legal/          # 隐私政策、用户协议（Markdown + 校验 schema）
│   ├── data/                   # 站点文案与内容数据（单一事实源）
│   ├── design/tokens.ts        # 设计令牌唯一事实源
│   ├── layouts/                # BaseLayout、LegalLayout
│   ├── lib/                    # 主题、埋点、日期、结构化数据
│   ├── pages/                  # 首页、[slug]（法律页）、404、manifest
│   ├── scripts/                # 前端行为：轮播、灯箱、导航、显现动画
│   ├── styles/                 # 令牌生成物、基础层、工具层、组件层
│   └── content.config.ts       # 内容集合 schema
├── public/                     # 原样拷贝到 dist 的静态资源
│   ├── .well-known/apple-app-site-association
│   ├── beian/beian.png
│   ├── icons/                  # 由脚本生成
│   ├── og/                     # 首页与各页 OG 图（og-default 由脚本生成，其余由 scripts/generate-og.mjs 生成）
│   └── robots.txt
├── scripts/                    # 构建与门禁脚本
├── tests/                      # unit / e2e / 视觉基线
├── docs/                       # ADR、设计系统、验收与回滚文档
├── wiki/                       # Code Wiki（现行版；archive-v1/ 为重构前归档）
└── reports/                    # 门禁与测试产物（不入库）
```

---

## 页面与路由

| 路由                 | 文件                                                      | 说明                                                                                                  |
| -------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/`                  | `src/pages/index.astro`                                   | 首页：Hero、概览数据、应用下载与信息、应用介绍、功能特性、截图、架构、系统与隐私、最近更新、FAQ、关于 |
| `/privacy.html`      | `src/pages/[slug].astro` + `src/content/legal/privacy.md` | 隐私政策（含目录、锚点、打印样式）                                                                    |
| `/agreement.html`    | 同上                                                      | 用户协议                                                                                              |
| `/changelog.html`    | `src/pages/changelog.astro`                               | 更新日志：由 `src/data/releases.ts` 驱动，含版本锚点与结构化数据                                      |
| `/404.html`          | `src/pages/404.astro`                                     | 品牌化 404，带返回入口                                                                                |
| `/site.webmanifest`  | `src/pages/site.webmanifest.ts`                           | Web App Manifest                                                                                      |
| `/sitemap-index.xml` | `@astrojs/sitemap`                                        | 站点地图                                                                                              |

`/changelog` 由 `edgeone.json` 301 到 `/changelog.html`。

保留 `.html` 后缀是为了与 v1 线上地址完全兼容，避免旧链接失效。

---

## 设计系统

- 令牌唯一事实源：`src/design/tokens.ts`（原始色 → 语义色两层）
- 生成物：`src/styles/tokens.generated.css`（禁止手改）
- 对比度报告：`docs/design-system/contrast-report.md`
- 令牌与组件规范：`docs/design-system/tokens.md`

约定：组件内不得出现十六进制或 `rgb()`/`hsl()` 字面量，必须使用语义令牌；`npm run check:tokens` 会拦截违规。

---

## 部署（推送即上线）

线上：`https://jl.43322.cn`，仓库 `github.com/kkkh/garden-website`，推送 `main` 即更新。

```bash
npm run release            # 构建 + 把产物同步到仓库根 + 校验一致性
git add -A && git commit -m "release: v2"
git push origin main
```

产物同时存在于 `dist/` 与仓库根目录，以兼容「纯静态根目录」与「构建型平台」两种平台配置（详见 [ADR-0011](docs/adr/0011-release-sync.md)）。

注意：改了源码但忘记同步时，`npm run verify`（含 `check:release`）与 CI 都会失败。
详细步骤、缓存建议、发布后验证与故障排查见 [部署文档](docs/operations/deployment.md)。

---

## 文档索引

| 文档                                         | 内容                                                         |
| -------------------------------------------- | ------------------------------------------------------------ |
| `docs/adr/`                                  | 架构决策记录（技术选型、设计系统、测试策略等）               |
| `docs/design-system/tokens.md`               | 令牌清单、使用规则、禁用组合                                 |
| `docs/design-system/contrast-report.md`      | 自动生成的对比度检查结果                                     |
| `docs/acceptance/coverage-matrix.md`         | 覆盖矩阵逐项结论                                             |
| `docs/acceptance/verification-report.md`     | 门禁命令、日志与验收结论                                     |
| `docs/acceptance/assumptions.md`             | 假设登记表（含无法获取的信息）                               |
| `docs/operations/deployment.md`              | 部署与缓存策略                                               |
| `docs/operations/rollback.md`                | 回滚步骤（含演练记录）                                       |
| `docs/operations/known-issues.md`            | 已知缺陷、未覆盖项与残余风险                                 |
| `docs/operations/v2-launch-retrospective.md` | v2 上线完整复盘：缺陷、验证数据、遗留风险与回滚              |
| `wiki/`                                      | 现行 Code Wiki（架构、模块、关键代码、依赖、运行部署、维护） |

---

## 许可

代码以 MIT 许可发布（见 `LICENSE`）。
页面内展示的校园资讯、截图与架构图来源于山西晋中理工学院官方网站公开信息，版权归学校所有。
