import { metaColors } from '@/design/tokens';

/**
 * 主题（浅色 / 深色 / 跟随系统）管理。
 *
 * 说明：
 * - 偏好仅写入 `localStorage['garden:theme']`，不采集任何身份信息；
 * - `theme-init.ts` 以内联脚本形式在 `<head>` 中提前执行，避免首屏闪烁；
 * - 无 JavaScript 时由 CSS 的 `prefers-color-scheme` 兜底。
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'garden:theme';

const prefersDarkQuery = '(prefers-color-scheme: dark)';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function readThemePreference(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return typeof matchMedia === 'function' && matchMedia(prefersDarkQuery).matches
      ? 'dark'
      : 'light';
  }
  return preference;
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolved;

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content = resolved === 'dark' ? metaColors.dark : metaColors.light;
  }

  return resolved;
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch {
    // 隐私模式或禁用存储时静默降级为当前会话生效。
  }
}

/**
 * 绑定主题切换控件（role=group 内的三个按钮，aria-pressed 表示当前偏好）。
 * 返回解绑函数，便于测试清理。
 */
export function initThemeToggle(
  onChange: (preference: ThemePreference, resolved: ResolvedTheme) => void,
): () => void {
  const group = document.querySelector<HTMLElement>('[data-theme-toggle]');
  if (!group) return () => undefined;

  const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('button[data-theme-value]'));

  const syncPressed = (preference: ThemePreference) => {
    for (const button of buttons) {
      const isActive = button.dataset.themeValue === preference;
      button.setAttribute('aria-pressed', String(isActive));
    }
  };

  const handleClick = (event: Event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>(
      'button[data-theme-value]',
    );
    if (!button) return;

    const value = button.dataset.themeValue;
    if (!isThemePreference(value)) return;

    writeThemePreference(value);
    const resolved = applyTheme(value);
    syncPressed(value);
    onChange(value, resolved);
  };

  const media = typeof matchMedia === 'function' ? matchMedia(prefersDarkQuery) : null;
  const handleSystemChange = () => {
    if (readThemePreference() !== 'system') return;
    const resolved = applyTheme('system');
    onChange('system', resolved);
  };

  group.addEventListener('click', handleClick);
  media?.addEventListener('change', handleSystemChange);

  syncPressed(readThemePreference());

  return () => {
    group.removeEventListener('click', handleClick);
    media?.removeEventListener('change', handleSystemChange);
  };
}
