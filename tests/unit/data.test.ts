import { describe, expect, it } from 'vitest';

import { architectureFigures } from '@/data/architecture';
import { faqItems } from '@/data/faq';
import { features, introCards, systemGroups } from '@/data/home';
import { screenshots } from '@/data/screenshots';
import { legalNavigation, navigation, site } from '@/data/site';
import { breadcrumbSchema, faqSchema, mobileApplicationSchema, websiteSchema } from '@/lib/schema';

describe('站点数据完整性', () => {
  it('导航锚点唯一且以 # 开头', () => {
    const ids = navigation.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(navigation.every((item) => item.href === `#${item.id}`)).toBe(true);
  });

  it('法律导航使用稳定的 .html 路径', () => {
    expect(legalNavigation.map((item) => item.href)).toEqual(['/privacy.html', '/agreement.html']);
  });

  it('备案与联系方式非空', () => {
    expect(site.filing.icp).toMatch(/^晋ICP备\d+号$/);
    expect(site.filing.policeCode).toMatch(/^\d+$/);
    expect(site.contact.primaryEmail).toContain('@');
  });
});

describe('截图数据', () => {
  it('共 22 张且序号连续', () => {
    expect(screenshots).toHaveLength(22);
    expect(screenshots.map((shot) => shot.index)).toEqual(
      Array.from({ length: 22 }, (_, i) => i + 1),
    );
  });

  it('每张都有 alt 与 caption，且 caption 以句号收尾', () => {
    for (const shot of screenshots) {
      expect(shot.alt.length).toBeGreaterThan(6);
      expect(shot.caption.length).toBeGreaterThan(10);
      expect(shot.caption.endsWith('。')).toBe(true);
    }
  });

  it('说明与 alt 不重复，避免读屏重复播报', () => {
    for (const shot of screenshots) {
      expect(shot.alt).not.toBe(shot.caption);
    }
  });
});

describe('架构图数据', () => {
  it('共 10 张且序号连续', () => {
    expect(architectureFigures).toHaveLength(10);
    expect(architectureFigures.map((figure) => figure.index)).toEqual(
      Array.from({ length: 10 }, (_, i) => i + 1),
    );
  });

  it('每张都有标题与说明', () => {
    for (const figure of architectureFigures) {
      expect(figure.title.length).toBeGreaterThan(3);
      expect(figure.description.length).toBeGreaterThan(10);
    }
  });
});

describe('首页内容数据', () => {
  it('介绍卡与系统分组数量符合设计', () => {
    expect(introCards).toHaveLength(4);
    expect(features).toHaveLength(6);
    expect(systemGroups).toHaveLength(4);
  });

  it('功能卡关联的截图序号都在有效范围内', () => {
    for (const feature of features) {
      expect(feature.targetShot).toBeGreaterThanOrEqual(1);
      expect(feature.targetShot).toBeLessThanOrEqual(screenshots.length);
      expect(feature.targetLabel.length).toBeGreaterThan(2);
    }
  });

  it('系统卡每项都至少有一条说明', () => {
    for (const group of systemGroups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });
});

describe('结构化数据', () => {
  it('WebSite schema 含站点名与语言', () => {
    const schema = websiteSchema();
    expect(schema['@type']).toBe('WebSite');
    expect(schema.inLanguage).toBe('zh-CN');
    expect(String(schema.url)).toContain('jl.43322.cn');
  });

  it('MobileApplication schema 含系统要求与免费声明', () => {
    const schema = mobileApplicationSchema();
    expect(schema['@type']).toBe('MobileApplication');
    expect(schema.operatingSystem).toBe('iOS 26.0+');
    expect(schema.isAccessibleForFree).toBe(true);
  });

  it('FAQ schema 与页面可见问答一一对应', () => {
    const schema = faqSchema(faqItems);
    const entities = schema.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(faqItems.length);
    expect(entities[0]?.name).toBe(faqItems[0]?.question);
  });

  it('面包屑 position 从 1 开始递增', () => {
    const schema = breadcrumbSchema([
      { name: '首页', path: '/' },
      { name: '隐私政策', path: '/privacy.html' },
    ]);
    const items = schema.itemListElement as Array<Record<string, unknown>>;
    expect(items.map((item) => item.position)).toEqual([1, 2]);
    expect(String(items[1]?.item)).toBe('https://jl.43322.cn/privacy.html');
  });

  it('FAQ 答案不以空白结尾且长度合理', () => {
    for (const item of faqItems) {
      expect(item.answer.trim()).toBe(item.answer);
      expect(item.answer.length).toBeGreaterThan(10);
    }
  });
});
