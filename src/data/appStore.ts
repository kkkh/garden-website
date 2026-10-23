/**
 * App Store 下载入口的状态机。
 *
 * 设计目标：上架当天只改本文件与 `releases.ts` 即可把官网从「即将上架」
 * 切换为可下载，页面组件无需改动。
 *
 * 安全约束：只有 `status === 'live'` 且 URL 通过 `isAllowedAppStoreUrl`
 * 校验时才渲染任何外链，避免发布占位或第三方地址。
 */

export type AppStoreStatus = 'coming-soon' | 'live';

export interface AppStoreConfig {
  readonly status: AppStoreStatus;
  /** App Store 数字 ID，用于 apple-itunes-app；不是 Team ID。 */
  readonly appStoreId: string | null;
  /** 形如 https://apps.apple.com/app/id1234567890 */
  readonly url: string | null;
  readonly badgeAlt: string;
  readonly qrAlt: string;
  /** Universal Links 真机验证前保持 null。 */
  readonly appArgument: string | null;
  readonly smartBannerEnabled: boolean;
  readonly comingSoonLabel: string;
  readonly liveLabel: string;
  /** 用于 Hero / FAQ 的上架状态文案（与下载按钮文案不同）。 */
  readonly liveAvailabilityLabel: string;
}

export const appStore: AppStoreConfig = {
  status: 'coming-soon',
  appStoreId: null,
  url: null,
  badgeAlt: '在 App Store 下载园枢',
  qrAlt: '园枢 App Store 下载二维码',
  appArgument: null,
  smartBannerEnabled: true,
  comingSoonLabel: '即将上架 App Store',
  liveLabel: '在 App Store 下载',
  liveAvailabilityLabel: '已在 App Store 上架',
};

/** 仅接受 Apple 官方商店域名，避免误配第三方或非 HTTPS 地址。 */
export function isAllowedAppStoreUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'apps.apple.com';
  } catch {
    return false;
  }
}

export function hasDownloadUrl(config: AppStoreConfig = appStore): boolean {
  return config.status === 'live' && isAllowedAppStoreUrl(config.url);
}

export const appAvailability = hasDownloadUrl()
  ? appStore.liveAvailabilityLabel
  : appStore.comingSoonLabel;
