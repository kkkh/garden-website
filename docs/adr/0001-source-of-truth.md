# ADR-0001：事实源、重构范围与仓库归属

- 状态：已采纳
- 日期：2026-10-23
- 决策者：技术负责人（自主决策）

## 背景

任务输入给出的仓库地址是 `https://github.com/kkkh/garden`，而当前工作目录的 remote 是 `https://github.com/kkkh/garden-website.git`。
两者都真实存在，但内容不同，需要先确认以哪个为准，否则重构可能把最新的线上内容回退成旧版本。

## 调查证据

| 项 | `kkkh/garden` | `kkkh/garden-website`（当前目录） |
| --- | --- | --- |
| HEAD | `5ecb801`（2026-09-27） | `26a3c68`（2026-10-23） |
| 提交数 | 1 | 4 |
| 截图 | 11 张 | 22 张 |
| 首页要点 | 联系电话、旧版权文案、无 22 张轮播增强 | 22 张截图、预加载、aria 增强、备案行改版 |
| 独有文件 | `.well-known/apple-app-site-association`、`LICENSE`、`README.md`、`assets/qinchao.txt` | `.gitignore`、`wiki/`、`.trae-html-share-packages/` |

同时抓取线上 `https://jl.43322.cn`：

```
index.html   31864 B  ← 与 garden-website/index.html 逐字节一致（diff 为空）
styles.css   24490 B  ← 与 garden-website/styles.css 逐字节一致
```

线上响应头 `Server: edgeone makers`，说明当前线上托管在腾讯云 EdgeOne Makers，而非 GitHub Pages；仓库内没有部署配置，平台配置不可得。

## 决策

1. **以当前工作目录 `garden-website` + 线上抓取结果作为唯一事实源**；
2. `kkkh/garden` 仅作为补充素材来源，导入两样内容：
   - `.well-known/apple-app-site-association`（Universal Links 配置，线上域名可达，属于真实功能，必须保留）；
   - `LICENSE`（MIT，作者：秦超）；
3. 不修改、不推送 `kkkh/garden`；
4. 不执行生产部署（缺少平台凭据，且属于协议中「生产部署」需暂停的范畴），只交付构建产物与部署/回滚文档。

## 理由

- 线上站点是用户可见的唯一事实，与 `garden-website` 完全一致，说明它就是线上源；
- 若按 `garden` 重构，会丢失 22 张截图、aria 增强与备案改版，属于功能回退；
- AASA 文件在 `garden` 中存在而在 `garden-website` 中缺失，意味着当前线上可能不具备 Universal Links 能力；导入它是「补齐既有能力」，不是新增需求。

## 替代方案

| 方案 | 为什么不选 |
| --- | --- |
| 以 `garden` 为事实源 | 内容更旧，会回退用户可见功能 |
| 合并两个仓库后再重构 | 需要处理历史分叉与作者意图，超出本轮范围，且会引入不确定的冲突解决 |
| 只改 `garden` 不动当前仓库 | 与线上内容不符，无法验证 |

## 风险与回滚

| 风险 | 说明 | 回滚 |
| --- | --- | --- |
| AASA 的 appID 与线上真实 App 不一致 | 文件中为 `F2JL9NGNLCC.com.qinchao`，来自 `garden` 仓库，无法在本地验证真伪 | 若发现无效，删除 `public/.well-known/apple-app-site-association` 并重新部署即可，无其他依赖 |
| 误认事实源 | 已通过字节级 diff 验证，可复查 | `git revert` 对应提交 |

## 验证方式

```bash
# 仓库内容差异（本地复现）
git ls-remote https://github.com/kkkh/garden.git
curl -sL https://jl.43322.cn -o /tmp/live.html && diff /tmp/live.html index.html   # v1 状态下应为空
```
