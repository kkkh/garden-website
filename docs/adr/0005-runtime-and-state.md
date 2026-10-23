# ADR-0005：运行时与状态 —— 原生 TypeScript 模块，不引入前端框架

- 状态：已采纳
- 日期：2026-10-23

## 背景

v1 的全部交互是一段 89 行内联 IIFE：截图轮播（切换、缩略图、相邻预取、手势、键盘）。
它可用，但存在：无类型、无模块边界、无测试、无错误兜底、隐藏幻灯片仅靠 `opacity: 0`、缩略图使用 `role="tab"` 却没有 `tabpanel`（axe 判定为 critical 级 ARIA 违规）。

任务要求：数据流清晰、服务端/客户端状态分离、无重复逻辑、边界完整、错误边界与日志兜底、动效规范统一。

## 决策

**不引入 React/Vue/Svelte/SolidJS 等前端框架**，改为：

1. **按职责拆分的原生 TS 模块**（`src/scripts/`）：
   - `carousel.ts`：`ScreenshotCarousel` 类 + 纯函数（`wrapIndex`、`formatIndex`、`isHorizontalSwipe`）；
   - `lightbox.ts`：原生 `<dialog>` 灯箱，含加载/错误态与相邻预取；
   - `mobile-nav.ts`：原生 `<dialog>` 抽屉，带焦点回归与滚动锁定；
   - `header.ts`：滚动状态、当前区域高亮、回到顶部；
   - `reveal.ts`：`IntersectionObserver` 滚动显现，含无 IO 环境与减弱动效兜底；
   - `legal-toc.ts`：目录与当前章节高亮；
   - `app.ts`：唯一入口，按序初始化并做错误兜底。
2. **状态分层**：
   - 服务端状态 = 构建期数据（`src/data/**`、内容集合），静态输出，无请求、无缓存失效问题；
   - 客户端状态 = 逻辑单例（`carousel` 实例、主题偏好、灯箱索引），不引入全局 store。
3. **渐进增强**：关键内容在 HTML 中已就绪（第一张截图带 `data-active="true"`、说明与计数已写入），脚本失败时页面仍可阅读；`html.js` 类控制仅 JS 可用的元素（如「查看大图」按钮）。
4. **错误处理**：轮播初始化包裹 `try/catch`，失败时打印 `[garden] 轮播初始化失败` 并强制显示首图；`reveal` 在缺少 `IntersectionObserver` 或异常时直接显示全部内容。
5. **可访问性语义修正**：缩略图从「伪 tablist」改为 `role="group"` + `aria-current`（axe 通过），灯箱使用原生 `<dialog>` 获得焦点陷阱与 `Esc` 行为。

## 理由

- **收益不成立**：站点没有客户端路由、没有跨组件共享状态、没有表单，框架唯一的收益（组件复用）已由 Astro 在构建期提供；
- **成本明确**：引入框架会增加运行时体积、hydrate 边界与调试复杂度，违反「禁止无收益引入新状态库/重型 UI 库」；
- **可测试性更强**：纯函数（`wrapIndex` 等）可直接单测；交互用 Playwright 端到端验证；
- **响应更快**：交互为原生 DOM 操作，无框架调度。

## 替代方案

| 方案 | 否决理由 |
| --- | --- |
| 保留 v1 内联 IIFE | 无类型、无法单测、无法复用、错误无兜底 |
| Astro Islands + React | 仅为 1 个轮播引入框架运行时，收益不抵复杂度 |
| Alpine.js / petite-vue | 仍是额外依赖与 DSL，且类型支持弱 |
| Web Components + Shadow DOM | 会让设计令牌（全局 CSS 变量）与现有样式体系割裂，样式复用成本高 |

## 影响

| 影响面 | 变化 |
| --- | --- |
| 交付体积 | 交互脚本经 Vite 打包为单个 module（约数十 KB 级，未做体积预算） |
| 测试 | 纯函数进入 Vitest；交互进入 Playwright（含键盘、滑动、ARIA 断言） |
| 依赖 | 前端运行时无新增第三方依赖 |
| 埋点 | 自建 `track()` 事件总线，派发 `garden:event`，E2E 可断言（见 ADR-0006） |

## 风险与回滚

| 风险 | 缓解 | 回滚 |
| --- | --- | --- |
| 手写交互的边界遗漏 | 52 项功能与可访问性 E2E 覆盖轮播/灯箱/主题/导航/法律页 | 单个模块可独立回退到 `backup/pre-refactor-v1` 的等价实现 |
| 无类型框架导致重构成本高 | 模块间仅通过 DOM 契约（`data-*`）与 `app.ts` 编排交互，边界清晰 | — |
| 埋点为自建方案 | 只做本地缓冲，不发送网络请求，隐私友好 | 移除 `src/lib/analytics.ts` 引用即可 |

## 验证

```bash
npm run test:unit     # 轮播纯函数 12 项
npx playwright test tests/e2e/home.spec.ts   # 交互与 ARIA 断言
```
