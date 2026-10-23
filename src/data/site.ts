import { metaColors } from '@/design/tokens';

/**
 * 站点级常量：品牌、联系方式、导航与 SEO 文案。
 * 单一事实源，供布局、页脚、结构化数据与测试共同消费。
 */

export const site = {
  name: '园枢',
  legalName: '园枢（山西晋中理工学院校园移动应用）',
  domain: 'https://jl.43322.cn',
  shortDescription: '山西晋中理工学院校园信息聚合应用',
  description:
    '园枢是一款面向山西晋中理工学院师生、考生与家长的校园信息聚合应用，聚合学校官网新闻、通知公告、院系专业、招生资讯、校园风光等内容，支持收藏、搜索、个性化阅读与本地通知提醒。',
  slogan: '校园信息聚合 · 本地隐私优先',
  keywords: [
    '园枢',
    '山西晋中理工学院',
    '校园应用',
    '校园资讯',
    '招生信息',
    '院系专业',
    '通知公告',
    'iOS 应用',
  ],
  platform: 'iOS 26.0+ · iPhone / iPad',
  availability: '即将上架 App Store',
  screenshotDevice: {
    model: 'iPhone 13 Pro Max',
    finish: '苍岭绿',
    nativeWidth: 1284,
    nativeHeight: 2778,
  },
  developer: {
    name: '秦超（个人）',
    copyright: '© 2026 秦超（个人）版权所有',
    shortCopyright: '© 2026 园枢',
  },
  contact: {
    primaryEmail: '56967916@qq.com',
    secondaryEmail: 'uull@aliyun.com',
  },
  filing: {
    icp: '晋ICP备2023020746号-2',
    icpUrl: 'https://beian.miit.gov.cn/',
    police: '晋公网安备 14010602111139号',
    policeCode: '14010602111139',
    policeUrl: 'https://beian.mps.gov.cn/#/query/webSearch?code=14010602111139',
  },
  themeColor: metaColors.light,
  themeColorDark: metaColors.dark,
  author: '秦超',
} as const;

/**
 * 由 `npm run icons:build`（scripts/generate-icons.mjs）生成的静态资源路径。
 * 使用固定路径而非内容哈希，便于 manifest、apple-touch-icon 与结构化数据引用。
 */
export const assets = {
  favicon: '/icons/favicon-32.png',
  faviconSvg: '/icons/favicon.svg',
  appleTouchIcon: '/icons/apple-touch-icon.png',
  icon192: '/icons/icon-192.png',
  icon512: '/icons/icon-512.png',
  mark: '/icons/icon-192.png',
  ogImage: '/og/og-default.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
} as const;

export const navigation = [
  { label: '首页', href: '#top', id: 'top' },
  { label: '功能介绍', href: '#features', id: 'features' },
  { label: '应用截图', href: '#screenshots', id: 'screenshots' },
  { label: '平台架构', href: '#architecture', id: 'architecture' },
  { label: '系统与隐私', href: '#system', id: 'system' },
  { label: '关于我们', href: '#about', id: 'about' },
] as const;

export const legalNavigation = [
  { label: '隐私政策', href: '/privacy.html' },
  { label: '用户协议', href: '/agreement.html' },
] as const;

export type NavigationItem = (typeof navigation)[number];
export type LegalNavigationItem = (typeof legalNavigation)[number];
