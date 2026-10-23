# 部署与发布

> 当前发布策略：**推送即上线**（`git push origin main`）。
> 产物同时在 `dist/` 与仓库根目录，兼容「纯静态根目录」与「构建型平台」两种平台配置。
> 决策依据见 `docs/adr/0011-release-sync.md`（修订 ADR-0007）。

---

## 1. 线上形态

| 项          | 值                                          | 证据                             |
| ----------- | ------------------------------------------- | -------------------------------- |
| 域名        | `https://jl.43322.cn`                       | 站点正文与页脚                   |
| 仓库        | `https://github.com/kkkh/garden-website`    | `git remote -v`                  |
| 分支        | `main`（推送即触发线上更新）                | 用户确认                         |
| 托管        | 腾讯云 EdgeOne Makers（静态）               | 响应头 `Server: edgeone makers`  |
| v1 服务位置 | 仓库根目录                                  | v1 仓库结构（`index.html` 在根） |
| v2 服务位置 | 仓库根目录（同步产物）+ `dist/`（构建产物） | `scripts/sync-root.mjs`          |

---

## 2. 发布流程（三步）

```bash
# 1. 构建并把产物同步到仓库根（同时校验一致性）
npm run release

# 2. 提交（源码 + 同步后的产物）
git add -A
git commit -m "release: v2 <说明>"

# 3. 推送 main（触发线上更新）
git push origin main
```

> `npm run release` = `npm run build` + `node scripts/sync-root.mjs` + `--check` 校验。
> 如果只改源码却忘记同步，`npm run verify` 与 CI 的 `check:release` 会失败。

### 为什么需要「同步到根目录」

v1 时代平台直接从仓库根目录服务静态文件；v2 使用 Astro，产物在 `dist/`。
平台的输出目录配置无法从代码侧确认，因此采取双兼容：

| 平台配置            | 站点实际服务的内容           | 结果 |
| ------------------- | ---------------------------- | ---- |
| 纯静态，根目录      | 根目录同步产物               | ✅   |
| 构建型，输出 `dist` | 平台构建产物                 | ✅   |
| 构建型，输出根目录  | 平台构建产物（覆盖同一位置） | ✅   |
| 构建型但构建失败    | 根目录同步产物兜底           | ✅   |

---

## 3. 产物清单

`npm run release` 后，以下条目同时存在于 `dist/` 与仓库根（共 371 个文件）：

```text
index.html  privacy.html  agreement.html  404.html
_astro/                 # 哈希命名的 CSS / JS / 图片（AVIF + WebP + 原格式多尺寸）
icons/                  # favicon-32.png、favicon.svg、apple-touch-icon.png、icon-192/512.png
og/og-default.png       # 1200×630 分享图
beian/beian.png
.well-known/apple-app-site-association
robots.txt  site.webmanifest  sitemap-index.xml  sitemap-0.xml
.release-manifest.json  # 同步清单（用于清理旧产物与门禁校验）
```

---

## 4. 发布后验证（必须逐项执行）

```bash
BASE=https://jl.43322.cn

# 4.1 三个页面与 404
for p in / /privacy.html /agreement.html; do
  printf "%-16s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE$p"
done

# 4.2 确认线上是 v2（关键判据）
curl -s "$BASE" | grep -c 'data-carousel'                 # 期望 2
curl -s "$BASE" | grep -o 'application/ld+json' | wc -l    # 期望 3
curl -s "$BASE" | grep -c 'site.webmanifest'               # 期望 1（v1 没有）
curl -s "$BASE" | grep -c 'carousel'                       # v1 的实现里没有该标记类

# 4.3 新增资源
for p in /site.webmanifest /robots.txt /sitemap-index.xml /og/og-default.png /icons/icon-192.png /.well-known/apple-app-site-association; do
  printf "%-44s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE$p"
done

# 4.4 未知路径应返回品牌化 404
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/not-exist-page"

# 4.5 缓存与安全头抽查
curl -sI "$BASE" | grep -iE 'cache-control|server'
```

浏览器端人工确认：

- [ ] 首屏为墨蓝 + 鎏金 + 设备框（v2 版式），无主题闪烁
- [ ] 22 张截图可切换，缩略图与灯箱正常
- [ ] 深浅主题切换后刷新保持
- [ ] 移动端抽屉导航可用，无横向滚动
- [ ] 页脚两个备案链接可打开
- [ ] 出现「常见问题」区块（v1 没有）

---

## 5. 缓存建议（平台侧可配置项）

| 路径                                                | 建议响应头                                            |
| --------------------------------------------------- | ----------------------------------------------------- |
| `/_astro/*`                                         | `Cache-Control: public, max-age=31536000, immutable`  |
| `/icons/*`、`/og/*`、`/beian/*`                     | `Cache-Control: public, max-age=86400`                |
| `/*.html`                                           | `Cache-Control: public, max-age=300, must-revalidate` |
| `/site.webmanifest`、`/robots.txt`、`/sitemap*.xml` | `Cache-Control: public, max-age=3600`                 |

v2 不再使用 `?v=` 手工版本号：CSS 与图片文件名带内容哈希，HTML 短缓存即可保证更新及时。

---

## 6. 故障排查

| 现象              | 可能原因                                 | 处理                                                                                     |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 推送后线上仍是 v1 | 平台未监听该分支 / 部署未触发 / CDN 缓存 | 检查平台部署记录；`curl -sI` 看 `Cache-Control` 与 `Last-Modified`；必要时在平台刷新缓存 |
| 线上 404          | 根目录产物缺失                           | 本地 `npm run release` 后提交并重新推送                                                  |
| 页面无样式        | `_astro/` 未上传或被缓存                 | 检查 `/_astro/*.css` 是否 200                                                            |
| 部分图片 404      | 产物未完整同步                           | `node scripts/sync-root.mjs --check` 定位缺失文件                                        |
| 根目录产物过期    | 改了源码但没跑 `release`                 | 跑 `npm run release` 并提交；CI 的 `check:release` 也会拦截                              |

---

## 7. 发布清单（可复制）

```text
[ ] npm run verify 通过（含 check:release）
[ ] npm run release 已执行，root 与 dist 一致（371 个文件）
[ ] git status 中产物变更已一并提交
[ ] 推送 main 完成，平台部署状态为成功
[ ] 第 4 节 4.1–4.5 全部通过（尤其 4.2 的 v2 判据）
[ ] 浏览器端人工确认 6 项
[ ] 记录本次发布的 commit hash 与时间，保留上一版以便回滚
```
