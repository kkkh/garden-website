# 03 · 关键代码说明

## 0. 阅读前提

本项目是**无类、无框架、无模块系统**的静态站点。所谓「关键类与函数」在本仓库中对应：

- **组件契约**：HTML 的 class / id / `data-*` 与 CSS、JS 之间的约定；
- **样式模块**：设计令牌、组件规则、响应式覆盖；
- **函数**：首页内联 IIFE 中的闭包函数与事件处理器。

仓库没有 `.js` 独立文件，脚本全部位于 [index.html](../index.html) 第 415–503 行，运行在 IIFE 的闭包作用域中。

---

## 1. HTML 关键结构

### 1.1 轮播 DOM 契约

```text
#appCarousel [role=region]
├── .cvr-stage
│   ├── .cvr-phone
│   │   ├── img.cvr-img.active[src][alt][data-cap][fetchpriority=high]
│   │   ├── img.cvr-img[src][alt][data-cap][loading=lazy]   × 21
│   │   └── …
│   ├── button.cvr-arrow.prev[aria-label=上一张截图]
│   └── button.cvr-arrow.next[aria-label=下一张截图]
├── .cvr-meta
│   ├── .cvr-chip[aria-hidden=true] > #cvrCount / #cvrTotal
│   └── p#cvrCaption[aria-live=polite]
└── #cvrRail[role=tablist]        ← 初始为空，由脚本生成 22 个 button
```

**脚本与 CSS 依赖的硬契约**（改名即断）：

| 契约 | 被谁使用 | 用途 |
| --- | --- | --- |
| `#appCarousel .cvr-stage` | JS 第 417 行 | 脚本入口守卫；触摸监听目标 |
| `#appCarousel .cvr-img` | JS 第 419 行；CSS `.cvr-img` | DOM 顺序即展示顺序；数量即总数 |
| `.cvr-img.active` | JS 第 452 行；CSS 第 472 行 | 唯一可见幻灯片（`opacity: 1; z-index: 2`） |
| `data-cap` | JS 第 459 行 | 当前图说明文案 |
| `alt` | JS 第 433 行 | 缩略图 `aria-label` 与 `title` |
| `#cvrCount` / `#cvrTotal` | JS 第 421–422、458、465 行 | 序号 / 总数 |
| `#cvrCaption` | JS 第 423、459 行 | 说明区 |
| `#cvrRail` | JS 第 423、432、470 行 | 缩略图容器与事件委托 |
| `.cvr-thumb[data-i]` | JS 第 432–436、470–473 行 | 缩略图索引 |
| `.cvr-arrow.prev` / `.next` | JS 第 424–425、468–469 行 | 前后切换 |
| `.cvr-phone` 的 `aspect-ratio` | CSS 第 448 行 | 锁定 1284:2778，与截图一致 |

### 1.2 语义与无障碍属性

| 位置 | 属性 | 作用 |
| --- | --- | --- |
| `<html>` | `lang="zh-CN"` | 中文页面语言 |
| 轮播容器 | `role="region"`、`aria-roledescription="轮播"`、`aria-label` | 告知辅助技术这是一个轮播区域 |
| 缩略图容器 | `role="tablist"`、`aria-label` | 缩略图组 |
| 缩略图按钮 | `role="tab"`、`aria-selected`、`aria-label`、`title` | 当前项状态与完整描述 |
| 说明文字 | `aria-live="polite"` | 切换后温和播报新说明 |
| 序号胶囊 | `aria-hidden="true"` | 视觉装饰，避免重复播报 |
| 箭头 | `aria-label` | 图标按钮的可读名称 |
| 图片 | `alt` 描述具体界面；缩略图 `alt=""` | 避免同一内容被读两次 |
| 外链 | `target="_blank"` + `rel="noopener noreferrer"` | 新窗口安全打开 |

**已知缺口**：非当前幻灯片仅通过 `opacity: 0` 隐藏，未加 `aria-hidden`，读屏仍可能遍历；首页没有 `<main>` 地标；方向键处理未 `preventDefault`。这些不影响视觉功能，但属于可继续完善的无障碍项。

### 1.3 文档页结构

```text
<body>
├── header.site-header（与首页同构，链接为跨页形式）
├── main.container
│   └── div.doc-wrap
│       ├── h1（页面标题）
│       ├── p.doc-meta（生效 / 更新日期）
│       └── h2 + p + ul/ol（章节正文）
└── footer.site-footer（与首页同构）
```

文档页不使用 `<article>`，章节直接以 `h2` 平铺；样式全部来自 `.doc-wrap` 作用域。

---

## 2. CSS 设计系统

### 2.1 设计令牌（[styles.css](../styles.css) 第 7–35 行）

| 令牌 | 值 | 用途 | 引用次数 |
| --- | --- | --- | ---: |
| `--ink` | `#121B2E` | 标题与深色文字 | 14 |
| `--navy` | `#0B1322` | 深色背景（Hero、页脚、舞台） | 7 |
| `--navy-2` | `#14223E` | 深色渐变中点 | 2 |
| `--blue` | `#2C4E8C` | 正文链接 | 1 |
| `--blue-deep` | `#1F3A68` | 保留未使用 | 0 |
| `--gold` | `#B08A3E` | 主强调色、边框、图标 | 23 |
| `--gold-bright` | `#D8B96A` | 高亮金、悬停 | 6 |
| `--gold-pale` | `#EBD9A8` | 浅金、描边 | 15 |
| `--gold-soft` | `#F4ECD8` | 金色浅底 | 3 |
| `--paper` | `#F7F4EC` | 页面暖白底 | 1 |
| `--paper-deep` | `#EFEAE0` | 保留未使用 | 0 |
| `--card` | `#FFFFFF` | 卡片白底 | 7 |
| `--text` | `#252D3D` | 正文 | 3 |
| `--muted` | `#6D7585` | 次要文字 | 9 |
| `--line` | `#E4DDCC` | 暖色发丝线 | 14 |
| `--serif` | 宋体栈 | 标题、品牌、编号 | 16 |
| `--sans` | 系统无衬线栈 | 正文 | 1 |
| `--radius` | `18px` | 卡片圆角 | 8 |
| `--shadow` | `0 10px 32px rgba(18,27,46,.07)` | 常态阴影 | 6 |
| `--shadow-hover` | `0 20px 48px rgba(18,27,46,.13)` | 悬停阴影 | 4 |
| `--shadow-gold` | `0 12px 34px rgba(176,138,62,.32)` | 金色按钮阴影 | 2 |

另设 `color-scheme: light`，本站没有深色模式；页面文案中提到的深色模式属于 iOS 应用能力。

### 2.2 布局系统

| 机制 | 规则 | 效果 |
| --- | --- | --- |
| 限宽容器 | `.container { max-width: 1120px; padding: 0 28px; }` | 全站内容对齐 |
| 纵向节奏 | `.section { padding: 96px 0; }`；窄屏 68px | 区块留白 |
| 交替底色 | `.section-alt` 的 `background: var(--card)` + 上下 1px `var(--line)` 边框 | 白/暖白节奏 |
| 居中标题组 | `.section-head { max-width: 780px; margin: 0 auto 56px; }` | 统一版式 |
| 网格 | intro 2 列、features 3 列、flow 2 列、sys 2 列 | 内容密度 |
| 卡片 | 白底 + 1px 暖线 + 18px 圆角 + 常态阴影 | 统一组件语言 |
| 锚点偏移 | `[id] { scroll-margin-top: 86px; }` | 吸顶导航不遮标题 |

### 2.3 组件目录

| 组件 | 选择器根 | 关键实现 |
| --- | --- | --- |
| 吸顶导航 | `.site-header` | `position: sticky` + `backdrop-filter: blur(16px) saturate(1.4)` + 顶部 3px 金蓝渐变线 |
| 品牌 | `.brand` | 图标悬停 `rotate(-6deg) scale(1.05)` |
| 导航下划线 | `.nav-links a::after` | 宽度 0 → 100% 的金色渐变线 |
| Hero | `.hero` | 三层背景（两径向 + 一线性）、`::after` 26px 内画框 |
| 渐变标题 | `.hero h1` | 多段金色 `linear-gradient` + `background-clip: text` |
| 按钮 | `.btn-gold` / `.btn-ghost` | 胶囊、悬停上移 2px |
| 浮动图标 | `.hero-icon img` | `floaty` 6s 上下 10px |
| 介绍卡 | `.intro-card` | 左侧 3px 金线由 0 → 100% 高度 |
| 功能卡 | `.feature-card` | 悬停上移 6px；右上角装饰在悬停时显现 |
| 轮播舞台 | `.cvr-stage` | 固定高度 + 深色渐变 + 内画框 `::after` |
| 手机框 | `.cvr-phone` | `aspect-ratio: 1284/2778`、7px 深色边框、40px 圆角、多层阴影 |
| 幻灯片 | `.cvr-img` | 绝对定位叠放；`opacity 0 → 1` + `scale(1.03) → 1` |
| 箭头 | `.cvr-arrow` | 圆形毛玻璃、金色描边、悬停变金底 |
| 序号胶囊 | `.cvr-chip` | 金色渐变胶囊、宽字距 |
| 缩略图 | `.cvr-thumb` | 非激活约 58% 透明度（基础层 42%，被 22 张适配层覆盖）、金色激活边框、激活放大 1.07 |
| 架构图卡 | `.flow-card` | 图悬停 `scale(1.015)`、说明区上边框 |
| 系统卡 | `.sys-card` | 标题下金色 44px 短线、菱形项目符 |
| 关于卡 | `.about-card` | `::before` 内缩 16px 双层边框 |
| 页脚 | `.site-footer` | 墨蓝底、顶部金色渐变线、三列 flex |
| 文档卡 | `.doc-wrap` | 白卡 + 顶部墨蓝—鎏金装饰条 + 左右 62px、上下 56px 内边距 |
| 备案行 | `.copyright-meta` | flex 居中、1px 金色分隔线、徽标 20px 圆形 |

### 2.4 层叠上下文（z-index）

| 元素 | z-index | 说明 |
| --- | ---: | --- |
| `.site-header` | 100 | 始终压住页面内容 |
| `.cvr-arrow` | 5 | 压住舞台内所有内容 |
| `.cvr-stage::after` | 3 | 内画框覆盖图片但不挡箭头 |
| `.cvr-img.active` | 2 | 当前幻灯片 |
| `.hero-inner` | 1 | 高于 Hero 背景装饰 |
| 其余默认 | auto | 常规文档流 |

### 2.5 响应式断点

| 断点 | 行号 | 主要变化 |
| --- | ---: | --- |
| `min-width: 641px` | 594–610 | 缩略图改为 `repeat(11, 44px)` 网格，两行全显 |
| `max-width: 960px` | 868–878 | Hero 纵向反转居中；intro/sys/flow 单列；features 两列；舞台 640px；文档卡内边距缩小 |
| `max-width: 720px` | 881–885 | 导航改纵向、链接换行居中；锚点偏移 150px |
| `max-width: 640px` | 887–906 | 锚点 180px；Hero 与区块留白缩小；features 单列；舞台 520px；手机框 30px 圆角/5px 边框；箭头 42px；缩略图 44px；关于表键宽 92px |
| `max-width: 560px` | 962–966 | 备案行紧凑、隐藏分隔线 |
| `max-width: 380px` | 954–960 | 舞台 470px；箭头 34px 贴近边缘 |

> 两个断点顺序为 380 在 560 之前，但作用属性不重叠，当前无覆盖冲突。

### 2.6 动效清单

| 动效 | 触发 | 时长 / 曲线 |
| --- | --- | --- |
| Hero 图标浮动 | 自动循环 | 6s ease-in-out，±10px |
| 导航下划线展开 | hover | 0.28s ease |
| 按钮上移 / 阴影 | hover | 0.25s ease |
| 卡片上移 / 阴影 / 边框 | hover | 0.3s ease |
| 幻灯片淡入缩放 | 切换 | opacity 0.65s；transform 0.9s cubic-bezier(.22,.61,.36,1) |
| 缩略图状态 | hover / active | 0.25s ease |
| 锚点滚动 | 点击导航 | 原生 smooth |
| 减弱动效 | 系统设置 | 关闭主要动画/过渡、取消平滑滚动（[styles.css](../styles.css) 第 860–865 行） |

减弱动效规则覆盖：Hero 浮动、平滑滚动，以及 `.cvr-img`、`.intro-card`、`.feature-card`、`.flow-card`、`.btn`、`.brand img` 的过渡；箭头、缩略图、导航下划线等过渡仍会保留。

---

## 3. JavaScript 关键函数

### 3.1 执行模型

- 位置：`</body>` 之前（第 415–503 行），DOM 已解析完毕，因此无需 `DOMContentLoaded`。
- 形态：`(function () { … })();`，所有变量处于闭包内，不污染全局。
- 守卫：`if (!stage) return;`，没有轮播舞台的页面不受影响。
- 无自动播放：只有用户操作才会切换。

### 3.2 状态变量

| 变量 | 类型 | 初值 | 含义 |
| --- | --- | --- | --- |
| `stage` | Element | `#appCarousel .cvr-stage` | 舞台，事件与可见性判断 |
| `imgs` | Element[] | 全部 `.cvr-img` | 按 DOM 顺序的幻灯片 |
| `countEl` / `totalEl` | Element | `#cvrCount` / `#cvrTotal` | 序号显示 |
| `capEl` | Element | `#cvrCaption` | 说明文字 |
| `rail` | Element | `#cvrRail` | 缩略图容器 |
| `prevBtn` / `nextBtn` | Element | `.cvr-arrow.prev` / `.next` | 前后按钮 |
| `total` | number | `imgs.length` | 幻灯片总数（当前 22） |
| `cur` | number | `0` | 当前索引 |
| `thumbs` | Element[] | 生成后的按钮列表 | 缩略图状态同步 |
| `preloaded` | object | `{}` | 已预取 URL 集合，避免重复 |
| `startX` / `startY` | number | `0` | 触摸起点 |
| `tracking` | boolean | `false` | 是否正在跟踪单指滑动 |

### 3.3 函数与处理器

| 名称 | 位置 | 签名 | 职责 | 副作用 |
| --- | --- | --- | --- | --- |
| 缩略图构建（匿名） | 432–436 | `imgs.map(...)` | 用 `src` + `alt` 生成按钮 HTML | 写入 `rail.innerHTML`；建立 `thumbs` |
| `preloadAround(i)` | 439–448 | `(number) => void` | 预取 `i-1 / i / i+1`（环形） | 创建 `Image` 对象；写 `preloaded` |
| `go(i)` | 450–463 | `(number) => void` | 统一渲染当前帧 | 改 class、ARIA、文本、滚动位置 |
| 上一张处理器 | 468 | `click` | `go(cur - 1)` | 同 `go` |
| 下一张处理器 | 469 | `click` | `go(cur + 1)` | 同 `go` |
| 缩略图委托 | 470–473 | `click` | `e.target.closest('.cvr-thumb')` → `go(data-i)` | 同 `go` |
| 触摸开始 | 477–482 | `touchstart` | 单指时记录起点；多指取消跟踪 | 写 `tracking/startX/startY` |
| 触摸结束 | 483–492 | `touchend` | 判断横向位移并切换 | 同 `go` |
| 键盘 | 494–501 | `keydown` | 舞台可见时，左右方向键触发箭头点击 | 同 `go` |

### 3.4 `go(i)` 的执行步骤

> 下面的行内编号注释是文档标注，源码中没有这些注释。

```js
function go(i) {
  cur = (i + total) % total;                     // 1. 环形归一化，处理越界
  imgs.forEach(function (el, j) {                // 2. 只给当前图加 active
    el.classList.toggle('active', j === cur);
  });
  thumbs.forEach(function (el, j) {              // 3. 同步缩略图视觉与 ARIA
    var on = j === cur;
    el.classList.toggle('active', on);
    el.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  countEl.textContent = String(cur + 1).padStart(2, '0');  // 4. 01…22
  capEl.textContent = imgs[cur].getAttribute('data-cap') || '';  // 5. 说明
  preloadAround(cur);                            // 6. 预取相邻
  var t = thumbs[cur];                           // 7. 当前缩略图滚入视口
  if (t && t.scrollIntoView) {
    t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}
```

要点：

- 取模保证 `-1 → 最后一张`、`total → 第一张`；不使用 `if` 分支。
- `active` 同时决定 CSS 可见性与缩略图高亮，是唯一的状态类。
- 计数用 `padStart(2, '0')`，与 CSS 的宽字距一起形成「01 / 22」的版式。
- 说明缺失时写入空字符串，不会残留上一张文案。
- `scrollIntoView` 在窄屏单行缩略图中把当前项滚到中间；桌面两行网格下也安全。
- `go()` 不检查 `total === 0`。当前 HTML 恒有 22 张图，这是隐含不变量；若未来动态生成，需要补守卫。

### 3.5 `preloadAround(i)` 的算法

```js
[-1, 0, 1].forEach(function (offset) {
  var img = imgs[(i + offset + total) % total];
  var src = img && img.getAttribute('src');
  if (!src || preloaded[src]) return;
  preloaded[src] = true;
  var pre = new Image();
  pre.src = src;
});
```

- **环形**：首张会预取最后一张，反之亦然。
- **去重**：以 URL 为键，22 张图最多各预取一次，内存开销有界。
- **时机**：初始化预取第 1 张及左右；每次 `go()` 后预取新的左右邻。
- **目的**：切换时图片已在缓存，避免白屏；不提前下载全部 22 张，节省流量。

### 3.6 手势判定

```js
if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.35) {
  go(cur + (dx < 0 ? 1 : -1));
}
```

| 条件 | 作用 |
| --- | --- |
| `touches.length !== 1` | 多指（缩放等）不触发轮播 |
| `Math.abs(dx) > 42` | 最小横向位移，过滤轻触抖动 |
| `Math.abs(dx) > Math.abs(dy) * 1.35` | 横向占优，避免与页面纵向滚动冲突 |
| `dx < 0` → `+1` | 左滑看下一张 |

监听使用 `{ passive: true }`，不阻塞滚动；没有 `touchmove` 跟随动画，切换是「松手后一次完成」。

### 3.7 键盘处理

```js
document.addEventListener('keydown', function (e) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  var r = stage.getBoundingClientRect();
  var visible = r.top < window.innerHeight && r.bottom > 0;
  if (!visible) return;
  if (e.key === 'ArrowLeft') { prevBtn.click(); }
  if (e.key === 'ArrowRight') { nextBtn.click(); }
});
```

- 只响应左右方向键，不劫持上下键。
- 仅当舞台与视口有交集时生效，避免用户在页面上方阅读时误切换。
- 通过按钮的 `click()` 复用逻辑，不直接调 `go()`，保证行为一致。
- 未调用 `preventDefault()`；页面无输入框，实际冲突很低。

### 3.8 初始化顺序

```text
脚本执行
→ 取 DOM（stage / imgs / count / total / caption / rail / prev / next）
→ stage 不存在则 return
→ 生成缩略图，缓存 thumbs
→ 定义 preloadAround / go
→ 写入 totalEl（补零）
→ preloadAround(0)
→ 绑定箭头、缩略图、触摸、键盘
→ 等待用户输入
```

初始化不调用 `go(0)`：HTML 已把第一张标为 `active`，说明与计数也已写好，避免首屏闪烁。

---

## 4. 改动影响面速查

| 改动 | 必须同步修改 | 容易漏掉 |
| --- | --- | --- |
| 换某张截图 | 同名文件替换或新文件名 + `src`；`alt`/`data-cap` | 缩略图自动跟随；CDN 缓存可能仍旧图 |
| 增删截图 | `img` 节点；第 153 行「22 张」；`#cvrTotal` 静态值；桌面网格 11 列 | 文档中的数量描述 |
| 调整图片顺序 | 移动 `<img>` 节点顺序 | 第一个 `active` 应保持在首项 |
| 改舞台比例 | `.cvr-phone` 的 `aspect-ratio`；截图素材比例 | 各断点的舞台高度 |
| 改轮播 class/id | JS 第 417–425 行、CSS `.cvr-*`、ARIA | `#cvrRail` 生成逻辑 |
| 改主题色 | `:root` 令牌 | 硬编码的 `rgba(216,185,106,…)` 光晕/描边 |
| 改导航 | 三个 HTML 的页头；目标 section id | 文档页的 `index.html#...` 前缀 |
| 改页脚 | 三个 HTML 的页脚 | 备案徽标路径与尺寸 |
| 改断点 | `styles.css` 第 594、868、881、887、954、962 行 | `scroll-margin-top` 的 86/150/180 |
| 改文案长度 | 对应卡片高度与网格 | Hero 在 960px 下的换行 |

---

## 5. 关键代码位置索引

| 内容 | 文件 | 行号 |
| --- | --- | ---: |
| 首页 head 与 CSS 版本号 | [index.html](../index.html) | 1–10 |
| 吸顶导航 | [index.html](../index.html) | 13–30 |
| Hero | [index.html](../index.html) | 32–53 |
| 应用介绍 | [index.html](../index.html) | 55–90 |
| 功能特性 | [index.html](../index.html) | 92–145 |
| 截图轮播区块 | [index.html](../index.html) | 147–208 |
| 旧 11 张截图注释 | [index.html](../index.html) | 158–170 |
| 22 张 `cvr-img` | [index.html](../index.html) | 171–192 |
| 架构图网格 | [index.html](../index.html) | 210–303 |
| 系统与隐私 | [index.html](../index.html) | 305–349 |
| 关于我们 | [index.html](../index.html) | 351–376 |
| 页脚与备案 | [index.html](../index.html) | 378–413 |
| 轮播 IIFE | [index.html](../index.html) | 415–503 |
| 设计令牌 | [styles.css](../styles.css) | 7–35 |
| 页头样式 | [styles.css](../styles.css) | 62–133 |
| Hero 样式 | [styles.css](../styles.css) | 135–269 |
| 轮播基础样式 | [styles.css](../styles.css) | 416–573 |
| 22 张缩略图适配 | [styles.css](../styles.css) | 575–610 |
| 减弱动效 | [styles.css](../styles.css) | 860–865 |
| 响应式 | [styles.css](../styles.css) | 867–906 |
| 超窄屏断点 | [styles.css](../styles.css) | 953–966 |
| 备案样式 | [styles.css](../styles.css) | 908–951 |
| 隐私政策正文 | [privacy.html](../privacy.html) | 31–102 |
| 用户协议正文 | [agreement.html](../agreement.html) | 31–87 |
