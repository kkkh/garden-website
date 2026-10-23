import type { ImageMetadata } from 'astro';
import type { Screenshot } from './types';

import shot01 from '@/assets/screenshots/screenshot-01.jpg';
import shot02 from '@/assets/screenshots/screenshot-02.jpg';
import shot03 from '@/assets/screenshots/screenshot-03.jpg';
import shot04 from '@/assets/screenshots/screenshot-04.jpg';
import shot05 from '@/assets/screenshots/screenshot-05.jpg';
import shot06 from '@/assets/screenshots/screenshot-06.jpg';
import shot07 from '@/assets/screenshots/screenshot-07.jpg';
import shot08 from '@/assets/screenshots/screenshot-08.jpg';
import shot09 from '@/assets/screenshots/screenshot-09.jpg';
import shot10 from '@/assets/screenshots/screenshot-10.jpg';
import shot11 from '@/assets/screenshots/screenshot-11.jpg';
import shot12 from '@/assets/screenshots/screenshot-12.jpg';
import shot13 from '@/assets/screenshots/screenshot-13.jpg';
import shot14 from '@/assets/screenshots/screenshot-14.jpg';
import shot15 from '@/assets/screenshots/screenshot-15.jpg';
import shot16 from '@/assets/screenshots/screenshot-16.jpg';
import shot17 from '@/assets/screenshots/screenshot-17.jpg';
import shot18 from '@/assets/screenshots/screenshot-18.jpg';
import shot19 from '@/assets/screenshots/screenshot-19.jpg';
import shot20 from '@/assets/screenshots/screenshot-20.jpg';
import shot21 from '@/assets/screenshots/screenshot-21.jpg';
import shot22 from '@/assets/screenshots/screenshot-22.jpg';

interface ScreenshotContent {
  readonly image: ImageMetadata;
  readonly alt: string;
  readonly caption: string;
}

const items: readonly ScreenshotContent[] = [
  {
    image: shot01,
    alt: '园枢首页：办学数据与校园服务入口',
    caption: '首页汇聚办学数据与院系、资讯、荣誉等高频入口，重要通知即时提醒。',
  },
  {
    image: shot02,
    alt: '园枢新闻资讯：分类浏览与搜索',
    caption: '新闻资讯按学校要闻、党建动态、通知公告等分类浏览，支持搜索、收藏与阅读时长提示。',
  },
  {
    image: shot03,
    alt: '园枢资讯详情：迎新晚会图文报道',
    caption: '资讯详情以大图呈现迎新晚会现场，支持原文跳转、图集浏览与阅读进度。',
  },
  {
    image: shot04,
    alt: '园枢资讯详情：正文阅读与新闻图集',
    caption: '长文阅读排版舒适，正文、配图与新闻图集完整呈现。',
  },
  {
    image: shot05,
    alt: '园枢招生专区：录取查询与招生计划',
    caption: '招生专区集中录取查询、历年分数线、专业介绍、招生计划与公告。',
  },
  {
    image: shot06,
    alt: '园枢院系设置：学院、系部与专业',
    caption: '11 个学院、16 个系部与 44 个专业层级清晰，院系详情一键直达。',
  },
  {
    image: shot07,
    alt: '园枢机构设置：机构分类与官网子站',
    caption: '机构设置覆盖 35 个机构、5 大类与 25 个官网子站，按门户、党委、群团、行政分类浏览。',
  },
  {
    image: shot08,
    alt: '园枢机构设置：机构与文章双通道搜索',
    caption: '机构与文章双通道检索，支持搜索历史与快捷回填，校园信息一键直达。',
  },
  {
    image: shot09,
    alt: '园枢学校概况：办学数据与学科竞赛',
    caption: '学校概况汇总简介、现任领导与办学数据，学科竞赛等板块集中呈现。',
  },
  {
    image: shot10,
    alt: '园枢学校概况详情：办学信息一览',
    caption: '学校类型、主管部门、创办与转设时间、校庆日与校址等办学信息一览无余。',
  },
  {
    image: shot11,
    alt: '园枢校长信箱：公开来信与回复',
    caption: '校长信箱公开来信与回复，办理状态与时间清晰可查。',
  },
  {
    image: shot12,
    alt: '园枢校园生活：校园服务与校园设施',
    caption: '教务、图书馆、招生网、就业信息与场馆指南一站直达。',
  },
  {
    image: shot13,
    alt: '园枢校园生活：学校概况与办学信息',
    caption: '校园生活中的学校概况卡片，集中呈现办学沿革与招生咨询入口。',
  },
  {
    image: shot14,
    alt: '园枢校园生活：友情链接与关注我们',
    caption: '友情链接汇集教育主管部门与公共服务平台，扫码关注学校官方平台。',
  },
  {
    image: shot15,
    alt: '园枢图书馆：馆舍简介与馆藏资源',
    caption: '图书馆详情呈现馆舍简介、分区目录、历史沿革与馆藏资源。',
  },
  {
    image: shot16,
    alt: '园枢个人中心：我的',
    caption: '个人中心汇集消息中心、我的收藏、阅读时光、学校概况与应用设置。',
  },
  {
    image: shot17,
    alt: '园枢消息中心：分类通知与未读提醒',
    caption: '消息中心按来源汇总更新，未读提醒、搜索与分类筛选让重要动态不再错过。',
  },
  {
    image: shot18,
    alt: '园枢我的收藏：分类筛选与离线阅读',
    caption: '收藏中心支持分类筛选与离线条目标记，好内容随时回看。',
  },
  {
    image: shot19,
    alt: '园枢阅读时光：阅读统计与专注分布',
    caption: '阅读时光以日报、周报、月报与年报记录阅读时长、专注分布与连续天数。',
  },
  {
    image: shot20,
    alt: '园枢设置：显示、图标、模块与安全锁',
    caption: '设置中心提供显示外观、应用图标、首页模块管理与 Face ID 安全锁。',
  },
  {
    image: shot21,
    alt: '园枢显示设置：深浅色模式与主题图案',
    caption: '显示设置支持跟随系统、浅色与深色模式，主题图案与排版方案随心调整。',
  },
  {
    image: shot22,
    alt: '园枢应用日志：运行事件筛选与搜索',
    caption: '应用日志实时记录运行事件，按级别筛选与全文搜索快速定位。',
  },
];

export const screenshots: readonly Screenshot[] = items.map((item, i) => ({
  index: i + 1,
  ...item,
}));
