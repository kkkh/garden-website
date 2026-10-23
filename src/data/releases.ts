/**
 * 版本更新日志单一数据源。
 *
 * 首页预览与 `/changelog.html` 共用同一份数据；`appInfo` 的版本号与日期
 * 也从这里派生，避免两处维护。
 *
 * 约定：未发布的版本用 `upcoming` 且 `date: null`，不伪造发布日期。
 */

export type ReleaseStatus = 'released' | 'upcoming';
export type ReleaseCategory = 'added' | 'improved' | 'fixed';

export interface ReleaseChange {
  readonly category: ReleaseCategory;
  readonly text: string;
}

export interface Release {
  readonly version: string;
  readonly status: ReleaseStatus;
  /** YYYY-MM-DD；status 为 released 时必填，upcoming 时为 null。 */
  readonly date: string | null;
  readonly title: string;
  readonly summary: string;
  readonly changes: readonly ReleaseChange[];
  readonly appStoreUrl: string | null;
}

export const releaseCategoryMeta = {
  added: { label: '新增' },
  improved: { label: '改进' },
  fixed: { label: '修复' },
} as const satisfies Record<ReleaseCategory, { label: string }>;

export const releases: readonly Release[] = [
  {
    version: '1.0.0',
    status: 'upcoming',
    date: null,
    title: '首个公开版本',
    summary: '园枢 1.0 正在上架准备中；正式上架后，这里会记录每个版本的更新内容。',
    changes: [
      { category: 'added', text: '校园信息聚合首页与五大栏目' },
      { category: 'added', text: '院系专业、招生资讯与学校概况查询' },
      { category: 'improved', text: '深色模式、字号缩放与主题色设置' },
    ],
    appStoreUrl: null,
  },
];

export function releaseAnchor(version: string): string {
  return `v${version.replace(/[^0-9A-Za-z]+/g, '-')}`;
}

export function getRecentReleases(limit = 3): readonly Release[] {
  return releases.slice(0, Math.max(0, limit));
}

export function getLatestReleasedRelease(): Release | undefined {
  return releases.find((release) => release.status === 'released');
}

export function groupReleaseChanges(release: Release): readonly {
  category: ReleaseCategory;
  label: string;
  items: readonly ReleaseChange[];
}[] {
  return (Object.keys(releaseCategoryMeta) as ReleaseCategory[])
    .map((category) => ({
      category,
      label: releaseCategoryMeta[category].label,
      items: release.changes.filter((change) => change.category === category),
    }))
    .filter((group) => group.items.length > 0);
}
