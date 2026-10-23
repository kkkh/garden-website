import { track } from '@/lib/analytics';

interface LightboxItem {
  readonly index: number;
  readonly full: string;
  readonly alt: string;
  readonly caption: string;
}

function readItems(group: string): LightboxItem[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[data-lightbox-item][data-lightbox-group="${group}"]`),
  )
    .map((element) => ({
      index: Number(element.dataset.lightboxIndex ?? 0),
      full: element.dataset.lightboxFull ?? '',
      alt: element.dataset.lightboxAlt ?? '',
      caption: element.dataset.lightboxCaption ?? '',
    }))
    .filter((item) => item.full !== '')
    .sort((a, b) => a.index - b.index);
}

export class Lightbox {
  private readonly dialog: HTMLDialogElement;
  private readonly image: HTMLImageElement;
  private readonly figure: HTMLElement;
  private readonly caption: HTMLElement;
  private readonly count: HTMLElement;
  private readonly title: HTMLElement;
  private items: LightboxItem[] = [];
  private index = 0;
  private trigger: HTMLElement | null = null;
  private readonly preloaded = new Set<string>();

  constructor(dialog: HTMLDialogElement) {
    this.dialog = dialog;
    this.image = dialog.querySelector<HTMLImageElement>('[data-lightbox-image]')!;
    this.figure = dialog.querySelector<HTMLElement>('[data-lightbox-figure]')!;
    this.caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]')!;
    this.count = dialog.querySelector<HTMLElement>('[data-lightbox-count]')!;
    this.title = dialog.querySelector<HTMLElement>('[data-lightbox-title]')!;
  }

  init(): void {
    document.addEventListener('click', (event) => {
      const trigger = (event.target as Element | null)?.closest<HTMLElement>(
        '[data-lightbox-trigger]',
      );
      if (!trigger) return;
      event.preventDefault();
      this.open(trigger);
    });

    // 指针悬停即预取高清图，点击放大时更快就位（每种图只取一次）。
    document.addEventListener('pointerover', (event) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>('[data-lightbox-full]');
      const src = target?.dataset.lightboxFull;
      if (!src || this.preloaded.has(src)) return;

      this.preloaded.add(src);
      const preload = new Image();
      preload.src = src;
    });

    this.dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => {
      this.close();
    });

    this.dialog
      .querySelector('[data-lightbox-prev]')
      ?.addEventListener('click', () => this.navigate(-1));
    this.dialog
      .querySelector('[data-lightbox-next]')
      ?.addEventListener('click', () => this.navigate(1));

    this.dialog.addEventListener('keydown', (event) => {
      if (!this.dialog.open) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.navigate(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.navigate(1);
      }
    });

    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.close();
    });

    this.dialog.addEventListener('close', () => {
      document.body.classList.remove('is-locked');
      this.image.removeAttribute('src');
      this.image.alt = '';
      this.trigger?.focus();
      this.trigger = null;
    });

    this.image.addEventListener('load', () => {
      this.figure.classList.remove('is-loading', 'is-error');
    });

    this.image.addEventListener('error', () => {
      this.figure.classList.remove('is-loading');
      this.figure.classList.add('is-error');
    });
  }

  private open(trigger: HTMLElement): void {
    const group = trigger.dataset.lightboxGroup ?? 'default';
    const items = readItems(group);
    if (items.length === 0) return;

    this.items = items;
    this.index = Math.max(
      0,
      Math.min(
        items.length - 1,
        items.findIndex((item) => item.index === Number(trigger.dataset.lightboxIndex ?? 0)),
      ),
    );
    this.trigger = trigger;

    const groupTitle = trigger.dataset.lightboxGroupTitle ?? '查看大图';
    this.title.textContent = groupTitle;
    this.dialog.showModal();
    document.body.classList.add('is-locked');
    this.render();
  }

  private close(): void {
    if (this.dialog.open) this.dialog.close();
  }

  private navigate(delta: number): void {
    if (this.items.length === 0) return;
    this.index = (this.index + delta + this.items.length) % this.items.length;
    this.render();
    track('lightbox:navigate', {
      group: this.trigger?.dataset.lightboxGroup ?? 'unknown',
      index: this.index + 1,
      total: this.items.length,
    });
  }

  private render(): void {
    const item = this.items[this.index];
    if (!item) return;

    this.figure.classList.add('is-loading');
    this.figure.classList.remove('is-error');
    this.image.src = item.full;
    this.image.alt = item.alt;
    this.caption.textContent = item.caption;
    this.count.textContent = `${String(this.index + 1).padStart(2, '0')} / ${String(
      this.items.length,
    ).padStart(2, '0')}`;

    const next = this.items[(this.index + 1) % this.items.length];
    if (next && next.full !== item.full) {
      const preload = new Image();
      preload.src = next.full;
    }

    this.image.decode?.().catch(() => {
      this.figure.classList.remove('is-loading');
      this.figure.classList.add('is-error');
    });
  }
}

export function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  if (!dialog) return;
  const lightbox = new Lightbox(dialog);
  lightbox.init();
}
