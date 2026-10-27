// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

/**
 * 园枢官网构建配置。
 *
 * 决策（见 docs/adr/ADR-0002-build-stack.md）：
 * - 使用 Astro 作为静态站点生成器：产出仍是纯静态 HTML，交付形态不变，
 *   但获得组件复用、TypeScript 类型检查、内联脚本打包与资源优化管线。
 * - `site` 用于生成 canonical、sitemap 与 OG 绝对地址。
 * - sharp 作为图片服务，构建期生成多尺寸/多格式派生图。
 *
 * @see https://docs.astro.build/en/reference/configuration-reference/
 */
export default defineConfig({
  site: 'https://jl.43322.cn',
  trailingSlash: 'ignore',
  build: {
    format: 'file',
    // 原配置 'auto' 会把 12 KB 主样式表留作外链，Lighthouse 实测移动端因这一个阻塞请求多耗 431 ms；
    // 站点仅 3 页、样式总量小，改为全部内联以消除首屏渲染阻塞。
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      // 站点地图必须列出最终 URL：本站 build.format 为 'file'，canonical / og:url 均以 .html 结尾，
      // 而集成默认会剥掉扩展名（/privacy），两者不一致会让搜索引擎收到相互矛盾的信号。
      serialize: (item) => ({
        ...item,
        url: item.url.endsWith('/') ? item.url : `${item.url}.html`,
      }),
    }),
  ],
  markdown: {
    processor: unified({
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: { class: 'heading-anchor', ariaHidden: 'true', tabIndex: -1 },
            content: { type: 'text', value: '#' },
          },
        ],
      ],
    }),
  },
  devToolbar: { enabled: false },
});
