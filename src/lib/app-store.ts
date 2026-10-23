import { appStore, type AppStoreConfig } from '@/data/appStore';

/**
 * 生成 Safari 智能应用横幅所需的 `apple-itunes-app` 内容。
 *
 * 仅在已上架、开启横幅且 `appStoreId` 为纯数字时输出；
 * Universal Links 未真机验证前不拼 `app-argument`。
 */
export function appleItunesAppContent(config: AppStoreConfig = appStore): string | null {
  if (!config.smartBannerEnabled || config.status !== 'live') return null;
  if (!config.appStoreId || !/^\d+$/.test(config.appStoreId)) return null;
  return config.appArgument
    ? `app-id=${config.appStoreId}, app-argument=${config.appArgument}`
    : `app-id=${config.appStoreId}`;
}
