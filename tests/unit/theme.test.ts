import { describe, expect, it } from 'vitest';

import {
  applyTheme,
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  writeThemePreference,
} from '@/lib/theme';

/** 最小化 DOM / storage 桩，仅覆盖被测函数用到的接口。 */
function installDom(initial: Record<string, string> = {}, systemDark = false) {
  const storage = new Map(Object.entries(initial));
  const root = {
    dataset: {} as Record<string, string>,
    style: {} as Record<string, string>,
  };
  const meta = { content: '' };

  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  };

  (globalThis as unknown as { document: unknown }).document = {
    documentElement: root,
    querySelector: (selector: string) => (selector.includes('theme-color') ? meta : null),
  };

  (globalThis as unknown as { matchMedia: unknown }).matchMedia = (query: string) => ({
    matches: query.includes('prefers-color-scheme: dark') ? systemDark : false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });

  return { storage, root, meta };
}

describe('isThemePreference', () => {
  it('识别合法偏好', () => {
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('system')).toBe(true);
  });

  it('拒绝非法值与空值', () => {
    expect(isThemePreference('blue')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
    expect(isThemePreference(undefined)).toBe(false);
    expect(isThemePreference(1)).toBe(false);
  });
});

describe('resolveTheme', () => {
  it('显式偏好直接生效', () => {
    installDom({}, true);
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('system 跟随系统深色', () => {
    installDom({}, true);
    expect(resolveTheme('system')).toBe('dark');

    installDom({}, false);
    expect(resolveTheme('system')).toBe('light');
  });
});

describe('applyTheme', () => {
  it('写入 data-theme 与 color-scheme，并同步 meta 主题色', () => {
    const { root, meta } = installDom();
    const resolved = applyTheme('dark');

    expect(resolved).toBe('dark');
    expect(root.dataset.theme).toBe('dark');
    expect(root.dataset.themePreference).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
    expect(meta.content).toBe('#080f1a');
  });

  it('浅色时使用浅色 chrome 颜色', () => {
    const { meta } = installDom();
    applyTheme('light');
    expect(meta.content).toBe('#0a1220');
  });
});

describe('writeThemePreference', () => {
  it('显式主题写入 localStorage', () => {
    const { storage } = installDom();
    writeThemePreference('dark');
    expect(storage.get(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('system 清除存储，回到跟随系统', () => {
    const { storage } = installDom({ [THEME_STORAGE_KEY]: 'dark' });
    writeThemePreference('system');
    expect(storage.has(THEME_STORAGE_KEY)).toBe(false);
  });

  it('存储被禁用时不抛错', () => {
    (globalThis as unknown as { localStorage: unknown }).localStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };

    expect(() => writeThemePreference('dark')).not.toThrow();
  });
});
