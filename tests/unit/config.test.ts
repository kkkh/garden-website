import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

interface HeaderEntry {
  key: string;
  value: string;
}

interface HeaderRule {
  source: string;
  headers: HeaderEntry[];
}

interface EdgeOneConfig {
  redirects: { source: string; destination: string; statusCode: number }[];
  headers: HeaderRule[];
}

const config = JSON.parse(
  readFileSync(path.resolve(process.cwd(), 'edgeone.json'), 'utf8'),
) as EdgeOneConfig;

describe('EdgeOne 平台配置', () => {
  it('提供 /changelog 到 /changelog.html 的 301', () => {
    expect(config.redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/changelog',
          destination: '/changelog.html',
          statusCode: 301,
        }),
      ]),
    );
  });

  it('全站安全响应头齐备', () => {
    const globalRule = config.headers.find((rule) => rule.source === '/*');
    expect(globalRule).toBeDefined();

    const keys = globalRule?.headers.map((header) => header.key) ?? [];
    expect(keys).toEqual(
      expect.arrayContaining([
        'Content-Security-Policy',
        'Referrer-Policy',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Permissions-Policy',
      ]),
    );
  });

  it('CSP 覆盖内联样式/脚本、data 图片与自托管字体', () => {
    const csp =
      config.headers
        .find((rule) => rule.source === '/*')
        ?.headers.find((header) => header.key === 'Content-Security-Policy')?.value ?? '';

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).toContain("font-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('静态资源使用长缓存，HTML 使用短缓存', () => {
    const assetRule = config.headers.find((rule) => rule.source === '/_astro/*');
    const htmlRule = config.headers.find((rule) => rule.source === '/*.html');
    expect(assetRule?.headers[0]?.value).toContain('immutable');
    expect(htmlRule?.headers[0]?.value).toContain('must-revalidate');
  });
});
