import { describe, expect, it } from 'vitest';

import {
  getLatestReleasedRelease,
  getRecentReleases,
  groupReleaseChanges,
  releaseAnchor,
  releaseCategoryMeta,
  releases,
} from '@/data/releases';

describe('版本更新数据', () => {
  it('版本号唯一且符合语义化格式', () => {
    const versions = releases.map((release) => release.version);
    expect(new Set(versions).size).toBe(versions.length);
    for (const version of versions) {
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it('已发布版本必须有日期，待发布版本必须为空', () => {
    for (const release of releases) {
      if (release.status === 'released') {
        expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      } else {
        expect(release.date).toBeNull();
      }
    }
  });

  it('每条更新都有标题、摘要与至少一条变更', () => {
    for (const release of releases) {
      expect(release.title.length).toBeGreaterThan(1);
      expect(release.summary.length).toBeGreaterThan(10);
      expect(release.changes.length).toBeGreaterThan(0);
    }
  });

  it('锚点稳定且可用于深链', () => {
    expect(releaseAnchor('1.0.0')).toBe('v1-0-0');
    expect(releaseAnchor('2.1.0-beta.1')).toBe('v2-1-0-beta-1');
  });

  it('首页预览不超过指定条数', () => {
    expect(getRecentReleases(3)).toHaveLength(Math.min(3, releases.length));
    expect(getRecentReleases(0)).toHaveLength(0);
  });

  it('变更按新增/改进/修复分组，空分组不输出', () => {
    const [first] = releases;
    expect(first).toBeDefined();
    if (!first) return;

    const groups = groupReleaseChanges(first);
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.label).toBe(releaseCategoryMeta[group.category].label);
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it('当前没有已发布版本', () => {
    expect(getLatestReleasedRelease()).toBeUndefined();
  });
});
