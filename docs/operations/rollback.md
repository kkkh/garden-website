# 回滚方案与演练记录

> 目标：任何一次发布出现问题，都能在数分钟内恢复到已知可用状态。

---

## 1. 三级回滚策略

| 级别        | 场景                                          | 动作                                                                                    | 预计影响     |
| ----------- | --------------------------------------------- | --------------------------------------------------------------------------------------- | ------------ |
| L1 内容回滚 | 某个文案/图片/参数错误，但站点结构正常        | `git revert <commit>` → 重新构建发布                                                    | 一次发布周期 |
| L2 版本回滚 | v2 发布后出现结构性问题（页面 404、样式崩坏） | 平台侧把发布目录改回仓库根，重新发布 `backup/pre-refactor-v1` 分支                      | 数分钟       |
| L3 完全回退 | 需要彻底放弃 v2                               | 把 `main` 重置到 `backup/pre-refactor-v1` 的提交（保留 v2 在 `refactor/v2-astro` 分支） | 数分钟       |

**关键前提**：v1 的完整代码保存在本地与远程的 `backup/pre-refactor-v1` 分支，且包含当时的 `index.html`、`styles.css`、`privacy.html`、`agreement.html`、`assets/`、`beian/`。

---

## 2. 具体命令

### L1：回滚单次提交

```bash
git log --oneline -5                 # 找到目标提交
git revert <commit>                  # 生成反向提交（不改写历史）
npm run verify                       # 门禁必须通过
npm run build
# 发布 dist/
```

### L2：回滚到 v1 线上形态

```bash
# 1. 在本地取回 v1 内容
git fetch origin
git checkout backup/pre-refactor-v1
ls index.html styles.css privacy.html agreement.html assets beian   # 确认文件存在

# 2. 平台侧操作（需人工）
#    - 输出目录：dist → 仓库根
#    - 或直接以 backup/pre-refactor-v1 分支作为发布源
# 3. 发布后验证
curl -s -o /dev/null -w "%{http_code}\n" https://jl.43322.cn
```

### L3：完全回退 main

```bash
git checkout main
git reset --hard backup/pre-refactor-v1   # ⚠️ 破坏性：确认 v2 已在 refactor/v2-astro 分支
git push --force-with-lease origin main   # ⚠️ 需仓库管理员确认；main 分支强制推送需谨慎
```

> 注意：`git reset --hard` 与 `push --force` 属于破坏性操作，执行前必须确认 v2 分支已推送到远程，且**需要人工批准**。

---

## 3. 演练记录

**演练时间**：2026-10-23（本地执行，不涉及生产环境）
**演练对象**：`refactor/v2-astro` @ commit `379279b`
**演练目标**：验证 L1（单次提交回滚）、L2（回退到 v1 并可用）与「从零重建产物」三条路径都可执行。

### 3.1 L1 演练：revert 可用且工作树可恢复

```bash
git switch -c tmp/rollback-drill
git revert --no-commit HEAD
git diff --cached --stat | tail -3
git revert --abort
git status --short
git switch refactor/v2-astro && git branch -D tmp/rollback-drill
```

**实际输出（节选）**：

```text
213 files changed, 2296 insertions(+), 19286 deletions(-)   # revert 内容已正确暂存
（git status --short 输出为空）                              # abort 后工作树干净
已删除分支 tmp/rollback-drill（原为 379279b）。
```

**结论**：`git revert` 可正确生成反向变更；`--abort` 后工作树无残留；临时分支已清理。

### 3.2 L2 演练：v1 可取回并正常服务

```bash
git worktree add /tmp/v1-check backup/pre-refactor-v1
ls /tmp/v1-check
(cd /tmp/v1-check && python3 -m http.server 8099 &)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8099/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8099/privacy.html
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8099/styles.css
git worktree remove /tmp/v1-check --force
```

**实际输出**：

```text
准备工作区（检出 'backup/pre-refactor-v1'）
HEAD 现在位于 e1ff23f docs: archive v1 code wiki before refactor
agreement.html  assets  beian  index.html  privacy.html  styles.css  wiki
v1 root -> 200
v1 privacy -> 200
v1 css -> 200
（worktree 已移除，git worktree list 仅剩主工作树）
```

**结论**：v1 的 HTML、样式与资源均在备份分支中完整可取回，并可直接以静态服务器提供服务。
线上切回 v1 只差「平台输出目录改回仓库根」这一步人工操作。

### 3.3 从零重建产物（删除 dist 与依赖后）

```bash
rm -rf dist .astro
npm ci
npm run build
ls dist/*.html
```

**实际输出**：

```text
npm ci: OK
build: OK
dist/404.html  dist/agreement.html  dist/index.html  dist/privacy.html
```

随后用 `astro preview` 逐路由验证：

```text
/                                          200
/privacy.html                              200
/agreement.html                            200
/does-not-exist                            404
/site.webmanifest                          200
/robots.txt                                200
/sitemap-index.xml                         200
/og/og-default.png                         200
/icons/icon-192.png                        200
/.well-known/apple-app-site-association    200
```

**结论**：产物可从任意状态重建（依赖、构建缓存、产物目录全部删除后仍成功），
且全部关键路由可服务、未知路径正确返回 404。

### 3.4 未演练的部分

| 项                                                | 原因                                                 |
| ------------------------------------------------- | ---------------------------------------------------- |
| L3（`reset --hard` + `push --force` 回退 `main`） | 属于破坏性且影响远程共享分支的操作，需人工批准后执行 |
| 平台侧切换输出目录                                | 需要 EdgeOne 控制台权限                              |
| 生产环境发布与回滚                                | 同上                                                 |

---

## 4. 何时必须回滚

| 现象                        | 判定              | 动作                                           |
| --------------------------- | ----------------- | ---------------------------------------------- |
| 首页或法律页返回 404        | 发布配置错误      | L2（先改发布目录，通常无需回滚代码）           |
| 样式完全丢失或页面错乱      | 资源路径/缓存问题 | 先检查缓存头与 `_astro/` 是否上传；仍异常则 L2 |
| 轮播或导航不可用（JS 报错） | 前端缺陷          | L1（若已知具体提交）或 L2（不确定时）          |
| 备案信息或法律文本错误      | 合规问题          | L1 立即修正，并复核三处一致性                  |
| 出现安全/隐私问题           | 严重              | L2 立即回到 v1，再排查                         |

---

## 5. 单项功能回滚（v3 起）

| 场景                     | 操作                                                                                                                   | 验证                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| App Store 链接错误或下架 | 把 `src/data/appStore.ts` 的 `status` 改回 `coming-soon`，`url`/`appStoreId` 置空 → `npm run build && npm run release` | 首页无 `apps.apple.com` 外链、无 `apple-itunes-app`；`#download` 显示邮件提醒 |
| 二维码失效               | 删除 `public/qr/app-store.svg` 与对 `assets.appStoreQr` 的引用，或把 `status` 回退为 `coming-soon`                     | 下载区不出现破图                                                              |
| 更新日志内容有误         | 回退 `src/data/releases.ts` 对应条目；不要改页面组件                                                                   | 首页预览与 `/changelog.html` 同步恢复                                         |
| CSP 阻断页面功能         | 删除 `edgeone.json` 中 `Content-Security-Policy` 条目（保留其他头）→ 重新推送                                          | 两引擎巡检 0 控制台错误                                                       |
| 301 别名异常             | 删除 `edgeone.json` 的 `/changelog` 重定向                                                                             | `/changelog.html` 仍可直接访问                                                |

> HSTS 与「HTTP → HTTPS 强制跳转」由 EdgeOne 控制台下发，回滚需在控制台关闭；
> 已下发的 HSTS 在 `max-age` 到期前无法撤回，因此首次务必使用短周期。

---

## 6. 回滚后必做

```text
[ ] 确认 5 个页面 200 且内容正确
[ ] 确认备案链接可打开
[ ] 确认下载入口状态与 App Store 实际状态一致
[ ] 记录事故时间线、根因、修复提交
[ ] 在 docs/operations/known-issues.md 补充该问题（若属于新发现的缺陷类型）
[ ] 若回滚到 v1，需在部署平台把输出目录改回 dist 前，先修复根因并重新走一次发布清单
```
