import type { Fact, Feature, IntroCard, SystemGroup } from './types';

export const facts: readonly Fact[] = [
  { value: '44', label: '本科专业' },
  { value: '35', label: '机构与子站' },
  { value: '22', label: '真机界面' },
  { value: '0', label: '注册与信息收集' },
];

export const introCards: readonly IntroCard[] = [
  {
    index: '01',
    title: '园枢是什么',
    body: '面向山西晋中理工学院师生、考生与家长的校园信息聚合应用。它把分散在学校官网各栏目、各子站中的要闻、公告、院系专业、招生讯息与校园风光，汇集到一个入口。',
  },
  {
    index: '02',
    title: '园枢解决什么问题',
    body: '过去获取学校信息需要在多个网站之间跳转，重要通知容易错过。园枢用统一聚合与本地通知集中呈现动态；网络不佳时，也能依靠本地缓存继续阅读。',
  },
  {
    index: '03',
    title: '园枢给谁用',
    body: '在校师生掌握校园资讯、查询院系与机构；考生与家长在招生季了解专业、计划与办学数据；校友与社会公众也能关注学校荣誉、党建动态与校园影像。',
  },
  {
    index: '04',
    title: '轻量、可信、尊重隐私',
    body: '无需注册登录，不收集个人信息，不含支付功能。浏览偏好、收藏与设置仅保存在设备本地；需要联网时只拉取学校公开信息，卸载应用即可清除全部本地数据。',
  },
];

export const features: readonly Feature[] = [
  {
    index: '01',
    title: '校园信息聚合首页',
    description:
      '聚合学校要闻、通知公告、校园荣誉、教师风采、学生故事、校园视频与风光图集。模块支持排序与隐藏，把最关心的内容放到最前面。',
    icon: 'aggregate',
    targetShot: 1,
    targetLabel: '查看首页界面',
  },
  {
    index: '02',
    title: '新闻资讯与消息中心',
    description:
      '资讯按分类筛选，支持搜索、收藏、已读标记与阅读时长预估；五通道消息中心汇总新闻、校长信箱、学校概况、党建专题与收藏更新。',
    icon: 'news',
    targetShot: 17,
    targetLabel: '查看消息中心',
  },
  {
    index: '03',
    title: '院系与专业查询',
    description:
      '覆盖学校全部教学机构与 44 个本科专业，从院系列表直达院系详情与专业介绍，帮助考生、家长与在校师生快速了解学科布局。',
    icon: 'departments',
    targetShot: 6,
    targetLabel: '查看院系设置',
  },
  {
    index: '04',
    title: '学校概况一站式',
    description:
      '学校简介、现任领导、校徽校名、宣传片、校园风光与合作交流集中呈现；校长信箱公开可查来信与回复，党建专题一站检索党建与思政内容。',
    icon: 'overview',
    targetShot: 9,
    targetLabel: '查看学校概况',
  },
  {
    index: '05',
    title: '招生资讯与校园生活',
    description:
      '独立招生频道与专业介绍，招生季信息直达；校园视频、校园日历、教务图书等服务快捷通道与校史时间线，让在校生活更便利。',
    icon: 'admissions',
    targetShot: 5,
    targetLabel: '查看招生专区',
  },
  {
    index: '06',
    title: '安全与个性化',
    description:
      '支持 Face ID / Touch ID 应用锁保护隐私内容；深浅色模式、多款主题色、6 档字号、屏幕常亮等个性化显示；内置 31 篇图文使用帮助。',
    icon: 'privacy',
    targetShot: 20,
    targetLabel: '查看设置中心',
  },
];

export const systemGroups: readonly SystemGroup[] = [
  {
    title: '运行环境',
    icon: 'device',
    items: ['支持 iOS 26.0 及以上版本', '可在 iPhone 与 iPad 上运行', '界面完全本地渲染，启动迅速'],
  },
  {
    title: '系统权限及用途',
    icon: 'permissions',
    items: [
      'Face ID / Touch ID：应用安全锁解锁，生物特征由系统安全芯片处理，园枢不获取、不存储',
      '相册（仅写入）：保存校园风光、现任领导、校徽校名等公开图片，不读取相册内容',
      '通知：校园资讯更新提醒，可随时在系统设置中关闭',
      '不申请：相机、麦克风、定位、通讯录、后台运行等权限',
    ],
  },
  {
    title: '网络使用',
    icon: 'network',
    items: [
      '仅在用户同意后，联网拉取学校官网公开信息与官方公告文本用于展示',
      '无注册登录、无账号体系，不收集、不上传任何用户数据',
      '网络异常时自动降级为本地缓存与内置内容，离线可用',
    ],
  },
  {
    title: '数据存储',
    icon: 'storage',
    items: [
      '界面设置、收藏记录、已读标记、内容缓存与运行日志仅保存在设备本地',
      '敏感令牌使用系统钥匙串加密存储',
      '卸载园枢即可清除全部本地数据',
    ],
  },
];
