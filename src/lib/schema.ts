import { appStore, hasDownloadUrl, type AppStoreConfig } from '@/data/appStore';
import { appInfo, type AppInfo } from '@/data/appInfo';
import { releaseAnchor, type Release } from '@/data/releases';
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

/** 首页移动应用结构化数据；下载入口按 `appStore` 状态机切换。 */
export function mobileApplicationSchema(
  config: AppStoreConfig = appStore,
  info: AppInfo = appInfo,
): Record<string, unknown> {
  const live = hasDownloadUrl(config);
  const installUrl = live ? config.url : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: site.name,
    applicationCategory: 'EducationApplication',
    operatingSystem: `${info.minimumOS}+`,
    availableOnDevice: info.devices,
    url: site.domain,
    image: new URL(assets.ogImage, site.domain).href,
    description: site.description,
    inLanguage: 'zh-CN',
    isAccessibleForFree: info.price.isFree,
    author: { '@type': 'Person', name: site.developer.name },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
      availability: live ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      ...(installUrl ? { url: installUrl } : {}),
    },
    ...(installUrl
      ? {
          installUrl,
          softwareVersion: info.version ?? undefined,
          fileSize: info.size ?? undefined,
          datePublished: info.releaseDate ?? undefined,
          privacyPolicy: new URL(info.privacy.policyPath, site.domain).href,
        }
      : {}),
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

/** 更新日志结构化数据：按发布时间倒序的版本列表。 */
export function changelogSchema(items: readonly Release[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: items.length,
    itemListElement: items.map((release, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${release.version} · ${release.title}`,
      url: `${site.domain}/changelog.html#${releaseAnchor(release.version)}`,
      item: {
        '@type': 'SoftwareApplication',
        name: site.name,
        applicationCategory: 'EducationApplication',
        operatingSystem: `${appInfo.minimumOS}+`,
        softwareVersion: release.version,
        ...(release.date ? { datePublished: release.date } : {}),
      },
    })),
  };
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
