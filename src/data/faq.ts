import type { FaqItem } from '@/lib/schema';
import { hasDownloadUrl } from './appStore';
import { site } from './site';

/** 首页可见 FAQ，与 `faqSchema` 使用同一份数据，保证结构化数据与页面一致。 */
export const faqItems: readonly FaqItem[] = [
  {
    question: '园枢什么时候可以在 App Store 下载？',
    answer: hasDownloadUrl()
      ? '已上架。你可以在本页「下载园枢」区点击 App Store 按钮或扫描二维码安装，也可以直接搜索「园枢」。'
      : `${site.availability}。本页面会在上架后更新下载入口，你也可以通过 ${site.contact.primaryEmail} 订阅上架提醒。`,
  },
  {
    question: '使用园枢需要注册账号吗？会收集我的信息吗？',
    answer:
      '不需要。园枢没有账号体系，不收集姓名、手机号、邮箱与位置等信息；收藏、阅读记录、设置与缓存仅保存在设备本地，卸载应用即可全部清除。',
  },
  {
    question: '没有网络时可以看内容吗？',
    answer:
      '可以。已浏览过的内容与图片会缓存在本机，弱网或断网时会自动降级为本地缓存与内置内容，仍可继续阅读。',
  },
  {
    question: '园枢是收费应用吗？会展示广告吗？',
    answer:
      '园枢完全免费，不含任何收费项目、内购、广告与第三方统计组件。内容来源于学校官方公开信息，版权归学校所有。',
  },
  {
    question: '应用里的信息和学校官网不一致怎么办？',
    answer:
      '园枢聚合学校官网公开信息，可能存在抓取延迟。涉及招生、教务、行政等重要事项，请以学校官方网站等正式渠道发布的信息为准。',
  },
  {
    question: '支持哪些设备与系统版本？',
    answer: `${site.platform}。界面完全本地渲染，同时适配深色模式、字号缩放与 VoiceOver 等辅助功能。`,
  },
];
