/**
 * 日期格式化：统一按中文展示（如「2026年10月23日」）。
 * 使用固定时区避免构建环境差异导致日期偏移。
 */
const FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Shanghai',
});

export function formatDate(date: Date): string {
  return FORMATTER.format(date);
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
