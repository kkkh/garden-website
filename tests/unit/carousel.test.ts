import { describe, expect, it } from 'vitest';

import { formatIndex, isHorizontalSwipe, wrapIndex } from '@/scripts/carousel';

describe('wrapIndex', () => {
  it('在范围内保持原值', () => {
    expect(wrapIndex(0, 22)).toBe(0);
    expect(wrapIndex(21, 22)).toBe(21);
  });

  it('向后越界回到开头', () => {
    expect(wrapIndex(22, 22)).toBe(0);
    expect(wrapIndex(45, 22)).toBe(1);
  });

  it('向前越界回到末位', () => {
    expect(wrapIndex(-1, 22)).toBe(21);
    expect(wrapIndex(-23, 22)).toBe(21);
  });

  it('非法输入回退到 0 且不抛错', () => {
    expect(wrapIndex(Number.NaN, 22)).toBe(0);
    expect(wrapIndex(3, 0)).toBe(0);
    expect(wrapIndex(3, -1)).toBe(0);
  });

  it('小数索引向下取整', () => {
    expect(wrapIndex(2.9, 22)).toBe(2);
  });
});

describe('formatIndex', () => {
  it('两位补零', () => {
    expect(formatIndex(0)).toBe('01');
    expect(formatIndex(8)).toBe('09');
    expect(formatIndex(21)).toBe('22');
  });

  it('超过 99 自然增长为三位', () => {
    expect(formatIndex(99)).toBe('100');
  });
});

describe('isHorizontalSwipe', () => {
  it('明确的横向滑动通过', () => {
    expect(isHorizontalSwipe({ dx: -60, dy: 8 })).toBe(true);
    expect(isHorizontalSwipe({ dx: 60, dy: -8 })).toBe(true);
  });

  it('位移不足阈值不通过', () => {
    expect(isHorizontalSwipe({ dx: -20, dy: 0 })).toBe(false);
  });

  it('纵向占优不通过', () => {
    expect(isHorizontalSwipe({ dx: 60, dy: 90 })).toBe(false);
  });

  it('接近 45 度斜向滑动不通过', () => {
    expect(isHorizontalSwipe({ dx: 60, dy: 55 })).toBe(false);
  });

  it('自定义阈值生效', () => {
    expect(isHorizontalSwipe({ dx: 30, dy: 0, threshold: 20 })).toBe(true);
    expect(isHorizontalSwipe({ dx: 60, dy: 40, ratio: 2 })).toBe(false);
  });
});
