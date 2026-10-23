# ADR-0007：部署形态与缓存策略

- 状态：已采纳（生产切换未执行，需人工在平台侧调整）
- 日期：2026-10-23

## 背景

- v1 的线上部署形态：`https://jl.43322.cn`，响应头 `Server: edgeone makers`，即腾讯云 EdgeOne Makers 静态托管；
- v1 的站点根就是**仓库根目录**（`index.html` 直接位于根）；
- 仓库内没有任何部署配置（无 CI、无 `CNAME`、无平台配置文件），平台侧配置不可通过代码复原；
- v2 使用 Astro，构建产物在 `dist/`，**站点根必须从「仓库根」改为「dist」**。

这属于协议允许暂停的「生产部署」范畴：需要平台凭据与人工操作，本轮不执行，只交付方案与验证证据。

## 决策

1. **交付形态**：`npm ci && npm run build` 产出 `dist/`，其中包含
   - `index.html`、`privacy.html`、`agreement.html`、`404.html`
   - `_astro/`（构建期派生的 CSS 与图片，含 AVIF/WebP/JPEG 多尺寸）
   - `icons/`、`og/`、`beian/`、`.well-known/`、`robots.txt`、`site.webmanifest`、`sitemap-index.xml`
2. **部署方式**：静态托管，发布目录指向 `dist/`；EdgeOne Makers 需在项目设置中把输出目录改为 `dist`（若平台支持自定义构建命令，则填 `npm ci && npm run build`）。
3. **缓存策略**：
   - `_astro/*`：内容哈希文件名，可长期缓存（`max-age=31536000, immutable`）；
   - `icons/*`、`og/*`：固定路径，建议短缓存（如 `max-age=86400`）以便更新；
   - `*.html`、`site.webmanifest`、`robots.txt`、`sitemap*.xml`：`max-age=0, must-revalidate` 或短缓存（如 300s），保证内容更新能及时生效；
   - 不再依赖 `styles.css?v=YYYYMMDD-N` 这类手工版本号（v1 的做法），哈希文件名已解决缓存失效问题。
4. **发布流程**：见 `docs/operations/deployment.md`。发布必须保留旧版本产物以便回滚。

## 理由

- 哈希文件名 + HTML 短缓存是静态站的标准组合，既保证更新及时，又让大体积图片与 CSS 长期命中缓存；
- 移除手工版本号可消除 v1 的「只有首页带 `?v=`、文档页带旧样式」问题；
- 明确「站点根变为 dist」是本次重构唯一的破坏性部署变更，必须显式记录，避免上线后 404。

## 替代方案

| 方案 | 否决理由 |
| --- | --- |
| 继续从仓库根发布 | Astro 产物不在根目录，会有两套文件冲突 |
| 保留 v1 HTML 并让 Astro 输出到根目录 | 会造成仓库根被构建产物污染（`_astro/` 等），且违反构建可重复原则 |
| 迁移到 GitHub Pages | 与现有域名/平台无关；且 EdgeOne 已在国内可访问（含备案），迁移会带来可用性与备案风险 |
| 部署到需要构建凭据的 CI | 缺少仓库 Secrets 与平台授权，本轮不可执行 |

## 影响

| 影响面 | 变化 |
| --- | --- |
| 平台配置 | **必须**把发布目录改为 `dist`（人工操作） |
| 旧文件 | v1 根目录的 `index.html`、`styles.css`、`privacy.html`、`agreement.html`、`assets/`、`beian/` 已删除（历史保存在 `backup/pre-refactor-v1` 分支） |
| URL 兼容 | 页面路径不变（`/`、`/privacy.html`、`/agreement.html`），旧链接与搜索引擎收录不受影响 |
| `.well-known` | 新增 `apple-app-site-association`，需确认平台允许发布该路径（大多数静态托管均支持） |

## 风险与回滚

| 风险 | 缓解 | 回滚 |
| --- | --- | --- |
| 平台未改发布目录 → 线上 404 | 部署清单中列为第一项检查；发布后立即验证 4 个 URL | 平台侧恢复原发布目录 + 重新发布 v1 分支（见 `docs/operations/rollback.md`） |
| `.well-known` 路径被平台屏蔽 | 发布后 `curl -I` 验证；若被屏蔽，可移除该文件，不影响站点 | 删除该文件 |
| 长缓存导致更新不可见 | HTML 采用短缓存；图片使用哈希名；变更图片会在 HTML 中引用新哈希 | 平台侧刷新缓存 |
| 首次发布体积较大（约 30 MB） | 静态站一次性上传，后续增量 | — |

## 验证

```bash
npm run build
ls dist                                   # 4 个 HTML + 资源目录
npx serve dist                            # 或 astro preview
curl -sI http://localhost:4321/privacy.html | head -1
```
