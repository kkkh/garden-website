/**
 * 首屏主题初始化：必须以 `is:inline` 内联方式在 `<head>` 中尽早执行，
 * 以避免浅色主题闪一下再切换到深色（FOUC）。
 *
 * 该文件内容会被复制到 `ThemeInit.astro` 的内联脚本中；
 * 逻辑保持无依赖、无异常抛出，任何失败都静默回退到系统偏好。
 */
export const themeInitScript = `(function () {
  try {
    var key = 'garden:theme';
    var stored = null;
    try { stored = localStorage.getItem(key); } catch (e) { stored = null; }
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    var root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.themePreference = stored === 'light' || stored === 'dark' ? stored : 'system';
    root.style.colorScheme = resolved;
  } catch (e) {
    /* 忽略：CSS 的 prefers-color-scheme 会兜底 */
  }
  document.documentElement.classList.add('js');
})();`;
