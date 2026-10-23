import type { ArchitectureFigure } from './types';

import flow01 from '@/assets/architecture/flow-01.png';
import flow02 from '@/assets/architecture/flow-02.png';
import flow03 from '@/assets/architecture/flow-03.png';
import flow04 from '@/assets/architecture/flow-04.png';
import flow05 from '@/assets/architecture/flow-05.png';
import flow06 from '@/assets/architecture/flow-06.png';
import flow07 from '@/assets/architecture/flow-07.png';
import flow08 from '@/assets/architecture/flow-08.png';
import flow09 from '@/assets/architecture/flow-09.png';
import flow10 from '@/assets/architecture/flow-10.png';

const figures = [
  {
    image: flow01,
    title: '系统总体架构与数据流',
    description:
      '官方数据源经网络协议层与 12 大服务中枢加工，在五大栏目与三大专题中呈现，全程日志与网络监测保障。',
  },
  {
    image: flow02,
    title: '冷启动与安全门流程',
    description:
      '启动经隐私同意门与可选 Face ID 安全锁进入主界面，同步、轮询与预热三段并行，首页迅速就绪。',
  },
  {
    image: flow03,
    title: '首页内容运营模块链路',
    description:
      '可配置内容模块、常显入口卡、骨架屏与错峰动画、滚动追踪与双刷新通道，构成完整首页运营链路。',
  },
  {
    image: flow04,
    title: '四通道通知轮询与点击深链',
    description:
      '新闻、校长信箱、学校概况、党建专题四条通道按基线检测更新，本地推送，点击通知直达对应内容。',
  },
  {
    image: flow05,
    title: '学校概况数据引擎',
    description:
      '学校简介、现任领导、校园风光与合作交流三路并行拉取，预热与代际校验保证内容与官网同步。',
  },
  {
    image: flow06,
    title: '党建专题双子站聚合引擎',
    description: '党建工作与思政专题两站索引解析、并发分页全量聚合，支持加权全文搜索。',
  },
  {
    image: flow07,
    title: '校长信箱业务闭环',
    description: '从入口到信件详情、拨号与官网写信，再到更新提醒，构成用户与校方沟通的完整闭环。',
  },
  {
    image: flow08,
    title: '机构子站全域搜索流水线',
    description:
      '机构树解析、站点匹配、常规与深度两级检索、并发批处理与详情降级，机构资讯全域可搜。',
  },
  {
    image: flow09,
    title: '图片系统与三级缓存流水线',
    description: '统一入口、降采样解码、双限内存缓存与磁盘缓存，兼顾加载速度与流量节省。',
  },
  {
    image: flow10,
    title: '显示与个性化设置全景',
    description: '外观排版、屏幕、内容阅读五大设置域全实时生效，深浅色、字号与主题色随心定制。',
  },
] as const;

export const architectureFigures: readonly ArchitectureFigure[] = figures.map((item, i) => ({
  index: i + 1,
  ...item,
}));
