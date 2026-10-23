import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置。
 *
 * - 使用 `astro preview` 提供构建产物，保证测试对象是线上同源产物而非 dev 服务器。
 * - 截图基线按“项目 × 主题”区分：桌面/平板/手机 × 浅色/深色。
 * - `reducedMotion` 项目用于验证减弱动效降级。
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }],
    ['json', { outputFile: 'reports/playwright-results.json' }],
  ],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    colorScheme: 'light',
  },
  webServer: {
    command: 'npm run preview -- --port 4321 --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-light', use: { ...devices['Desktop Chrome'], colorScheme: 'light' } },
    {
      name: 'desktop-dark',
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
      testMatch: /(visual|theme)\.spec\.ts/,
    },
    {
      // 平板与手机的视口/触控特征取自设备描述符，但统一使用 Chromium：
      // 单一浏览器引擎可以减少 CI 下载体积，同时保留 isMobile/hasTouch 语义。
      name: 'tablet-light',
      use: { ...devices['iPad (gen 7)'], browserName: 'chromium' },
      testMatch: /visual\.spec\.ts/,
    },
    {
      name: 'mobile-light',
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
      testMatch: /(visual|mobile)\.spec\.ts/,
    },
    {
      name: 'reduced-motion',
      use: { ...devices['Desktop Chrome'], reducedMotion: 'reduce' },
      testMatch: /reduced-motion\.spec\.ts/,
    },
  ],
});
