import { initAnalytics } from '@/lib/analytics';
import { initThemeToggle } from '@/lib/theme';
import { initMobileNav } from '@/scripts/mobile-nav';
import { initHeader } from '@/scripts/header';
import { initHeroTilt } from '@/scripts/hero-tilt';
import { initLightbox } from '@/scripts/lightbox';
import { initReveal } from '@/scripts/reveal';
import { initLegalToc } from '@/scripts/legal-toc';
import { ScreenshotCarousel } from '@/scripts/carousel';

let carousel: ScreenshotCarousel | null = null;

function initCarousel(): void {
  const root = document.querySelector<HTMLElement>('[data-carousel]');
  if (!root) return;

  try {
    carousel = new ScreenshotCarousel(root);
    carousel.init();
    window.__gardenCarouselReady = true;
    bindShotTargets();
  } catch (error) {
    // 兜底：脚本失败时仍显示第一张截图与说明，不阻塞页面其他功能。
    console.error('[garden] 轮播初始化失败', error);
    const first = root.querySelector<HTMLElement>('[data-carousel-slide]');
    first?.setAttribute('data-active', 'true');
  }
}

/** 功能卡等处的「查看某张界面」链接：先切到目标截图，再滚动到轮播。 */
function bindShotTargets(): void {
  document.addEventListener('click', (event) => {
    const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-shot-target]');
    if (!trigger) return;

    const target = Number(trigger.dataset.shotTarget ?? '');
    if (!Number.isFinite(target) || target < 1) return;

    carousel?.go(target - 1, 'programmatic');
  });
}

function boot(): void {
  initAnalytics();
  initThemeToggle((preference, resolved) => {
    document.dispatchEvent(
      new CustomEvent('garden:theme-change', { detail: { preference, resolved } }),
    );
  });
  initMobileNav();
  initHeader();
  initHeroTilt();
  initLightbox();
  initCarousel();
  initLegalToc();
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
