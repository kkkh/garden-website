# 回滚方案与演练记录

> 目标：任何一次发布出现问题，都能在数分钟内恢复到已知可用状态。

---

## 1. 三级回滚策略

| 级别 | 场景 | 动作 | 预计影响 |
| --- | --- | --- | --- |
| L1 内容回滚 | 某个文案/图片/参数错误，但站点结构正常 | `git revert <commit>` → 重新构建发布 | 一次发布周期 |
| L2 版本回滚 | v2 发布后出现结构性问题（页面 404、样式崩坏） | 平台侧把发布目录改回仓库根，重新发布 `backup/pre-refactor-v1` 分支 | 数分钟 |
| L3 完全回退 | 需要彻底放弃 v2 | 把 `main` 重置到 `backup/pre-refactor-v1` 的提交（保留 v2 在 `refactor/v2-astro` 分支） | 数分钟 |

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

**演练时间**：2026-10-23（本地，不涉及生产）
**演练目标**：验证 L1 与 L2 的可执行性，以及构建产物可从任一提交重建。

### 3.1 L1 演练（revert 后再前进）

```bash
# 起点：refactor/v2-astro 分支，工作树干净
git log --oneline -1
# 结果：<v2 提交> refactor: v2 站点

# 模拟一次错误提交后 revert
git revert --no-commit <v2 提交> >/dev/null 2>&1 || true
git revert --abort 2>/dev/null || true
```

实际执行时采用的等价验证（避免污染历史）：在独立临时分支上验证 `git revert` 可用性：

```bash
git checkout -b tmp/rollback-drill
git revert --no-commit <某次 v2 提交> && git status --short | head -3
git revert --abort
git checkout refactor/v2-astro && git branch -D tmp/rollback-drill
```

**结论**：revert 流程可用，工作树可干净恢复（`git status` 无残留）。

### 3.2 L2 演练（v1 可重建、可服务）

```bash
git worktree add /tmp/v1-check backup/pre-refactor-v1
ls /tmp/v1-check                       # 应看到 index.html / styles.css / assets / beian
cd /tmp/v1-check && python3 -m http.server 8099 &
curl -s -o /dev/null -w "v1 root -> %{http_code}\n" http://127.0.0.1:8099/
curl -s -o /dev/null -w "v1 privacy -> %{http_code}\n" http://127.0.0.1:8099/privacy.html
kill %1
git worktree remove /tmp/v1-check
```

**结论**：v1 可在本地完整重建并正常服务，L2 具备可执行性（线上切换只差平台目录配置）。

### 3.3 构建产物可重建性

```bash
rm -rf dist .astro
npm ci
npm run build
ls dist/*.html
```

**结论**：从干净依赖安装到产物生成可重复完成（详见 `docs/acceptance/verification-report.md` 的构建日志）。

---

## 4. 何时必须回滚

| 现象 | 判定 | 动作 |
| --- | --- | --- |
| 首页或法律页返回 404 | 发布配置错误 | L2（先改发布目录，通常无需回滚代码） |
| 样式完全丢失或页面错乱 | 资源路径/缓存问题 | 先检查缓存头与 `_astro/` 是否上传；仍异常则 L2 |
| 轮播或导航不可用（JS 报错） | 前端缺陷 | L1（若已知具体提交）或 L2（不确定时） |
| 备案信息或法律文本错误 | 合规问题 | L1 立即修正，并复核三处一致性 |
| 出现安全/隐私问题 | 严重 | L2 立即回到 v1，再排查 |

---

## 5. 回滚后必做

```text
[ ] 确认 4 个页面 200 且内容正确
[ ] 确认备案链接可打开
[ ] 记录事故时间线、根因、修复提交
[ ] 在 docs/operations/known-issues.md 补充该问题（若属于新发现的缺陷类型）
[ ] 若回滚到 v1，需在部署平台把输出目录改回 dist 前，先修复根因并重新走一次发布清单
```
