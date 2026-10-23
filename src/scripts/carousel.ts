import { track } from '@/lib/analytics';

export interface SwipeGesture {
  readonly dx: number;
  readonly dy: number;
  readonly threshold?: number;
  readonly ratio?: number;
}

/** 环形索引归一化：-1 => 最后一张，total => 第一张。 */
export function wrapIndex(index: number, total: number): number {
  if (!Number.isFinite(index) || total <= 0) return 0;
  return ((Math.trunc(index) % total) + total) % total;
}

/** 两位序号（01…22）；超过 99 自然增长为三位。 */
export function formatIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/** 判断是否为横向、占优、超过阈值的滑动；纵向滑动返回 false。 */
export function isHorizontalSwipe({ dx, dy, threshold = 48, ratio = 1.2 }: SwipeGesture): boolean {
  return Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * ratio;
}

interface CarouselElements {
  readonly root: HTMLElement;
  readonly stage: HTMLElement;
  readonly rail: HTMLElement | null;
  readonly slides: readonly HTMLElement[];
  readonly thumbs: readonly HTMLButtonElement[];
  readonly current: HTMLElement | null;
  readonly captionTitle: HTMLElement | null;
  readonly captionBody: HTMLElement | null;
  readonly live: HTMLElement | null;
  readonly prev: HTMLButtonElement | null;
  readonly next: HTMLButtonElement | null;
  readonly expand: HTMLButtonElement | null;
}

function collect(root: HTMLElement): CarouselElements {
  const stage = root.querySelector<HTMLElement>('[data-carousel-stage]');
  if (!stage) throw new Error('[carousel] 缺少 [data-carousel-stage]');

  return {
    root,
    stage,
    rail: root.querySelector<HTMLElement>('.showcase__rail'),
    slides: Array.from(root.querySelectorAll<HTMLElement>('[data-carousel-slide]')),
    thumbs: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-carousel-thumb]')),
    current: root.querySelector<HTMLElement>('[data-carousel-current]'),
    captionTitle: root.querySelector<HTMLElement>('[data-carousel-caption-title]'),
    captionBody: root.querySelector<HTMLElement>('[data-carousel-caption-body]'),
    live: root.querySelector<HTMLElement>('[data-carousel-live]'),
    prev: root.querySelector<HTMLButtonElement>('[data-carousel-prev]'),
    next: root.querySelector<HTMLButtonElement>('[data-carousel-next]'),
    expand: root.querySelector<HTMLButtonElement>('[data-carousel-expand]'),
  };
}

export class ScreenshotCarousel {
  private readonly el: CarouselElements;
  private readonly total: number;
  private current = 0;
  private readonly preloaded = new Set<string>();
  private pointerStart: { id: number; x: number; y: number } | null = null;
  private readonly reducedMotion: boolean;

  constructor(root: HTMLElement) {
    this.el = collect(root);
    this.total = this.el.slides.length;
    this.reducedMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.total === 0) {
      throw new Error('[carousel] 没有幻灯片');
    }
  }

  init(): void {
    this.bind();
    this.sync(this.current, 'init');
    this.preloadAround(this.current);
  }

  go(
    index: number,
    source: 'arrow' | 'thumbnail' | 'keyboard' | 'swipe' | 'init' | 'programmatic',
  ): void {
    const next = wrapIndex(index, this.total);
    this.current = next;
    this.sync(next, source);
    this.preloadAround(next);

    track('showcase:change', {
      index: next + 1,
      total: this.total,
      source,
    });
  }

  next(): void {
    this.go(this.current + 1, 'arrow');
  }

  prev(): void {
    this.go(this.current - 1, 'arrow');
  }

  private sync(index: number, source: string): void {
    const activeSlide = this.el.slides[index];
    if (!activeSlide) return;

    for (const [i, slide] of this.el.slides.entries()) {
      const isActive = i === index;
      slide.dataset.active = String(isActive);
      slide.dataset.position = isActive ? 'active' : i < index ? 'before' : 'after';
      slide.setAttribute('aria-hidden', String(!isActive));
    }

    for (const [i, thumb] of this.el.thumbs.entries()) {
      const isActive = i === index;
      if (isActive) {
        thumb.setAttribute('aria-current', 'true');
        thumb.tabIndex = 0;
      } else {
        thumb.removeAttribute('aria-current');
        thumb.tabIndex = -1;
      }
    }

    if (this.el.current) this.el.current.textContent = formatIndex(index);

    const title = activeSlide.dataset.captionTitle ?? '';
    const body = activeSlide.dataset.captionBody ?? '';
    if (this.el.captionTitle) this.el.captionTitle.textContent = title;
    if (this.el.captionBody) this.el.captionBody.textContent = body;

    if (this.el.live) {
      this.el.live.textContent = `第 ${index + 1} 张，共 ${this.total} 张：${body || title}`;
    }

    if (this.el.expand) {
      this.el.expand.dataset.lightboxFull = activeSlide.dataset.lightboxFull ?? '';
      this.el.expand.dataset.lightboxAlt = activeSlide.dataset.lightboxAlt ?? '';
      this.el.expand.dataset.lightboxCaption = activeSlide.dataset.lightboxCaption ?? '';
      this.el.expand.dataset.lightboxGroup = 'screenshots';
      this.el.expand.dataset.lightboxIndex = String(index);
    }

    if (source !== 'init') {
      this.scrollThumbIntoView(index);
    }
  }

  private preloadAround(index: number): void {
    const offsets = [-1, 0, 1];
    for (const offset of offsets) {
      const target = this.el.slides[wrapIndex(index + offset, this.total)];
      if (!target) continue;
      const img = target.querySelector('img');
      if (!img) continue;
      const src = img.currentSrc || img.src;
      if (!src || this.preloaded.has(src)) continue;
      this.preloaded.add(src);
      const preload = new Image();
      preload.src = src;
    }
  }

  private scrollThumbIntoView(index: number): void {
    const thumb = this.el.thumbs[index];
    const rail = this.el.rail;
    if (!thumb || !rail) return;

    const overflow = rail.scrollWidth - rail.clientWidth;
    if (overflow <= 0) return;

    const railRect = rail.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const centered =
      rail.scrollLeft + (thumbRect.left - railRect.left) - (railRect.width - thumbRect.width) / 2;
    const next = Math.max(0, Math.min(overflow, centered));

    rail.scrollTo({
      left: next,
      behavior: this.reducedMotion ? 'auto' : 'smooth',
    });
  }

  private bind(): void {
    this.el.prev?.addEventListener('click', () => this.prev());
    this.el.next?.addEventListener('click', () => this.next());

    for (const [i, thumb] of this.el.thumbs.entries()) {
      thumb.addEventListener('click', () => this.go(i, 'thumbnail'));
      thumb.addEventListener('keydown', (event) => {
        const key = event.key;
        if (key === 'ArrowRight' || key === 'ArrowLeft' || key === 'Home' || key === 'End') {
          event.preventDefault();
          const target =
            key === 'Home'
              ? 0
              : key === 'End'
                ? this.total - 1
                : wrapIndex(this.current + (key === 'ArrowRight' ? 1 : -1), this.total);
          this.go(target, 'keyboard');
          this.el.thumbs[target]?.focus();
        }
      });
    }

    this.el.stage.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('button, a')) return;
      if (
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight' &&
        event.key !== 'Home' &&
        event.key !== 'End'
      ) {
        return;
      }
      event.preventDefault();
      const target =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? this.total - 1
            : this.current + (event.key === 'ArrowRight' ? 1 : -1);
      this.go(target, 'keyboard');
    });

    this.el.stage.addEventListener('pointerdown', (event) => {
      if (event.target instanceof Element && event.target.closest('button, a')) return;
      this.pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
      try {
        this.el.stage.setPointerCapture(event.pointerId);
      } catch {
        // 某些浏览器/合成事件不支持 pointer capture，松手逻辑仍可工作。
      }
    });

    this.el.stage.addEventListener('pointerup', (event) => {
      const start = this.pointerStart;
      this.pointerStart = null;
      try {
        this.el.stage.releasePointerCapture(event.pointerId);
      } catch {
        // 忽略释放失败
      }
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!isHorizontalSwipe({ dx, dy })) return;
      this.go(this.current + (dx < 0 ? 1 : -1), 'swipe');
    });

    // 阻止图片原生拖拽：否则浏览器会触发 drag 并取消 pointer 序列，导致滑动失效。
    this.el.stage.addEventListener('dragstart', (event) => {
      event.preventDefault();
    });

    this.el.stage.addEventListener('pointercancel', () => {
      this.pointerStart = null;
    });
  }
}
