# ADR-0003：设计系统 —— 两层令牌 + 生成器 + 硬编码门禁

- 状态：已采纳
- 日期：2026-10-23

## 背景

v1 的 `styles.css` 顶部有 21 个 CSS 变量，但：

- 变量与硬编码值混用：渐变、光晕、阴影里散布 `rgba(216, 185, 106, …)`、`#1B2F57`、`#0A1220` 等字面量；
- 没有语义层：`--gold` 同时用于边框、文字、背景，改一处会影响全部场景；
- 没有暗色主题（只有 `color-scheme: light`）；
- 没有可验证手段：无法证明「配色可读」，也无法阻止新代码继续硬编码。

任务要求：语义化命名、禁止组件内硬编码 hex、输出颜色表与使用规则、暗色模式独立校准、对比度至少 WCAG AA，并把「顶级/考究」落到可检查工件。

## 决策

采用**两层令牌 + 生成器 + 双重门禁**：

1. **唯一事实源**：`src/design/tokens.ts`（TypeScript）
   - 第一层「原始色」：`ink-*`、`paper-*`、`gold-*`、`jade-*`、`blue-*`、`danger-*`，只描述色相与明度；
   - 第二层「语义色」：`canvas`、`surface`、`surface-muted`、`text-primary/secondary/tertiary`、`border-subtle/strong`、`accent`、`accent-soft`、`link`、`focus`、`success`、`danger`、`hero-*`、`overlay`、`shadow-color` 等，按用途命名，浅色与深色各一套独立取值。
2. **生成物**：`scripts/generate-tokens.mjs` 输出 `src/styles/tokens.generated.css`（含 `:root`、`[data-theme='dark']`、`@media (prefers-color-scheme: dark)` 三条路径），文件头标注「禁止手改」。
3. **门禁 1（一致性）**：`node scripts/generate-tokens.mjs --check` 比对生成结果与文件，不一致即失败。
4. **门禁 2（禁止硬编码）**：`scripts/check-tokens.mjs` 扫描 `src/**` 中的所有 `.css/.astro/.ts`，除令牌文件与生成物外，禁止出现十六进制、`rgb()/rgba()`、`hsl()/hsla()`。

## 理由

- **语义层解决「改一处影响全部」**：品牌色调整只需改 `accent` 系列，不影响边框与文字；
- **生成器消除漂移**：令牌只能在一处修改，生成物与常量必然一致，CI 可验证；
- **硬编码门禁把「约定」变成「可执行规则」**：v1 的配色残留问题在新代码中不可能再出现；
- **TypeScript 而非 JSON/CSS**：令牌参与类型检查，`kebab()` 自动转 CSS 变量名，避免手误。

## 替代方案

| 方案 | 否决理由 |
| --- | --- |
| 纯 CSS 变量手写（v1 延续） | 无法防止硬编码，无法自动生成对比度报告 |
| Tailwind / 原子类框架 | 引入构建耦合与类名噪声；品牌级视觉（画框线、多层渐变、编辑排版）仍要写自定义 CSS，收益不抵复杂度 |
| Style Dictionary / 第三方令牌工具 | 对 33 个令牌而言过重；自写 100 行生成器即可完全掌控 |
| CSS-in-JS 运行时主题 | 需要客户端运行时，与静态站定位冲突 |

## 影响

| 影响面 | 变化 |
| --- | --- |
| 颜色使用 | 组件只写 `var(--color-*)`；`npm run check:tokens` 会拦截违规 |
| 新增颜色 | 必须先在 `tokens.ts` 增加原始色与语义映射 |
| 构建 | `npm run build` 前自动执行 `tokens:build`，生成物始终最新 |
| 文档 | 令牌清单与使用规则见 `docs/design-system/tokens.md` |

## 风险与回滚

| 风险 | 缓解 | 回滚 |
| --- | --- | --- |
| 生成物被误提交为「手改版本」 | `--check` 门禁会在 CI 直接失败 | 重新执行 `npm run tokens:build` |
| 令牌命名膨胀 | 两层结构 + 使用规则约束；新增前先判断能否复用 | 删除新增令牌并修正引用 |
| Node 直接运行 `.ts` 的兼容性 | 依赖 Node ≥ 22 的 `--experimental-strip-types` 行为；已在 `engines` 声明 | 若环境不兼容，可把 `tokens.ts` 改为 `tokens.mts` 或增加构建步骤（已在 `docs/operations/known-issues.md` 记录） |

## 验证

```bash
npm run tokens:build    # 生成
npm run check:tokens    # 一致性 + 硬编码扫描（0 违规）
```
