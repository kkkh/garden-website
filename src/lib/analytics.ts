/**
 * 站点事件总线：本地埋点，不发送任何网络请求。
 *
 * 设计目标（见 docs/adr/ADR-0005-analytics.md）：
 * - 记录关键交互（轮播切换、灯箱打开、主题切换、导航点击、外链点击）以便本地调试与端到端测试断言；
 * - 不采集身份信息、不使用 Cookie、不请求第三方域名；
 * - 事件以 `CustomEvent` 形式派发到 document，测试与调试工具可订阅 `garden:event`。
 */

export type AnalyticsEventName =
  | 'nav:click'
  | 'cta:click'
  | 'showcase:change'
  | 'showcase:expand'
  | 'lightbox:navigate'
  | 'theme:change'
  | 'outbound:click'
  | 'legal:toc-click';

export interface AnalyticsPayload {
  readonly [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    __gardenEvents?: Array<{ name: AnalyticsEventName; payload: AnalyticsPayload; time: number }>;
  }
}

const MAX_BUFFER = 200;

export function track(name: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
  if (typeof document === 'undefined') return;

  const detail = { name, payload, time: Date.now() };

  if (typeof window !== 'undefined') {
    const buffer = (window.__gardenEvents ??= []);
    buffer.push(detail);
    if (buffer.length > MAX_BUFFER) buffer.shift();
  }

  document.dispatchEvent(new CustomEvent('garden:event', { detail }));
}

/**
 * 为站内可点击元素统一挂载埋点。
 * 通过 `data-track` 与 `data-track-*` 属性声明，避免在组件里散落监听器。
 */
export function initAnalytics(): void {
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest<HTMLElement>('[data-track]');
      if (!trigger) return;

      const name = trigger.dataset.track as AnalyticsEventName | undefined;
      if (!name) return;

      const payload: Record<string, string> = {};
      for (const [key, value] of Object.entries(trigger.dataset)) {
        if (key.startsWith('track') && key !== 'track' && value !== undefined) {
          payload[key.slice(5).toLowerCase()] = value;
        }
      }

      if (trigger instanceof HTMLAnchorElement && trigger.target === '_blank') {
        payload.href = trigger.href;
      }

      track(name, payload);
    },
    { capture: true },
  );
}
