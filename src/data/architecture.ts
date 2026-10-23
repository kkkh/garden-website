import type { ArchitectureFigure } from './types';

import flow01 from '@/assets/architecture/flow-01.webp';
import flow02 from '@/assets/architecture/flow-02.webp';
import flow03 from '@/assets/architecture/flow-03.webp';
import flow04 from '@/assets/architecture/flow-04.webp';
import flow05 from '@/assets/architecture/flow-05.webp';
import flow06 from '@/assets/architecture/flow-06.webp';
import flow07 from '@/assets/architecture/flow-07.webp';
import flow08 from '@/assets/architecture/flow-08.webp';
import flow09 from '@/assets/architecture/flow-09.webp';
import flow10 from '@/assets/architecture/flow-10.webp';

const figures = [
  {
    image: flow01,
    title: '系统总体架构与数据流',
    description:
      '官方数据源经网络协议层与 12 大服务中枢加工，在五大栏目与三大专题中呈现，全程日志与网络监测保障。',
    longDescription:
      '示意图自上而下分为四层。最上层是官方数据源，包括学校官网页面与公开接口、各机构子站、党建与思政专题站；第二层是网络与协议层，负责请求调度、超时重试、并发限制与失败降级；第三层是服务层，由资讯、通知、院系专业、招生、搜索、图片等 12 个服务中枢组成，把原始页面加工成结构化数据；最下层是视图层，数据进入首页五大栏目与三大专题。图右侧的日志与网络监测贯穿全部四层。',
  },
  {
    image: flow02,
    title: '冷启动与安全门流程',
    description:
      '启动经隐私同意门与可选 Face ID 安全锁进入主界面，同步、轮询与预热三段并行，首页迅速就绪。',
    longDescription:
      '流程从应用启动开始：首次运行时先经过隐私同意门，用户同意后才继续；随后是可选的 Face ID 安全锁校验，通过后进入主界面。进入主界面后并行执行三段任务：增量同步拉取最新内容、四通道通知轮询检查更新、首页数据预热填充缓存。三段任务完成后首页进入就绪状态，各自的完成情况会回写到本地缓存快照。',
  },
  {
    image: flow03,
    title: '首页内容运营模块链路',
    description:
      '可配置内容模块、常显入口卡、骨架屏与错峰动画、滚动追踪与双刷新通道，构成完整首页运营链路。',
    longDescription:
      '链路从内容模块配置出发，按配置顺序渲染可开关的内容模块与常显入口卡；数据未就绪时先展示骨架屏，数据到达后按错峰延迟播放入场动画。页面滚动时追踪模块曝光与停留，用于运营判断；刷新有两条通道，下拉手动刷新与前台定时刷新，两者都会重新请求数据并写回缓存。',
  },
  {
    image: flow04,
    title: '四通道通知轮询与点击深链',
    description:
      '新闻、校长信箱、学校概况、党建专题四条通道按基线检测更新，本地推送，点击通知直达对应内容。',
    longDescription:
      '四条相互独立的通道分别是新闻、校长信箱、学校概况与党建专题。每条通道保存上次结果的基线指纹，轮询时先比对指纹，只有发生变化才继续解析增量内容。发现更新后生成本地通知，用户点击通知时携带深链参数，直接跳转到对应的列表或详情页面。',
  },
  {
    image: flow05,
    title: '学校概况数据引擎',
    description:
      '学校简介、现任领导、校园风光与合作交流三路并行拉取，预热与代际校验保证内容与官网同步。',
    longDescription:
      '引擎同时发起三路请求：学校简介与现任领导、校园风光、合作交流。三路结果分别解析成结构化字段后合并为一份概况数据。合并前会做代际校验，比对版本指纹判断官网是否已更新；命中新版本时写入缓存并触发预热，保证下次进入概况页面时无需等待网络。',
  },
  {
    image: flow06,
    title: '党建专题双子站聚合引擎',
    description: '党建工作与思政专题两站索引解析、并发分页全量聚合，支持加权全文搜索。',
    longDescription:
      '引擎分别解析党建工作站与思政专题站的栏目索引，按栏目并发抓取分页列表并翻页到最后一页，再将两站结果按标题与时间去重合并。合并后的全量数据建立加权全文搜索索引，标题权重高于正文，用户可在两个专题内统一检索。',
  },
  {
    image: flow07,
    title: '校长信箱业务闭环',
    description: '从入口到信件详情、拨号与官网写信，再到更新提醒，构成用户与校方沟通的完整闭环。',
    longDescription:
      '闭环起点是校长信箱入口，进入后展示信件列表，可打开单封信件详情阅读来信与回复。需要联系校方时，用户可以拨打电话或跳转学校官网写新信件。信件状态发生变化时，更新提醒沿原路径回到列表与详情，形成从查看到反馈的完整往返。',
  },
  {
    image: flow08,
    title: '机构子站全域搜索流水线',
    description:
      '机构树解析、站点匹配、常规与深度两级检索、并发批处理与详情降级，机构资讯全域可搜。',
    longDescription:
      '流水线先解析学校机构树，把每个机构与其子站地址匹配起来；检索分两级，常规检索查索引，未命中时进入深度检索直接抓取子站页面。抓取采用并发批处理控制压力，详情页解析失败时降级为列表摘要展示，保证任何机构子站的内容都能被搜到。',
  },
  {
    image: flow09,
    title: '图片系统与三级缓存流水线',
    description: '统一入口、降采样解码、双限内存缓存与磁盘缓存，兼顾加载速度与流量节省。',
    longDescription:
      '所有图片请求先经过统一入口，再按显示尺寸做降采样解码，避免整图解码占用内存。缓存分三级：两级内存缓存分别受容量与条目数双重上限约束，未命中时查磁盘缓存，仍未命中才回源网络下载。命中顺序自上而下，写入时反向回填，兼顾加载速度与流量节省。',
  },
  {
    image: flow10,
    title: '显示与个性化设置全景',
    description: '外观排版、屏幕、内容阅读五大设置域全实时生效，深浅色、字号与主题色随心定制。',
    longDescription:
      '设置分为外观、排版、屏幕、内容与阅读五个区域。每个区域的改动都会立即作用到当前界面，无需重启：深浅色与主题色改变配色，字号与行距调整正文排版，屏幕方向与亮度影响显示，内容与阅读设置控制列表密度和阅读模式。所有偏好保存在本地，下次启动自动恢复。',
  },
] as const;

export const architectureFigures: readonly ArchitectureFigure[] = figures.map((item, i) => ({
  index: i + 1,
  ...item,
}));
