import { getLatestReleasedRelease } from './releases';

/**
 * 应用信息单一数据源。
 *
 * `version` / `releaseDate` 由 `releases.ts` 派生；`size`、`ageRating`
 * 在上架后由 App Store Connect 填入，未填时 UI 显示「上架后公布」，
 * 不猜测数值。
 */

export interface AppInfo {
  readonly bundleId: string;
  readonly version: string | null;
  readonly build: string | null;
  readonly releaseDate: string | null;
  readonly size: string | null;
  readonly minimumOS: string;
  readonly devices: readonly string[];
  readonly languages: readonly string[];
  readonly ageRating: string | null;
  readonly price: {
    readonly isFree: boolean;
    readonly hasInAppPurchases: boolean;
    readonly hasAds: boolean;
  };
  readonly privacy: {
    readonly collectsPersonalData: boolean;
    readonly tracksUsers: boolean;
    readonly thirdPartyAnalytics: boolean;
    readonly localOnly: readonly string[];
    readonly policyPath: string;
  };
  readonly seller: string;
}

const current = getLatestReleasedRelease();

export const appInfo: AppInfo = {
  bundleId: 'com.qinchao',
  version: current?.version ?? null,
  build: null,
  releaseDate: current?.date ?? null,
  size: null,
  minimumOS: 'iOS 26.0',
  devices: ['iPhone', 'iPad'],
  languages: ['简体中文'],
  ageRating: null,
  price: { isFree: true, hasInAppPurchases: false, hasAds: false },
  privacy: {
    collectsPersonalData: false,
    tracksUsers: false,
    thirdPartyAnalytics: false,
    localOnly: ['收藏与阅读记录', '主题、字号与显示设置', '内容缓存与本地运行日志'],
    policyPath: '/privacy.html',
  },
  seller: '秦超',
};
