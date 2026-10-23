import type { ImageMetadata } from 'astro';

export interface Screenshot {
  /** 1-based 序号，用于展示与埋点 */
  readonly index: number;
  readonly image: ImageMetadata;
  readonly alt: string;
  readonly caption: string;
}

export interface ArchitectureFigure {
  readonly index: number;
  readonly image: ImageMetadata;
  readonly title: string;
  readonly description: string;
  /** 供读屏使用的长文本替代描述，补充图中分层与流程细节。 */
  readonly longDescription: string;
}

export type FeatureIcon =
  'aggregate' | 'news' | 'departments' | 'overview' | 'admissions' | 'privacy';

export interface Feature {
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly icon: FeatureIcon;
  /** 关联截图序号（1-based），用于“查看相关界面” */
  readonly targetShot: number;
  readonly targetLabel: string;
}

export interface IntroCard {
  readonly index: string;
  readonly title: string;
  readonly body: string;
}

export type SystemIcon = 'device' | 'permissions' | 'network' | 'storage';

export interface SystemGroup {
  readonly title: string;
  readonly icon: SystemIcon;
  readonly items: readonly string[];
}

export interface Fact {
  readonly value: string;
  readonly label: string;
}
