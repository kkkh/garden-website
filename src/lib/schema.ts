import { assets, site } from '@/data/site';

/** 全站通用的 WebSite / Organization 结构化数据。 */
export function websiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    alternateName: site.shortDescription,
    url: site.domain,
    inLanguage: 'zh-CN',
    description: site.description,
    publisher: {
      '@type': 'Person',
      name: site.developer.name,
      email: site.contact.primaryEmail,
    },
  };
}

/** 首页移动应用结构化数据。 */
export function mobileApplicationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: site.name,
    applicationCategory: 'EducationApplication',
    operatingSystem: 'iOS 26.0+',
    availableOnDevice: ['iPhone', 'iPad'],
    url: site.domain,
    image: new URL(assets.ogImage, site.domain).href,
    description: site.description,
    inLanguage: 'zh-CN',
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: site.developer.name },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
      availability: 'https://schema.org/PreOrder',
    },
    featureList: [
      '校园信息聚合首页',
      '新闻资讯与消息中心',
      '院系与专业查询',
      '学校概况与校长信箱',
      '招生资讯与校园生活',
      'Face ID 应用锁与个性化显示',
    ],
  };
}

/** 法律页面的面包屑。 */
export function breadcrumbSchema(
  items: ReadonlyArray<{ name: string; path: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, site.domain).href,
    })),
  };
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

/** 首页常见问题结构化数据（内容与页面可见问答一致）。 */
export function faqSchema(items: readonly FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
