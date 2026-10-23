# ADR-0012：App Store 下载入口与状态机

- 状态：已采纳
- 日期：2026-10-24

## 背景

v2 官网的定位是「即将上架 App Store」，首页没有下载入口，`MobileApplication` 结构化数据停在 `PreOrder`。
应用上架后，官网需要在不改页面结构的前提下切换为真实下载入口，并且必须避免在链接未确定时发布占位外链或伪造的商店徽章。

## 决策

1. **单一状态机**：`src/data/appStore.ts` 提供 `status: 'coming-soon' | 'live'`、`appStoreId`、`url`，
   并导出 `hasDownloadUrl()` 作为唯一判断依据。所有页面、组件、结构化数据、FAQ 都消费它。
2. **地址白名单**：仅接受 `https://apps.apple.com`（`isAllowedAppStoreUrl`）。已上架但地址非法时自动回退为未上架。
3. **降级表现**：未上架时不渲染任何 App Store 外链、二维码或 `apple-itunes-app`，改为「上架时提醒我」邮件入口与说明文案。
4. **Smart App Banner 门控**：仅当已上架且 `appStoreId` 为纯数字时输出 `apple-itunes-app`；
   Universal Links 未真机验证前不拼 `app-argument`。
5. **官方素材**：未取得 Apple 官方营销徽章前使用文字主按钮，不重绘、不伪造官方徽标；
   取得官方 SVG 后只替换 `AppStoreBadge.astro` 内部标记。
6. **二维码**：`live` 时才展示 `/qr/app-store.svg`，`soon` 时展示可见占位文本而非空 `<img>`；
   二维码旁始终提供文字链接，保证读屏与键盘用户不依赖图形。
7. **结构化数据**：`live` 时 `offers.availability` 切换为 `InStock`，补充 `offers.url`、`installUrl`、
   `softwareVersion`、`datePublished`、`privacyPolicy`；`soon` 保持 `PreOrder`。
8. **版本数据**：`src/data/releases.ts` 同时驱动首页预览与 `/changelog.html`；
   `appInfo.version` / `releaseDate` 从中派生，避免两处维护。

## 理由

- 上架时间不可控，页面结构不能围绕「已上架」硬编码；
- 外链与徽章是品牌与合规风险点，必须在数据层拦截，而不是靠人工检查；
- 纯静态站没有运行时开关，构建期状态机是最小且可验证的方案。

## 替代方案

| 方案 | 未采纳原因 |
| --- | --- |
| 上架后直接改 HTML/组件 | 容易遗漏 FAQ、结构化数据与测试，且无法回滚 |
| 引入运行时开关或 CMS | 与「纯静态、无后端」边界冲突 |
| 直接链接 App Store 搜索页 | 应用未上架时搜索结果为空，用户体验更差 |
| 第三方二维码服务 | 引入外部依赖与隐私风险 |

## 风险与回滚

| 风险 | 缓解 | 回滚 |
| --- | --- | --- |
| 链接失效或填错 | 白名单校验 + 部署后 `curl -I` 巡检 | `status` 改回 `coming-soon`，`url`/`appStoreId` 置空 |
| Smart Banner 不显示 | 使用数字 App Store ID（非 Team ID），真机 Safari 验证 | `appStoreId: null` |
| 徽章素材缺失 | 降级为文字 CTA，不使用非官方徽标 | 保持文字 CTA |
| 版本数据不实 | 未发布版本用 `upcoming` + `date: null`，不猜日期 | 回退该 release 数据 |
