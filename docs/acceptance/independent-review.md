# 独立渲染巡检报告

- 目标地址：http://127.0.0.1:4321
- 生成时间：2026-10-23T07:04:37.020Z
- 结论：19/19 项通过，0 项未通过

| 分组 | 检查项 | 结果 | 细节 |
| --- | --- | :---: | --- |
| A 首页结构 | 地标与标题唯一、含跳转链接 | ✅ | {"header":1,"main":1,"footer":1,"h1":1,"skipLink":true,"lang":"zh-CN"} |
| A 首页结构 | 七个内容区块齐备 | ✅ | intro, features, screenshots, architecture, system, faq, about |
| A 首页结构 | SEO 元信息与三类结构化数据 | ✅ | {"canonical":"https://jl.43322.cn/","description":"园枢是一款面向山西晋中理工学院师生、考生与家长的校园信息聚合应用，聚合学校官网新闻、通知公告、院系专业、招生资讯、校园风光等内容，支持收藏、搜索、个性化阅读与本地通知提醒。","ogImage":"https://jl.43322.cn/og/og-default.png","manifest":"/site.webmanifest","jsonLd":["WebSite","MobileApplication","FAQPage"],"favicon":2} |
| A 首屏 | 设备框未横向溢出视口 | ✅ | {"heroBox":{"x":792.03125,"y":158.90118408203125,"width":288,"height":623.09375},"heroSection":{"x":0,"y":73,"width":1440,"height":884.671875},"viewportWidth":1440} |
| B 轮播 | 初始 01 / 22，箭头序列 02>03>04>03 | ✅ | {"initial":{"index":"01","caption":"首页汇聚办学数据与院系、资讯、荣誉等高频入口，重","activeSlides":1,"thumbs":22,"currentThumbs":1},"seq":["02","03","04","03"]} |
| B 轮播 | 缩略图第 8 项联动序号/说明/高亮 | ✅ | {"index":"08","caption":"机构与文章双通道检索，支持搜索历史与快捷回填，校园信息一","selected":1,"selectedIndex":7} |
| B 轮播 | 舞台焦点下方向键切换 | ✅ | 08 -> 09 |
| C 灯箱 | 打开/切换/Esc 关闭/滚动锁定与恢复 | ✅ | {"opened":{"open":true,"count":"09 / 22","title":"应用界面","bodyLocked":true,"imageSrc":"/_astro/screenshot-09.CmIrn8mH.jpg"},"next":"10 / 22","closed":{"open":false,"unlocked":true}} |
| D 主题 | 切换生效、持久化、meta theme-color 同步 | ✅ | {"dark":{"theme":"dark","colorScheme":"dark","stored":"dark","metaTheme":"#080f1a","bodyBg":"rgb(7, 12, 20)"},"persisted":"dark","light":"light"} |
| E 导航 | 锚点跳转到平台架构并可见 | ✅ | {"hash":"#architecture","archVisible":true} |
| E FAQ | 6 条问答、第二项可展开、首项默认展开 | ✅ | {"count":6,"opened":true,"firstOpen":true} |
| F 法律页 | 9 章目录、锚点可达、日期显示 | ✅ | {"tocCount":9,"firstHref":"#一引言","headings":["一引言","二我们收集的信息","三信息的使用目的","四系统权限说明","五信息是否共享给第三方","六您的权利数据如何删除","七未成年人条款","八隐私政策的更新","九联系我们"],"metaText":"生效日期：2026年9月25日 \n\|\n\n最近更新：2026年10月23日","hasAnchorTarget":true,"inViewport":true} |
| F 法律页 | 用户协议 7 章 | ✅ | h2=7 |
| G 404 | 状态码 404 + 品牌化页面 + 出口链接 | ✅ | {"status":404,"code":"404","robots":"noindex, follow","homeLink":true} |
| H 资源 | 8 个关键静态资源全部 200 | ✅ | {"/site.webmanifest":200,"/robots.txt":200,"/sitemap-index.xml":200,"/og/og-default.png":200,"/icons/favicon-32.png":200,"/icons/apple-touch-icon.png":200,"/beian/beian.png":200,"/.well-known/apple-app-site-association":200} |
| I 移动端 | 无横向溢出、抽屉 8 项、点击后关闭并跳转、缩略图可横滑 | ✅ | {"noOverflow":true,"drawer":{"open":true,"links":8},"afterClick":{"open":false,"hash":"#architecture"},"railScrollable":true} |
| J 可访问性 | 5 次扫描（含深色）无 serious/critical 违规 | ✅ | [{"path":"/","theme":"light","blocking":[]},{"path":"/","theme":"dark","blocking":[]},{"path":"/privacy.html","theme":"light","blocking":[]},{"path":"/agreement.html","theme":"light","blocking":[]},{"path":"/definitely-not-a-page.html","theme":"light","blocking":[]}] |
| K 隐私 | 加载阶段无第三方域名请求 | ✅ | 0 个第三方请求 |
| K 运行时 | 无控制台错误与未捕获异常 | ✅ | {"consoleErrors":[],"pageErrors":[]} |

截图目录：`docs/acceptance/independent-review/`

> 说明：本脚本由独立于 `tests/e2e` 的实现编写，仅依赖构建产物与浏览器，用于交叉验证实施结果。
