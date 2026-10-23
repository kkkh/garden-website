# 03 · 关键代码说明

本文件聚焦「改代码前必须知道」的实现细节：DOM 契约、关键组件与函数、轮播/灯箱状态机、主题与埋点、构建脚本算法。所有行号基于 commit `3c9d801`。

---

## 1. DOM 契约总表

组件只负责输出结构，行为脚本只按 `data-*` 查找节点。**改属性名等于改 API**。

| 契约                                   | 定义位置                            | 消费脚本                          | 作用                                              |
| -------------------------------------- | ----------------------------------- | --------------------------------- | ------------------------------------------------- |
| `data-site-header`                     | `SiteHeader.astro`                  | `header.ts`                       | 页头滚动状态容器                                  |
| `data-nav-link` / `data-nav-section`   | `SiteHeader.astro`                  | `header.ts`                       | 桌面导航项与对应区块 id                           |
| `data-nav-toggle`                      | `SiteHeader.astro`                  | `mobile-nav.ts`                   | 打开移动抽屉                                      |
| `data-mobile-nav` / `data-nav-close`   | `MobileNav.astro`                   | `mobile-nav.ts`                   | 抽屉 `<dialog>` 与关闭按钮                        |
| `data-to-top`                          | `ToTop.astro`                       | `header.ts`                       | 回到顶部按钮                                      |
| `data-theme-toggle`                    | `ThemeToggle.astro`                 | `theme.ts`                        | 三态主题按钮组                                    |
| `data-theme-value`                     | `ThemeToggle.astro`                 | `theme.ts`                        | `light` / `dark` / `system`                       |
| `data-carousel`                        | `ShowcaseSection.astro`             | `app.ts`                          | 轮播根容器                                        |
| `data-carousel-stage`                  | `ShowcaseSection.astro`             | `carousel.ts`                     | 键盘与指针区域（`tabindex="0"`）                  |
| `data-carousel-slide`                  | `ShowcaseSection.astro`             | `carousel.ts`                     | 每张幻灯片，携带 caption 与灯箱数据               |
| `data-carousel-thumb`                  | `ShowcaseSection.astro`             | `carousel.ts`                     | 缩略图按钮（roving tabindex）                     |
| `data-carousel-prev` / `-next`         | `ShowcaseSection.astro`             | `carousel.ts`                     | 前后箭头                                          |
| `data-carousel-current`                | `ShowcaseSection.astro`             | `carousel.ts`                     | 当前序号文本                                      |
| `data-carousel-caption-title` / `-body`| `ShowcaseSection.astro`             | `carousel.ts`                     | 说明标题与正文                                    |
| `data-carousel-live`                   | `ShowcaseSection.astro`             | `carousel.ts`                     | `role="status"` 读屏播报                          |
| `data-position`                        | `carousel.ts`                       | CSS                               | `active` / `before` / `after`，驱动方向感知切换    |
| `data-scroll-progress`                 | `BaseLayout.astro`                  | `header.ts`                       | 阅读进度线，写入 `scaleX`                          |
| `data-hero-tilt`                       | `HeroSection.astro`                 | `hero-tilt.ts`                    | 桌面指针微倾斜作用域                              |
| `data-carousel-expand`                 | `ShowcaseSection.astro`             | `carousel.ts` + `lightbox.ts`     | 查看大图；`sync` 会刷新其灯箱数据集               |
| `data-device-model` / `data-device-finish` | `ScreenshotCard.astro`              | 测试 / 样式                       | 固定为 `iphone-13-pro-max` / `alpine-green`      |
| `data-device-label`                    | `ShowcaseSection.astro`             | 测试                              | 可见机型标注「iPhone 13 Pro Max · 苍岭绿」        |
| `data-shot-target`                     | `IntroSection.astro`                | `app.ts`                          | 功能卡跳转到指定截图（1-based）                    |
| `data-lightbox`                        | `Lightbox.astro`                    | `lightbox.ts`                     | 全局灯箱 `<dialog>`                               |
| `data-lightbox-trigger`                | Showcase / Architecture             | `lightbox.ts`                     | 打开灯箱的触发元素                                |
| `data-lightbox-item`                   | Showcase / Architecture             | `lightbox.ts`                     | 灯箱组内的数据项（可同时是触发器）                |
| `data-lightbox-group`                  | 同上                                | `lightbox.ts`                     | 分组：`screenshots` / `architecture`              |
| `data-lightbox-index`                  | 同上                                | `lightbox.ts`                     | 组内序号（0-based）                               |
| `data-lightbox-full` / `-alt` / `-caption` | 同上                             | `lightbox.ts`                     | 大图地址、替代文本、说明                          |
| `data-lightbox-group-title`            | 同上                                | `lightbox.ts`                     | 灯箱标题                                          |
| `data-lightbox-image` / `-figure` / `-caption` / `-count` / `-title` | `Lightbox.astro` | `lightbox.ts`       | 灯箱内部节点                                      |
| `data-lightbox-prev` / `-next` / `-close` | `Lightbox.astro`                 | `lightbox.ts`                     | 灯箱控制按钮                                      |
| `data-reveal`                          | 各区块                              | `reveal.ts`                       | 滚动显现元素                                      |
| `data-legal-toc` / `data-legal-article`| `LegalLayout.astro`                 | `legal-toc.ts`                    | 目录与文章容器                                    |
| `data-track` / `data-track-*`           | 各组件                              | `analytics.ts`                    | 声明式埋点                                        |

> 行为脚本从不依赖 `.showcase__rail` 以外的视觉 class；轮播用该类定位横向滚动容器（`carousel.ts:48`）。

---

## 2. 布局与页面

### 2.1 `BaseLayout.astro`

```ts
interface Props {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: readonly Record<string, unknown>[];
  lightboxTitle?: string;
  bodyClass?: string;
}
```

职责（[BaseLayout.astro](../src/layouts/BaseLayout.astro)）：

1. `isHome = path === '/'`，`homeHref` 首页为 `''`、其他页为 `'/'`；
2. 向 `SiteHeader` 传 `navigation`、`legalNavigation` 与全部中文标签（菜单、主题、CTA 等）；
3. 在 `<head>` 以 `is:inline` 注入 `themeInitScript`，先于样式设置主题；
4. `<body id="top">`，提供 `a.skip-link[href="#main"]`、`main#main[tabindex="-1"]`；
5. 挂载 `SiteFooter`、`ToTop`、`Lightbox` 与 `app.ts` 脚本；
6. 通过默认插槽承载页面内容。

### 2.2 `Seo.astro`

核心计算（[Seo.astro:31-33](../src/components/seo/Seo.astro#L31-L33)）：

```ts
const canonical = new URL(path, site.domain).href;
const ogImage = new URL(image, site.domain).href;
const fullTitle = path === '/' ? title : `${title} · ${site.name}`;
```

输出顺序：title → description → canonical → robots（可选）→ author/keywords/theme-color → 图标与 manifest → OG → Twitter → JSON-LD。`theme-color` 输出两条 `media` 查询，分别对应浅色与深色。

### 2.3 `index.astro`

```ts
const jsonLd = [websiteSchema(), mobileApplicationSchema(), faqSchema(faqItems)];
```

组件顺序固定为 `Hero → FactBand → Intro → Showcase → Architecture → System → Faq → About`。新增/调整首页顺序只需改此文件，但需同步导航与测试。

### 2.4 `[slug].astro`：静态路径与目录锚点

```ts
export async function getStaticPaths() {
  const entries = await getCollection('legal');
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}
```

关键点（[[slug].astro](../src/pages/[slug].astro)）：

- `entry.id` 是文件名（`privacy` / `agreement`），路径固定为 `/${entry.id}.html`，保留 `.html` 后缀兼容旧链接；
- 目录标题从 `entry.body` 用 `/^##\s+(.+)$/gm` 提取，跳过 `###`；
- 用 `new GithubSlugger()` 逐个生成 id，**必须与 `rehype-slug` 的处理顺序一致**，否则 TOC 链接会指向不存在的锚点；
- `render(entry)` 返回构建期渲染的 `<Content />`。

### 2.5 `LegalLayout.astro`

- 生成 `websiteSchema()` + `breadcrumbSchema([首页, 当前文档])`；
- 日期以中文格式展示（`formatDate`），同时以 ISO 日期写入 `article:published_time` / `modified_time`；
- 目录在左、文章在右；文章底部提供「另一份法律文档」与「返回首页」；
- 联系文案根据标题是否包含「隐私」自动选择「政策 / 协议」。

### 2.6 `404.astro` 与 manifest

- 404 使用 `BaseLayout` 且 `noindex`，出口为 `/`、`/#screenshots`、`/#architecture`、`/privacy.html`；
- `site.webmanifest.ts` 导出 `GET: APIRoute`，`display: standalone`，主题色取 `site.themeColor` / `metaColors`，图标路径直接引用 `assets` 常量，避免与 `generate-icons.mjs` 产物脱节。

---

## 3. 主题系统

### 3.1 模块与存储

| 名称                | 值 / 类型                                                |
| ------------------- | -------------------------------------------------------- |
| 存储键              | `garden:theme`（`THEME_STORAGE_KEY`）                     |
| 偏好                | `'light' \| 'dark' \| 'system'`                          |
| 解析结果            | `'light' \| 'dark'`                                      |
| 根节点属性          | `html[data-theme]`、`html[data-theme-preference]`         |
| 同步写入            | `html.style.colorScheme`、`meta[name="theme-color"]`      |

### 3.2 函数（[theme.ts](../src/lib/theme.ts)）

| 函数                                            | 行为                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `isThemePreference(value)`                      | 类型守卫，仅接受三个合法值                                                                             |
| `readThemePreference()`                         | 读 localStorage；无 `localStorage`、非法值或异常时返回 `'system'`                                      |
| `resolveTheme(preference)`                      | `system` 时读 `matchMedia('(prefers-color-scheme: dark)')`；无 `matchMedia` 时按浅色                    |
| `applyTheme(preference)`                        | 写 `data-theme` / `data-theme-preference` / `colorScheme`，更新 meta 主题色，返回解析后的主题           |
| `writeThemePreference(preference)`              | `system` 删除键，其余写入；存储异常静默                                               |
| `initThemeToggle(onChange)`                     | 绑定 `[data-theme-toggle]` 的点击与系统主题变化；同步 `aria-pressed`；返回解绑函数                     |

`initThemeToggle` 使用事件委托：点击后从 `closest('button[data-theme-value]')` 取偏好，避免为每个按钮单独绑定。系统主题变化只有在偏好为 `system` 时才重新应用。

### 3.3 首屏内联脚本（[theme-init.ts](../src/lib/theme-init.ts)）

`themeInitScript` 是一段自执行字符串，逻辑等价于：

```js
var stored = localStorage.getItem('garden:theme');
var prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
var resolved = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
root.dataset.theme = resolved;
root.dataset.themePreference = stored === 'light' || stored === 'dark' ? stored : 'system';
root.style.colorScheme = resolved;
document.documentElement.classList.add('js');
```

它必须用 `is:inline` 注入（不能被打包延迟执行），否则会先渲染浅色再切深色。任何异常都被捕获，回退到 CSS 的 `prefers-color-scheme` 媒体查询（生成物中对 `:root:not([data-theme])` 有独立深色块）。

---

## 4. 本地埋点

### 4.1 `track(name, payload)`

（[analytics.ts:32-44](../src/lib/analytics.ts#L32-L44)）

```ts
export function track(name: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
  if (typeof document === 'undefined') return;
  const detail = { name, payload, time: Date.now() };
  if (typeof window !== 'undefined') {
    const buffer = (window.__gardenEvents ??= []);
    buffer.push(detail);
    if (buffer.length > MAX_BUFFER) buffer.shift();
  }
  document.dispatchEvent(new CustomEvent('garden:event', { detail }));
}
```

- `MAX_BUFFER = 200`，超出后丢弃最早一条；
- 不发送网络请求，仅内存与 DOM 事件；
- 测试可直接读取 `window.__gardenEvents` 或监听 `garden:event`。

### 4.2 `initAnalytics()`

在 `document` 上以捕获阶段监听点击：

1. `closest('[data-track]')` 找到声明元素；
2. 读取 `data-track` 作为事件名；
3. 遍历 `dataset`，把 `trackXxx` 转为 `xxx` 小写键（如 `data-track-label` → `label`）；
4. 若目标是 `target="_blank"` 的锚点，附加 `href`；
5. 调用 `track(name, payload)`。

### 4.3 当前事件清单

| 事件名               | 触发位置                                                                 | 状态     |
| -------------------- | ------------------------------------------------------------------------ | -------- |
| `nav:click`          | 页头、抽屉、页脚、法律页导航、404 出口                                   | 已接入   |
| `cta:click`          | Hero 两个 CTA、页头「查看界面」、功能卡「查看相关界面」                   | 已接入   |
| `showcase:change`    | 轮播切换（箭头/缩略图/键盘/滑动/程序）                                   | 已接入   |
| `showcase:expand`    | 架构图卡片「查看大图」                                                   | 已接入   |
| `lightbox:navigate`  | 灯箱左右切换                                                             | 已接入   |
| `outbound:click`     | 邮件、ICP、公安备案外链                                                  | 已接入   |
| `theme:change`       | 类型已声明，当前主题切换通过 `garden:theme-change` 自定义事件通知，未调用 `track` | 保留 |
| `legal:toc-click`    | 类型已声明，当前目录点击未埋点                                           | 保留     |

> 主题切换在 `app.ts` 中派发 `garden:theme-change`（`detail: { preference, resolved }`），不是 `garden:event`。

---

## 5. 结构化数据（[schema.ts](../src/lib/schema.ts)）

| 函数                                | 输出类型            | 关键字段                                                                                     |
| ----------------------------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `websiteSchema()`                   | `WebSite`           | `name`、`alternateName`、`url`、`inLanguage`、`description`、`publisher`（Person + email）    |
| `mobileApplicationSchema()`         | `MobileApplication` | `applicationCategory: EducationApplication`、`operatingSystem: iOS 26.0+`、免费、`PreOrder`、6 项 `featureList` |
| `breadcrumbSchema(items)`           | `BreadcrumbList`    | `position` 从 1 递增，`item` 为绝对 URL                                                       |
| `faqSchema(items)`                  | `FAQPage`           | 每项 `Question` + `acceptedAnswer`，与页面 FAQ 同源                                           |

所有 URL 通过 `new URL(path, site.domain)` 生成绝对地址，避免结构化数据校验失败。

---

## 6. 截图轮播

### 6.1 纯函数（[carousel.ts:10-24](../src/scripts/carousel.ts#L10-L24)）

```ts
export function wrapIndex(index: number, total: number): number {
  if (!Number.isFinite(index) || total <= 0) return 0;
  return ((Math.trunc(index) % total) + total) % total;
}

export function formatIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export function isHorizontalSwipe({ dx, dy, threshold = 48, ratio = 1.2 }: SwipeGesture): boolean {
  return Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * ratio;
}
```

- `wrapIndex` 处理负数与越界，非法输入回退 0；
- `formatIndex` 输出 `01`…`22`，超过 99 自然变三位；
- `isHorizontalSwipe` 同时要求「超过 48px」与「横向位移大于纵向 1.2 倍」，避免斜向误触。

### 6.2 `ScreenshotCarousel`

```ts
export class ScreenshotCarousel {
  constructor(root: HTMLElement);
  init(): void;
  go(index: number, source: 'arrow' | 'thumbnail' | 'keyboard' | 'swipe' | 'init' | 'programmatic'): void;
  next(): void;
  prev(): void;
  private sync(index: number, source: string): void;
  private preloadAround(index: number): void;
  private scrollThumbIntoView(index: number): void;
  private bind(): void;
}
```

**构造**（`carousel.ts:69-78`）：

- `collect(root)` 一次性缓存舞台、幻灯片、缩略图、计数、说明、读屏区、箭头、展开按钮；
- 缺 `[data-carousel-stage]` 或幻灯片为 0 时抛错，由 `app.ts` 捕获兜底；
- 记录 `prefers-reduced-motion`，决定缩略图滚动是否平滑。

**`init()`**：绑定事件 → `sync(current, 'init')` → 预加载当前左右各一张。

**`go(index, source)`**：

1. `wrapIndex` 归一化；
2. `sync` 更新所有视觉与 ARIA 状态；
3. `preloadAround`；
4. `track('showcase:change', { index, total, source })`。

**`sync`**（`carousel.ts:110-153`）负责：

- 幻灯片 `data-active` 与 `aria-hidden`；
- 缩略图 `aria-current` 与 `tabIndex`（当前项 0，其余 -1）；
- 计数 `01`；
- 说明标题/正文；
- 读屏播报 `第 n 张，共 22 张：…`；
- 把当前幻灯片的灯箱数据同步到「查看大图」按钮；
- 非初始化时调用 `scrollThumbIntoView`。

**预加载**：对 `index - 1 / index / index + 1` 的图片 `currentSrc || src` 建立 `Image`，用 `Set` 去重。

**缩略图居中**：计算缩略图相对轨道的偏移，减去可视宽度的一半，再夹在 `[0, scrollWidth - clientWidth]`；减弱动效时 `behavior: 'auto'`。

**事件绑定**：

| 事件                              | 行为                                                                    |
| --------------------------------- | ----------------------------------------------------------------------- |
| 箭头 click                        | `prev()` / `next()`，来源 `arrow`                                       |
| 缩略图 click                      | `go(i, 'thumbnail')`                                                    |
| 缩略图 keydown                    | ←/→/Home/End 切换并把焦点移到目标缩略图                                 |
| 舞台 keydown                      | ←/→/Home/End 切换；若事件来自按钮/链接则忽略                            |
| 舞台 pointerdown                  | 记录起点并尝试 `setPointerCapture`                                      |
| 舞台 pointerup                    | 释放捕获；`isHorizontalSwipe` 通过则按方向切换，来源 `swipe`            |
| 舞台 dragstart                    | `preventDefault()`，防止原生拖拽中断 pointer 序列                       |
| 舞台 pointercancel               | 清空起点                                                                |

### 6.3 与功能卡的联动（[app.ts:30-40](../src/scripts/app.ts#L30-L40)）

```ts
function bindShotTargets(): void {
  document.addEventListener('click', (event) => {
    const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-shot-target]');
    if (!trigger) return;
    const target = Number(trigger.dataset.shotTarget ?? '');
    if (!Number.isFinite(target) || target < 1) return;
    carousel?.go(target - 1, 'programmatic');
  });
}
```

功能卡链接同时是 `#screenshots` 锚点：浏览器先滚动，委托监听再切换幻灯片；目标为 1-based，内部转 0-based。

---

## 7. 灯箱

### 7.1 数据读取

`readItems(group)`（[lightbox.ts:10-22](../src/scripts/lightbox.ts#L10-L22)）查询：

```ts
[data-lightbox-item][data-lightbox-group="${group}"]
```

映射为 `{ index, full, alt, caption }`，过滤空 `full`，按 `index` 升序。截图组包含舞台幻灯片（`data-lightbox-full` 等）与一组隐藏的 `span[data-lightbox-item]`；架构图组的每个卡片按钮同时是触发器与数据项。

### 7.2 类行为

| 方法                 | 行为                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `init()`             | 全局点击委托打开；绑定关闭/前后/键盘/背景点击；`close` 清理 `src`、`alt`、焦点与 `body.is-locked`；监听图片 load/error |
| `open(trigger)`      | 读取组、定位起始索引、设置组标题、`showModal()`、锁定 body、渲染                                                  |
| `navigate(delta)`    | 环形移动索引、渲染、`track('lightbox:navigate')`                                                                  |
| `render()`           | 设置 loading 态、`src/alt/caption`、`NN / MM` 计数、预加载下一张、`decode()` 失败转错误态                          |

**焦点管理**：打开时记录触发元素，关闭时 `trigger.focus()`；原生 `<dialog>` 负责 Esc 关闭与焦点陷阱。

**滚动锁定**：打开添加 `body.is-locked`，`close` 事件移除。

**索引越界**：`open` 用 `Math.max(0, Math.min(items.length - 1, findIndex))`；若找不到触发索引，回退 0。

### 7.3 与轮播的关系

轮播的「查看大图」按钮不是固定的数据项，而是每次 `sync` 时把当前幻灯片的 `data-lightbox-*` 复制到自身；因此打开灯箱时总能从当前截图开始。灯箱与轮播互不持有引用，仅通过 DOM 数据解耦。

---

## 8. 页头、抽屉、显现与目录

### 8.1 `initHeader()`（[header.ts](../src/scripts/header.ts)）

- 由 `[data-nav-link]` 的 `data-nav-section` 找到对应区块；
- `scroll` / `resize` 用 `requestAnimationFrame` 合并为一次更新；
- `window.scrollY > 8` 时设置 `header.dataset.scrolled`；`> 640` 时给回到顶部按钮加 `is-visible`；
- 活跃区块判定：区块 `getBoundingClientRect().top <= 页头高度 + 96` 的最后一个；
- 变化时只更新 `aria-current="location"`；
- 回到顶部根据 `prefers-reduced-motion` 选择 `smooth` / `auto`。

### 8.2 `initMobileNav()`（[mobile-nav.ts](../src/scripts/mobile-nav.ts)）

- `dialog.showModal()` 打开，按钮 `aria-expanded="true"`，`body.is-locked`；
- 关闭按钮与链接点击触发关闭；链接关闭延迟 0ms，让锚点先完成；
- `close` 事件恢复 `aria-expanded`、移除锁、把焦点还给触发器；
- `matchMedia('(min-width: 1024px)')` 变化时，进入桌面宽度自动关闭。

### 8.3 `initReveal()`（[reveal.ts](../src/scripts/reveal.ts)）

- 收集 `[data-reveal]`；
- 无元素、无 `IntersectionObserver` 或减弱动效时，直接加 `is-visible`；
- 正常情况创建 Observer（`rootMargin: '0px 0px -8% 0px'`、`threshold: 0.08`），进入视口后加类并 `unobserve`；
- 完成后设置 `window.__gardenRevealReady = true`，供测试等待。

### 8.4 `initLegalToc()`（[legal-toc.ts](../src/scripts/legal-toc.ts)）

- 读取文章内 `h2[id]`，重建目录 `<ol>`（内容来自构建期 Markdown，属于可信输入）；
- `IntersectionObserver`（`rootMargin: '-96px 0px -70% 0px'`）选取当前可见标题，按 `top` 排序后设置 `aria-current`；
- 无 Observer 时目录仍可点击，只是不滚动高亮。

---

## 9. 启动入口（[app.ts](../src/scripts/app.ts)）

```ts
function boot(): void {
  initAnalytics();
  initThemeToggle((preference, resolved) => {
    document.dispatchEvent(new CustomEvent('garden:theme-change', { detail: { preference, resolved } }));
  });
  initMobileNav();
  initHeader();
  initHeroTilt();
  initLightbox();
  initCarousel();
  initLegalToc();
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
```

- `initCarousel` 内部 `try/catch`：失败时把第一张设为 `data-active="true"`，并输出错误日志；
- 成功后设置 `window.__gardenCarouselReady = true`，再绑定功能卡目标；
- 初始化顺序固定：埋点最先，保证后续模块触发的 `track` 能被记录；其余模块通过 DOM 契约彼此解耦，顺序不影响功能；
- `BaseLayout` 与 `SiteHeader` 都声明了 `import '@/scripts/app'`：构建后各自生成一个只含 `import` 的包装脚本，二者指向同一个 app 模块，浏览器 ESM 只执行一次。

---

## 10. 构建与门禁脚本

### 10.1 `generate-tokens.mjs`

- 直接 `import` 同仓库的 `.ts`，依赖 Node 24 的原生 TypeScript 支持；
- `build()` 输出三段：`:root`（原始色 + 浅色语义色 + 字体/间距/圆角/阴影/动效/布局/焦点/层级/打印）、`[data-theme='dark']`（深色语义色 + 深色阴影）、`@media (prefers-color-scheme: dark)` 下的 `:root:not([data-theme])` 兜底；
- 键名转 kebab-case（`surfaceMuted` → `--color-surface-muted`）；
- `--check` 用整份字符串比对，任何手改生成物都会失败。

### 10.2 `generate-icons.mjs`

- 用 `sharp` 从 `src/assets/brand/app-icon.png` 生成 32/180/192/512 PNG；
- `favicon.svg` 内嵌 64×64 PNG 的 base64，保证与位图一致并带圆角裁切；
- OG 图以 SVG overlay + sharp 合成 1200×630：墨蓝渐变、网格、金色描边、图标、站名、副标题、`iOS 26.0+` 胶囊与域名；
- 产物入库到 `public/`，路径固定，供 manifest / `<link>` / schema 引用。

### 10.3 `sync-root.mjs`

- `SYNC_TARGETS` 白名单：4 个 HTML、`robots.txt`、`site.webmanifest`、两个 sitemap、`_astro`、`icons`、`og`、`beian`、`.well-known`；
- 同步前检查白名单条目是否都在 `dist/`；
- `--check` 逐文件比较体积、清理名单中的残留旧产物、核对 manifest 清单是否过期；
- 同步模式复制新文件、删除上次清单中已不存在的文件、写入 `{ generatedAt, count, files }`。

### 10.4 `check-tokens.mjs`

- 遍历 `src/` 下 `.css`、`.astro`、`.ts`、`.tsx`、`.js`、`.mjs`；
- 允许 `src/design/tokens.ts` 与 `src/styles/tokens.generated.css`；
- 三类正则：`#RGB`–`#RRGGBBAA`、`rgb()/rgba()`、`hsl()/hsla()`；
- 跳过整行注释（`//`、`*`、`/*`），但行尾注释中的颜色仍会被检查；
- 违规输出 `文件:行号 [类型] 值` 并退出 1。

### 10.5 `check-contrast.mjs`

- `resolveColor` 递归解析 `var(--color-x)`，循环引用或缺失原始色直接抛错；
- 33 项检查：`text` 要求 4.5:1，`large` / `nontext` 要求 3:1，`decorative` 仅记录；
- 结果写入 `docs/design-system/contrast-report.md`，同时打印未通过项；不达标退出 1。

### 10.6 `independent-review.mjs`

- 不复用 `tests/e2e` 代码，独立实现 A–K 共 11 组检查：首页结构、轮播、灯箱、主题、导航与 FAQ、法律页、404、资源、移动端、axe、隐私与网络；
- 监听控制台错误、页面异常与第三方请求；
- 输出 `docs/acceptance/independent-review.json`、同名 `.md` 与截图目录；
- 任一失败退出 1，需先 `build` 并启动 `astro preview`。

---

## 11. 测试中的关键断言

| 文件                        | 断言重点                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `tests/unit/carousel.test.ts` | `wrapIndex` 的越界/负数/NaN/小数；`formatIndex` 补零；滑动阈值与方向判定                                      |
| `tests/unit/theme.test.ts`    | 非法偏好拒绝；`system` 跟随系统；`applyTheme` 写 DOM 与 meta；存储异常不抛错                                   |
| `tests/unit/data.test.ts`     | 导航 id 唯一、备案格式、22 张截图序号连续且 alt/caption 不重复、10 张架构图、4/6/4 数量、功能卡目标范围、schema 类型 |
| `tests/e2e/home.spec.ts`      | 标题/语言/地标唯一、canonical/OG/manifest、三类 JSON-LD、轮播 4 种操作、灯箱焦点恢复、主题持久化、首屏无闪烁、FAQ、法律页、外链安全、404 |
| `tests/e2e/a11y.spec.ts`      | 四页 + 深色 axe 扫描无 serious/critical、Tab 顺序、键盘操作、触控目标 ≥ 40px、正文对比度 ≥ 4.5                    |
| `tests/e2e/mobile.spec.ts`    | 无横向溢出、<1024px 抽屉 / ≥1024px 桌面导航、缩略图滚入视野、Hero 可读                                 |
| `tests/e2e/reduced-motion.spec.ts` | `[data-reveal]` 全部可见、无循环动画、过渡 ≤ 0.0001s、`scroll-behavior: auto`                                |
| `tests/e2e/visual.spec.ts`    | 12 个页面/组件状态用例，16 组快照 × 4 个项目共 64 张基线，`maxDiffPixelRatio: 0.02`                            |

---

## 12. 修改代码时的最小检查清单

1. 新增/改名 `data-*`：同步组件、脚本、本文件契约表与 E2E；
2. 新增颜色：只改 `tokens.ts` → `npm run tokens:build` → `check:tokens` / `check:contrast`；
3. 新增交互：尊重 `prefers-reduced-motion`，补键盘路径与 ARIA 状态；
4. 新增页面：必须走 `BaseLayout`，补 SEO、JSON-LD（如适用）与 sitemap 过滤规则；
5. 改法律文本：确认 H2 数量与 TOC 断言；日期字段用 `YYYY-MM-DD`；
6. 改发布产物：同步 `sync-root.mjs` 白名单、`.release-manifest.json` 与部署文档。
