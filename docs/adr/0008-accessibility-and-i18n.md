# ADR-0008：可访问性范围与国际化取舍

- 状态：已采纳
- 日期：2026-10-23

## 背景

任务要求「手机/平板/桌面/超宽屏不破裂；键盘可操作、焦点可见、语义化标签、ARIA 正确、触控目标足够大」，
同时在业务盲区逐项中要求「国际化/RTL …… 做或不做都必须给理由」。

## 决策 A：可访问性 —— 做，并纳入门禁

| 项目 | 实现 | 验证 |
| --- | --- | --- |
| 语义化地标 | `header` / `main#main` / `footer` / `nav[aria-label]` / `section[aria-labelledby]` / `figure`+`figcaption` | E2E 结构断言 |
| 跳转链接 | `a.skip-link` → `#main`，聚焦时显示 | E2E 键盘路径断言 |
| 焦点可见 | 全局 `:focus-visible` 2px 轮廓 + `--focus-offset`，色彩对比 9.63:1 | 对比度门禁 + 视觉基线 `buttons-focus-primary` |
| 键盘完整性 | 轮播方向键/Home/End、缩略图 roving tabindex、灯箱方向键与 Esc、原生 `<dialog>` 焦点陷阱 | Playwright 键盘用例 |
| ARIA 正确性 | 修正 v1 的伪 tablist（改为 `role="group"` + `aria-current`）、灯箱 `role`/`aria-modal` 由原生 dialog 提供、`aria-live` 播报切换 | axe-core：0 serious/critical |
| 触控目标 | 头部按钮、箭头、缩略图、回到顶部均 ≥ 40×40（多为 44×44） | E2E 尺寸断言 |
| 文字对比 | 33 项语义色组合全部 ≥ AA | `check:contrast` |
| 减弱动效 | 关闭浮动动画、过渡与平滑滚动；内容直接可见 | 独立 Playwright 项目 |
| 增强对比/强制色彩 | `prefers-contrast: more` 提升边框与次要文字强度；`forced-colors` 下补边框 | 规则已写入 `base.css`（无自动化验证，见 ADR-0010） |
| 打印 | 隐藏导航/页脚/目录/交互元素，法律页适合打印 | 视觉基线可人工复核 |

### 已知取舍

- axe 的 `region` 规则被豁免：本站是长页多区块结构，若严格满足需为每个区块加 `role="region"` + 唯一标签，收益有限而语义噪声明显；
- 架构图 `alt` 为「标题 + 说明」的拼接，属于对长图的可接受替代文本；未提供更长的图文替代描述（见 `known-issues.md`）。

## 决策 B：国际化与 RTL —— 不做

**理由（逐项）**：

1. **受众单一**：站点服务对象是山西晋中理工学院的师生、考生与家长，全部为中文用户；应用本身也只有中文界面；
2. **无外部需求证据**：仓库、线上站点、任务输入中均没有多语言诉求；
3. **成本与风险**：引入 i18n 需要语言路由、内容分仓、字体栈与断点重校（RTL 会牵动整套布局与图标方向），属于「无收益的复杂度」，违反选型原则；
4. **RTL 尤其不适用**：中文无 RTL 场景，引入 `dir` 双向逻辑会为不存在的需求增加分支。

**保留的余地**：

- 页面已声明 `lang="zh-CN"`；
- 文案集中在 `src/data/**` 与内容集合中，未来若需多语言，可在此基础上增加语言维度而不必重写模板；
- 排版使用逻辑属性（`inset-inline-*`、`padding-inline`、`margin-inline`、`border-block`），已为可能的 RTL 兼容留出结构基础（但未做 RTL 视觉验证）。

## 替代方案

| 方案 | 否决理由 |
| --- | --- |
| 完整 i18n（zh/en） | 无受众需求，且需维护双语内容与校方术语一致性 |
| 浏览器自动翻译适配（仅优化翻译后布局） | 无法验证，且无明确收益 |
| 不做可访问性、仅人工检查 | 与任务要求冲突，且 v1 已有 ARIA 违规 |

## 影响

| 影响面 | 变化 |
| --- | --- |
| 页面结构 | 新增 `main`、跳转链接、区块标签、`aria-live` 状态区 |
| 样式 | 增加逻辑属性、`:focus-visible`、`prefers-contrast`、`forced-colors`、打印样式 |
| 测试 | axe 双向扫描 + 键盘用例 + 尺寸断言 + 减弱动效项目 |

## 风险与回滚

| 风险 | 缓解 | 回滚 |
| --- | --- | --- |
| 布局改用逻辑属性后个别浏览器表现异常 | 目标浏览器均为现代版本；视觉基线覆盖 4 视口 | 替换为物理属性 |
| 后续确需多语言 | 数据与文案已集中，可在 `src/data` 增加语言维度 | 无需回滚，属于增量 |

## 验证

```bash
npm run test:a11y           # axe：0 serious/critical（浅色 + 深色）
npx playwright test tests/e2e/reduced-motion.spec.ts
npx playwright test tests/e2e/a11y.spec.ts -g 触控
```
