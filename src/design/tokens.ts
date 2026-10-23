/**
 * 园枢设计系统 · 单一事实源（Single Source of Truth）
 *
 * 所有颜色、字体、间距、圆角、阴影、动效与层级均在此定义。
 * `npm run tokens:build` 会生成 `src/styles/tokens.generated.css`；
 * 组件与页面只能消费 CSS 变量或 `var(--...)`，不得硬编码颜色。
 *
 * 颜色命名遵循“原始色 → 语义色”两层：
 * - 原始色（primitive）：ink / paper / gold / jade / blue / danger，描述色相与明度。
 * - 语义色（semantic）：canvas / surface / text / border / accent / focus，描述用途。
 *
 * 暗色模式不是简单反色：独立校准了表面层级、文字对比度、
 * 边框强度与品牌金亮度，详见 docs/design-system/tokens.md。
 */

export const primitiveColors = {
  'ink-950': '#070c14',
  'ink-900': '#0d1524',
  'ink-850': '#101a2b',
  'ink-800': '#132035',
  'ink-700': '#1b2a44',
  'ink-600': '#273754',
  'ink-500': '#3b4b67',
  'ink-400': '#5b6a82',
  'ink-300': '#7c889c',
  'ink-200': '#a7b0bf',
  'ink-100': '#d5dae2',

  'paper-50': '#fbf9f3',
  'paper-100': '#f5f0e5',
  'paper-150': '#f0e9db',
  'paper-200': '#e8dfcd',
  'paper-300': '#d7cbb4',

  'gold-100': '#f6ecd2',
  'gold-200': '#eeddb2',
  'gold-300': '#e2c987',
  'gold-400': '#d2b268',
  'gold-500': '#b8934a',
  'gold-600': '#98752f',
  'gold-700': '#6f5220',
  'gold-800': '#5f4517',

  /* iPhone 13 Pro Max 苍岭绿：仅用于截图来源标注色，不再模拟手机中框 */
  'alpine-600': '#596a5b',
  'alpine-300': '#a6b4a2',

  'jade-300': '#8cc0ae',
  'jade-500': '#3f7a68',
  'jade-600': '#24564a',

  'blue-500': '#35638f',
  'blue-700': '#24466f',

  'danger-300': '#f0a0a0',
  'danger-500': '#93322f',

  white: '#ffffff',
  black: '#000000',
} as const;

export type PrimitiveColorToken = keyof typeof primitiveColors;

export const lightColors = {
  canvas: 'var(--color-paper-50)',
  surface: 'var(--color-white)',
  'surface-muted': 'var(--color-paper-100)',
  'surface-elevated': 'var(--color-white)',
  'surface-inverse': 'var(--color-ink-950)',

  'text-primary': 'var(--color-ink-900)',
  'text-secondary': '#45516a',
  'text-tertiary': '#5f6a7d',
  'text-inverse': 'var(--color-paper-50)',
  'text-inverse-muted': '#c4cbd6',

  'border-subtle': 'var(--color-paper-200)',
  'border-strong': '#7c889c',

  accent: 'var(--color-gold-700)',
  'accent-strong': 'var(--color-gold-800)',
  'accent-soft': 'var(--color-gold-100)',
  'accent-contrast': 'var(--color-ink-950)',

  link: 'var(--color-blue-700)',
  'link-hover': 'var(--color-ink-900)',

  focus: 'var(--color-blue-700)',
  success: 'var(--color-jade-600)',
  danger: 'var(--color-danger-500)',

  'hero-surface': '#0a1220',
  'hero-surface-alt': '#0d1524',
  'hero-text': 'var(--color-paper-50)',
  'hero-text-muted': '#b8c2d0',
  'hero-line': 'rgba(245, 240, 229, 0.14)',
  'hero-grid': 'rgba(245, 240, 229, 0.055)',
  'hero-glow': 'rgba(210, 178, 104, 0.17)',
  'hero-glow-soft': 'rgba(210, 178, 104, 0.06)',

  overlay: 'rgba(7, 12, 20, 0.72)',
  'overlay-soft': 'rgba(251, 249, 243, 0.82)',
  'highlight-ring': 'rgba(210, 178, 104, 0.34)',
  'shadow-color': 'rgba(7, 12, 20, 0.12)',
  'shadow-color-strong': 'rgba(7, 12, 20, 0.22)',
  'gold-glow': 'rgba(184, 147, 74, 0.22)',
} as const;

export const darkColors = {
  canvas: 'var(--color-ink-950)',
  surface: 'var(--color-ink-900)',
  'surface-muted': '#111b2b',
  'surface-elevated': '#142033',
  'surface-inverse': 'var(--color-paper-50)',

  'text-primary': 'var(--color-paper-50)',
  'text-secondary': '#b3bcc9',
  'text-tertiary': '#93a0b0',
  'text-inverse': 'var(--color-ink-950)',
  'text-inverse-muted': '#4a5566',

  'border-subtle': '#2a3a55',
  'border-strong': '#5f6f92',

  accent: 'var(--color-gold-300)',
  'accent-strong': '#f0dda8',
  'accent-soft': '#1c2638',
  'accent-contrast': 'var(--color-ink-950)',

  link: '#b8cce8',
  'link-hover': 'var(--color-paper-50)',

  focus: 'var(--color-gold-300)',
  success: 'var(--color-jade-300)',
  danger: 'var(--color-danger-300)',

  'hero-surface': '#080f1a',
  'hero-surface-alt': '#0b1422',
  'hero-text': 'var(--color-paper-50)',
  'hero-text-muted': '#aab5c4',
  'hero-line': 'rgba(245, 240, 229, 0.12)',
  'hero-grid': 'rgba(245, 240, 229, 0.045)',
  'hero-glow': 'rgba(226, 201, 135, 0.14)',
  'hero-glow-soft': 'rgba(226, 201, 135, 0.05)',

  overlay: 'rgba(3, 7, 12, 0.84)',
  'overlay-soft': 'rgba(7, 12, 20, 0.82)',
  'highlight-ring': 'rgba(226, 201, 135, 0.36)',
  'shadow-color': 'rgba(0, 0, 0, 0.34)',
  'shadow-color-strong': 'rgba(0, 0, 0, 0.52)',
  'gold-glow': 'rgba(226, 201, 135, 0.18)',
} as const;

export const typography = {
  // 原字体栈：'"Fraunces Variable", "Songti SC", "Noto Serif CJK SC", "STSong", "SimSun", serif'
  // 说明：补齐思源/Noto 宋体的常见家族名，避免 Windows 与部分 Linux 缺少 Songti SC 时直接落到点阵宋体。
  fontDisplay:
    '"Fraunces Variable", "Songti SC", "Source Han Serif SC", "Noto Serif CJK SC", "Noto Serif SC", "STSong", "SimSun", serif',
  fontBody:
    '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif',
  fontMono: 'ui-monospace, "SFMono-Regular", "SF Mono", "Cascadia Code", "Roboto Mono", monospace',
  size: {
    '2xs': '0.6875rem',
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.375rem',
    '2xl': 'clamp(1.625rem, 2.4vw, 2rem)',
    '3xl': 'clamp(2rem, 3.2vw, 2.75rem)',
    '4xl': 'clamp(2.5rem, 4.6vw, 3.75rem)',
    display: 'clamp(4rem, 10vw, 8.5rem)',
  },
  leading: {
    none: '1',
    tight: '1.1',
    snug: '1.3',
    normal: '1.6',
    relaxed: '1.8',
  },
  tracking: {
    tight: '-0.03em',
    normal: '0',
    wide: '0.08em',
    wider: '0.16em',
    widest: '0.24em',
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '800',
  },
} as const;

export const space = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.5rem',
  6: '2rem',
  7: '3rem',
  8: '4rem',
  9: '6rem',
  10: '8rem',
  11: '10rem',
} as const;

export const radii = {
  xs: '6px',
  sm: '10px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  full: '999px',
} as const;

export const lightShadows = {
  xs: '0 1px 2px var(--color-shadow-color)',
  sm: '0 4px 14px var(--color-shadow-color), 0 1px 2px var(--color-shadow-color)',
  md: '0 18px 44px var(--color-shadow-color), 0 2px 8px var(--color-shadow-color)',
  lg: '0 34px 90px var(--color-shadow-color-strong), 0 4px 14px var(--color-shadow-color)',
  gold: '0 18px 48px var(--color-gold-glow)',
  inset: 'inset 0 0 0 1px var(--color-border-subtle)',
} as const;

export const darkShadows = {
  xs: '0 1px 2px var(--color-shadow-color)',
  sm: '0 6px 18px var(--color-shadow-color), 0 1px 2px var(--color-shadow-color)',
  md: '0 20px 50px var(--color-shadow-color), 0 2px 8px var(--color-shadow-color)',
  lg: '0 36px 100px var(--color-shadow-color-strong), 0 4px 14px var(--color-shadow-color)',
  gold: '0 18px 48px var(--color-gold-glow)',
  inset: 'inset 0 0 0 1px var(--color-border-subtle)',
} as const;

export const motion = {
  duration: {
    instant: '80ms',
    fast: '140ms',
    base: '220ms',
    slow: '420ms',
    slower: '640ms',
  },
  ease: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    in: 'cubic-bezier(0.7, 0, 0.84, 0)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export const layout = {
  'container-wide': '1320px',
  container: '1200px',
  'container-narrow': '760px',
  gutter: 'clamp(1.25rem, 4vw, 2.5rem)',
  'header-height': '4.5rem',
  'section-padding': 'clamp(4.5rem, 9vw, 8.5rem)',
  'phone-ratio': '1284 / 2778',
  'line-width': '68ch',
} as const;

export const zIndex = {
  base: '0',
  raised: '10',
  sticky: '100',
  overlay: '200',
  dialog: '300',
  skip: '400',
} as const;

export const focus = {
  width: '2px',
  offset: '3px',
} as const;

export const printColors = {
  bg: '#ffffff',
  text: '#000000',
  muted: '#333333',
  border: '#999999',
} as const;

/**
 * 浏览器 chrome / manifest 使用的主题色。
 * 这些值无法通过 CSS 变量传递给 `<meta name="theme-color">` 或 manifest，
 * 因此在此集中定义，供 SEO、主题切换与 manifest 端点共同引用。
 */
export const metaColors = {
  light: '#0a1220',
  dark: '#080f1a',
} as const;

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
