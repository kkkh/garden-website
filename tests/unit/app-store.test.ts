import { describe, expect, it } from 'vitest';

import {
  appAvailability,
  appStore,
  hasDownloadUrl,
  isAllowedAppStoreUrl,
  type AppStoreConfig,
} from '@/data/appStore';
import { site } from '@/data/site';
import { appleItunesAppContent } from '@/lib/app-store';

function config(overrides: Partial<AppStoreConfig>): AppStoreConfig {
  return { ...appStore, ...overrides };
}

describe('App Store 下载入口状态机', () => {
  it('未上架时不展示下载入口', () => {
    expect(appStore.status).toBe('coming-soon');
    expect(hasDownloadUrl()).toBe(false);
    expect(appleItunesAppContent()).toBeNull();
  });

  it('仅接受 apps.apple.com 的 HTTPS 地址', () => {
    expect(isAllowedAppStoreUrl('https://apps.apple.com/app/id1234567890')).toBe(true);
    expect(isAllowedAppStoreUrl('http://apps.apple.com/app/id1234567890')).toBe(false);
    expect(isAllowedAppStoreUrl('https://apps.apple.com.evil.example/app')).toBe(false);
    expect(isAllowedAppStoreUrl('https://example.com/app')).toBe(false);
    expect(isAllowedAppStoreUrl(null)).toBe(false);
    expect(isAllowedAppStoreUrl('not-a-url')).toBe(false);
  });

  it('已上架且地址合法时才渲染入口', () => {
    const live = config({
      status: 'live',
      url: 'https://apps.apple.com/app/id1234567890',
      appStoreId: '1234567890',
    });
    expect(hasDownloadUrl(live)).toBe(true);
    expect(appleItunesAppContent(live)).toBe('app-id=1234567890');
  });

  it('已上架但地址非法时回退为未上架', () => {
    const live = config({ status: 'live', url: 'https://example.com/app' });
    expect(hasDownloadUrl(live)).toBe(false);
  });

  it('缺少数字 ID 时不输出智能应用横幅', () => {
    const live = config({
      status: 'live',
      url: 'https://apps.apple.com/app/id1234567890',
      appStoreId: null,
    });
    expect(hasDownloadUrl(live)).toBe(true);
    expect(appleItunesAppContent(live)).toBeNull();
  });

  it('app-argument 仅在显式配置时拼接', () => {
    const live = config({
      status: 'live',
      url: 'https://apps.apple.com/app/id1234567890',
      appStoreId: '1234567890',
      appArgument: 'yuan-shu://home',
    });
    expect(appleItunesAppContent(live)).toBe('app-id=1234567890, app-argument=yuan-shu://home');
  });

  it('站点上架文案与状态机一致', () => {
    expect(site.availability).toBe(appAvailability);
  });
});
