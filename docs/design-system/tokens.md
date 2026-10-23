# 设计系统规范

> 事实源：`src/design/tokens.ts` ｜ 生成物：`src/styles/tokens.generated.css`（禁止手改）
> 门禁：`npm run check:tokens`（一致性 + 禁止硬编码）、`npm run check:contrast`（WCAG 2.1）

---

## 1. 设计语言

**学院新艺术 × 编辑风**：墨蓝（ink）+ 鎏金（gold）+ 宣纸暖白（paper）。

三条原则：

1. **中性色承担主体**，品牌金只用于主操作、关键强调与细线装饰（`--color-accent` 及其派生）；
2. **结构靠线与留白表达**，而不是靠大面积色块与重阴影（发丝线 `--color-border-subtle` 为装饰性，按 WCAG 1.4.11 豁免）；
3. **动效服务于状态变化**，不做无意义的循环动画（唯一循环动画是 Hero 设备浮动，且尊重 `prefers-reduced-motion`）。

---

## 2. 颜色体系

### 2.1 两层结构

```text
原始色（primitive，只描述色相与明度）
  ink-950 … ink-100     墨蓝，深→浅 12 档
  paper-50 … paper-300  宣纸暖白，浅→深 5 档
  gold-100 … gold-800   鎏金，浅→深 8 档
  jade-300/500/600      竹青（成功态）
  blue-500/700          群青（链接、焦点）
  danger-300/500        朱丹（危险态）
  white / black

语义色（semantic，按用途命名，浅色与深色各一套独立取值）
  canvas / surface / surface-muted / surface-elevated / surface-inverse
  text-primary / text-secondary / text-tertiary / text-inverse / text-inverse-muted
  border-subtle / border-strong
  accent / accent-strong / accent-soft / accent-contrast
  link / link-hover
  focus / success / danger
  hero-surface / hero-surface-alt / hero-text / hero-text-muted / hero-line / hero-grid / hero-glow
  overlay / overlay-soft / highlight-ring / shadow-color / shadow-color-strong / gold-glow
```

### 2.2 使用规则

| 场景                         | 应使用                                       | 说明                                                           |
| ---------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| 页面底色                     | `--color-canvas`                             | 宣纸暖白 / 深墨                                                |
| 卡片、面板                   | `--color-surface`                            | 白 / 深墨一档                                                  |
| 交替区块底色                 | `--color-surface-muted`                      | 轻微区分，不加阴影                                             |
| 正文                         | `--color-text-primary`                       | 对比度 17.35:1（浅色画布）                                     |
| 次要说明、描述               | `--color-text-secondary`                     | 7.00:1 以上                                                    |
| 极小字号元信息               | `--color-text-tertiary`                      | 4.81:1，仍满足 AA                                              |
| 品牌强调文字                 | `--color-accent` / `--color-accent-strong`   | 7.23 / 7.59:1                                                  |
| 强调浅底                     | `--color-accent-soft` + `accent-strong` 文字 | 7.59:1                                                         |
| 链接                         | `--color-link`                               | 9.15:1，悬停转 `--color-link-hover`                            |
| 焦点轮廓                     | `--color-focus`                              | 9.63:1，宽 2px、偏移 3px                                       |
| 成功后/危险                  | `--color-success` / `--color-danger`         | 8.38 / 7.67:1                                                  |
| 交互组件边界                 | `--color-border-strong`                      | ≥ 3:1（WCAG 1.4.11）                                           |
| 装饰发丝线                   | `--color-border-subtle`                      | 装饰性，豁免 3:1                                               |
| 深色区块（hero、页脚、舞台） | `hero-*` 系列                                | 在 `.hero` / `.section--ink` 内自动覆盖 `accent` 为 `gold-300` |

### 2.3 禁用组合

| 禁止                                                 | 原因                                        |
| ---------------------------------------------------- | ------------------------------------------- |
| `--color-accent`（深金）直接用于 `hero-surface` 深底 | 对比不足；深底必须使用被覆盖后的 `gold-300` |
| `--color-text-tertiary` 用于正文段落                 | 仅为元信息设计，长文可读性不足              |
| `--color-border-subtle` 作为表单/交互控件边界        | 属装饰线，不保证 3:1                        |
| 组件内写 `#hex` / `rgb()` / `hsl()`                  | 会被 `check:tokens` 拦截                    |
| 用 `--color-danger` 装饰非错误内容                   | 语义污染                                    |

### 2.4 明暗主题

- 触发方式：`html[data-theme='dark']`（由 `theme-init.ts` 在首屏前写入）或 `@media (prefers-color-scheme: dark)` 且未设置 `data-theme`；
- 独立校准项（非反色）：画布/表面层级、文字三级灰阶、边框强度、强调金亮度、阴影强度与颜色；
- 偏好存储：`localStorage['garden:theme']`，仅本地，三态（light/dark/system），`system` 时删除键值。

对比度实测结果见 `docs/design-system/contrast-report.md`（33 项，0 未通过）。

---

## 3. 排版

| 项       | 令牌             | 值                                                     |
| -------- | ---------------- | ------------------------------------------------------ |
| 展示字体 | `--font-display` | Fraunces Variable（Latin，本地自托管）+ 宋体栈（中文） |
| 正文字体 | `--font-body`    | 系统无衬线栈（PingFang SC 等）                         |
| 等宽     | `--font-mono`    | 系统等宽（序号、标签、代码）                           |

字号阶梯（`--text-*`）：`2xs .6875rem` → `xs .75rem` → `sm .875rem` → `md 1rem` → `lg 1.125rem` → `xl 1.375rem` → `2xl/3xl/4xl` 为 `clamp()` 流体值 → `display`（仅备用）。

行高（`--leading-*`）：`none 1` / `tight 1.1` / `snug 1.3` / `normal 1.6` / `relaxed 1.8`。
字距（`--tracking-*`）：`tight -0.03em` / `normal 0` / `wide .08em` / `wider .16em` / `widest .24em`。
字重（`--font-weight-*`）：400 / 500 / 600 / 700 / 800。

排版约束：

- 正文最大行宽 `--line-width: 68ch`（`.legal-prose`、`.measure`）；
- 标题 `text-wrap: balance`，段落 `text-wrap: pretty`；
- 中文标题统一使用 `--font-display`，字距 `--tracking-normal`~`wide`，避免中文过宽字距。

---

## 4. 间距、栅格与容器

- **8pt 体系**：`--space-1 .25rem` 起，2/3/4/5/6/7/8/9/10/11 依次为 .5/1/1.5/2/3/4/6/8/10rem；
- **容器**：`--container-wide 1320px`、`--container 1200px`、`--container-narrow 760px`；左右留白 `--gutter clamp(1.25rem, 4vw, 2.5rem)`；
- **区块节奏**：`--section-padding clamp(4.5rem, 9vw, 8.5rem)`；`.section--muted` 用于交替底色；
- **栅格**：`.grid--2/3/4`，断点 1024px 降为 2 列、768px 降为 1 列；
- **断点**：480 / 640 / 768 / 1024 / 1280 / 1536（令牌 `breakpoints`）；实际媒体查询见各组件；
- **吸顶偏移**：`--header-height 4.5rem`，`html { scroll-padding-top }` 与 `[id] { scroll-margin-top }` 联动。

---

## 5. 组件规范

### 5.1 Button（`.button`）

| 变体     | 类名        | 用途                              |
| -------- | ----------- | --------------------------------- |
| 主操作   | `--primary` | 页面主 CTA（金色渐变 + 深色文字） |
| 次操作   | `--outline` | 与主操作并列的次级动作            |
| 深底适配 | `--on-ink`  | 墨色区块内的次要按钮              |
| 弱化     | `--ghost`   | 卡片内「查看相关界面」等          |
| 图标     | `--icon`    | 方形圆形图标按钮（≥ 44×44）       |
| 小号     | `--sm`      | 页头 CTA                          |

- **Anatomy**：`<a|button class="button …">` 内可为文字、`Icon`（`.button__icon`）或 `sr-only` 文本；
- **状态**：default / hover（上移 2px + 阴影）/ active（归位）/ focus-visible（全局轮廓）/ disabled（`opacity .55` + `not-allowed`，并支持 `aria-disabled`）；
- **可访问性**：最小高度 3rem，键盘可达，图标按钮必须有 `sr-only` 文本。

### 5.2 Card / Feature / System

- **锚点类**：`.card`、`.card--ruled`、`.feature-item`、`.system-card`、`.architecture-card`、`.about-panel`；
- **Anatomy**：可选序号/图标 → 标题（`--font-display`）→ 正文（`--text-secondary`）→ 可选操作；
- **状态**：default / hover（上移 4px + 边框转 `accent` + 阴影升级）/ 内嵌装饰线生长（`.card--ruled`）；
- **禁止**：在卡片内再嵌套卡片（层级过深），或使用非令牌色表达状态。

### 5.3 Showcase（`.showcase__*`）

轮播的 DOM 契约与状态机见 `src/scripts/carousel.ts` 与下方约定：

| 元素     | 契约                                                            | 说明                                                                    |
| -------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 舞台     | `[data-carousel-stage]` + `#screenshots-stage` + `tabindex="0"` | 键盘方向键作用域                                                        |
| 幻灯片   | `[data-carousel-slide]` + `data-active`                         | 尺寸由 `.showcase__viewport` 决定（`aspect-ratio: var(--phone-ratio)`） |
| 缩略图   | `[data-carousel-thumb]` + `aria-current` + roving `tabindex`    | `role="group"`，不是 tablist（见 ADR-0005）                             |
| 说明     | `[data-carousel-caption-title                                   | body]`                                                                  | 随切换更新，另用 `role="status"` 播报 |
| 灯箱触发 | `[data-lightbox-trigger]` + `[data-lightbox-item]`              | 分组 `screenshots` / `architecture`                                     |

### 5.4 Dialog（`.mobile-nav`、`.lightbox`）

- 使用原生 `<dialog>`：焦点陷阱、`Esc` 关闭、`::backdrop` 由浏览器提供；
- 打开时 `body.is-locked` 锁定滚动，关闭后焦点回归触发元素；
- 灯箱加载态 `is-loading`、错误态 `is-error`（`base` 与 `showcase.css` 中定义类，脚本切换）。

### 5.5 其他组件

| 组件       | 类名                                   | 关键约束                                     |
| ---------- | -------------------------------------- | -------------------------------------------- |
| Tag / Chip | `.tag`、`.tag--accent`、`.tag--on-ink` | 等宽字体、圆角胶囊，非交互                   |
| 统计带     | `.stat-strip`、`.stat`                 | 4 列 → 768px 2 列                            |
| 系统卡     | `.system-card`、`.system-list`         | 菱形项目符用 `accent`                        |
| 目录       | `.legal-toc`                           | 粘性定位，`aria-current="true"` 标记当前章节 |
| 时间线     | `.timeline`                            | 菱形节点 + 竖线                              |
| 提示       | `.notice`                              | 左侧 `accent` 竖线 + 图标                    |
| 回到顶部   | `.to-top`                              | 滚动 640px 后出现，`aria-label`              |

---

## 6. 动效规范

| 用途           | 触发          | 时长                    | 缓动              | 降级                         |
| -------------- | ------------- | ----------------------- | ----------------- | ---------------------------- |
| 按钮/链接悬停  | hover         | `--duration-fast 140ms` | `--ease-standard` | reduced-motion 关闭过渡      |
| 卡片悬停抬升   | hover         | `--duration-base 220ms` | `--ease-out`      | 同上                         |
| 卡片装饰线生长 | hover         | `--duration-slow 420ms` | `--ease-out`      | 同上                         |
| 幻灯片切换     | 状态变化      | `--duration-slow 420ms` | `--ease-out`      | 过渡时长归零，状态即时切换   |
| 灯箱出现       | `showModal()` | 浏览器原生              | —                 | 由浏览器处理                 |
| 滚动显现       | 进入视口      | `--duration-slow 420ms` | `--ease-out`      | 直接可见（`reveal.ts` 判定） |
| Hero 设备浮动  | 循环          | 9s                      | `--ease-standard` | 动画关闭                     |
| 缩略图滚动定位 | 切换后        | 平滑滚动                | —                 | 改为 `auto`                  |

规则：

1. **只动 `transform` 与 `opacity`**（外加必要的 `scroll-behavior`），避免布局抖动；
2. 微交互 140–220ms，较大过渡 420–640ms，均使用令牌而非字面量；
3. 所有动画必须在 `@media (prefers-reduced-motion: reduce)` 下关闭或降级（`base.css` 全局归零 + `reveal.ts` 直接显示）；
4. 装饰性循环动画最多一处（Hero 设备），且不承载信息；
5. 禁止：视差滚动、自动播放的轮播、超过 1s 的入场动画、闪烁/抖动效果。

---

## 7. 变更流程

1. 修改 `src/design/tokens.ts`；
2. `npm run tokens:build`（更新生成物）；
3. `npm run check:contrast`（若改动颜色，必须 0 未通过）；
4. `npm run check:tokens`（确保没有硬编码）；
5. `npm run typecheck && npm run lint && npm run format`；
6. `npm run test:visual:update` 更新视觉基线，并人工检查 diff 是否符合预期；
7. 更新本文档对应表格。
