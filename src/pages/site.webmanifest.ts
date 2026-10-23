import type { APIRoute } from 'astro';
import { assets, site } from '@/data/site';
import { metaColors } from '@/design/tokens';

/**
 * Web App Manifest。
 * 以静态端点形式生成，保证图标路径与 `scripts/generate-icons.mjs` 的产物一致。
 */
export const GET: APIRoute = () => {
  const manifest = {
    name: `${site.name} · ${site.shortDescription}`,
    short_name: site.name,
    description: site.description,
    lang: 'zh-CN',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: metaColors.light,
    theme_color: site.themeColor,
    categories: ['education', 'news'],
    icons: [
      { src: assets.icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: assets.icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: assets.appleTouchIcon, sizes: '180x180', type: 'image/png' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
