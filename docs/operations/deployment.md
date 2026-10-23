# 部署与发布

> 状态：方案已就绪；**生产部署未执行**（缺少平台凭据，属协议中需暂停的生产操作）。
> 相关决策见 `docs/adr/0007-deployment.md`。

---

## 1. 当前线上形态（v1）

| 项     | 值                                                | 证据                            |
| ------ | ------------------------------------------------- | ------------------------------- |
| 域名   | `https://jl.43322.cn`                             | 站点正文与页脚                  |
| 托管   | 腾讯云 EdgeOne Makers（静态）                     | 响应头 `Server: edgeone makers` |
| 站点根 | 仓库根目录（`index.html` 直接在根）               | v1 仓库结构                     |
| 缓存   | `Cache-Control: public,max-age=0,must-revalidate` | 抓包响应头                      |
| 备案   | 晋ICP备2023020746号 / 晋公网安备 14010602111139号 | 页脚                            |

v2 的**唯一破坏性变更**：站点根从「仓库根」改为「`dist/`」。

---

## 2. 构建

```bash
npm ci                    # 严格按 package-lock.json 安装
npm run build             # 生成 dist/
```

构建步骤（`build` 脚本内部顺序）：

1. `tokens:build` — 由 `src/design/tokens.ts` 生成 CSS 变量；
2. `icons:build` — 由应用图标生成 favicon/PNG/OG 图；
3. `astro build` — 输出静态页面、派生 AVIF/WebP/JPG 多尺寸图片、sitemap、manifest。

产物清单（`dist/`）：

```text
index.html  privacy.html  agreement.html  404.html
_astro/                 # 哈希命名的 CSS 与图片（含 avif/webp/jpg 多尺寸）
icons/                  # favicon-32.png、favicon.svg、apple-touch-icon.png、icon-192/512.png
og/og-default.png       # 1200×630 分享图
beian/beian.png
.well-known/apple-app-site-association
robots.txt  site.webmanifest  sitemap-index.xml  sitemap-0.xml
```

---

## 3. 发布步骤（需平台权限者执行）

### 3.1 EdgeOne Makers

1. 打开 EdgeOne Makers 控制台，进入 `jl.43322.cn` 对应的项目；
2. 将**构建命令**设为 `npm ci && npm run build`（若平台支持）或改为「上传已构建产物」模式；
3. 将**输出目录 / 发布目录**从仓库根改为 `dist`（关键步骤）；
4. 确认自定义域 `jl.43322.cn` 与 HTTPS 证书保持绑定；
5. 触发发布，等待状态变为成功。

### 3.2 其他静态托管（备选）

```bash
# 任意静态托管：把 dist/ 作为站点根
rsync -av --delete dist/ user@host:/var/www/jl.43322.cn/
```

或使用对象存储 + CDN：

```bash
# 示例：对象存储同步（具体命令依服务商而定）
ossutil cp -r dist/ oss://<bucket>/ --update
```

### 3.3 缓存头建议

| 路径                                                | 建议响应头                                            |
| --------------------------------------------------- | ----------------------------------------------------- |
| `/_astro/*`                                         | `Cache-Control: public, max-age=31536000, immutable`  |
| `/icons/*`、`/og/*`、`/beian/*`                     | `Cache-Control: public, max-age=86400`                |
| `/*.html`                                           | `Cache-Control: public, max-age=300, must-revalidate` |
| `/site.webmanifest`、`/robots.txt`、`/sitemap*.xml` | `Cache-Control: public, max-age=3600`                 |

v2 不再使用 `?v=` 手工版本号：CSS 与图片文件名带内容哈希，HTML 短缓存即可保证更新及时。

---

## 4. 发布后验证（必须逐项执行）

```bash
BASE=https://jl.43322.cn

# 4.1 四个页面均 200，且返回新版本特征
for p in / /privacy.html /agreement.html; do
  printf "%s -> " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE$p"
done
curl -s -o /dev/null -w "404 page -> %{http_code}\n" "$BASE/does-not-exist"

# 4.2 关键新增资源存在
for p in /site.webmanifest /robots.txt /sitemap-index.xml /og/og-default.png /icons/icon-192.png /.well-known/apple-app-site-association; do
  printf "%s -> " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "$BASE$p"
done

# 4.3 页面确实来自 v2（应包含 v2 特有标记）
curl -s "$BASE" | grep -c 'data-carousel'          # 期望 ≥ 1
curl -s "$BASE" | grep -o 'application/ld+json' | wc -l   # 期望 ≥ 3

# 4.4 缓存头抽查
curl -sI "$BASE" | grep -i cache-control
curl -sI "$BASE/site.webmanifest" | head -1
```

浏览器端人工确认：

- [ ] 首屏无主题闪烁（深色系统偏好下深色即生效）
- [ ] 22 张截图可切换，缩略图与灯箱正常
- [ ] 深浅主题切换后刷新保持
- [ ] 移动端抽屉导航可用，无横向滚动
- [ ] 页脚两个备案链接可打开
- [ ] Lighthouse / axe 复查无阻塞项

---

## 5. 回滚

见 `docs/operations/rollback.md`（含演练记录）。

---

## 6. 发布清单（可复制）

```text
[ ] npm ci 成功，Node ≥ 22
[ ] npm run verify 通过（exit 0）
[ ] dist/ 生成，含 4 个 HTML 与全部资源
[ ] 平台输出目录已改为 dist
[ ] 发布完成，4 个页面 200
[ ] 新增资源 200（manifest/robots/sitemap/og/icons/AASA）
[ ] 页面含 v2 标记（data-carousel、JSON-LD）
[ ] 缓存头符合建议
[ ] 浏览器端人工确认 6 项
[ ] 记录本次发布的 commit hash 与时间，保留上一版 dist 以便回滚
```
