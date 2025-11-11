const SCROLL_THRESHOLD = 150;

function getScrollTop(): number {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function initHeaderBackgroundToggle(headerSelector = '.js-header-bg'): void {
  const header = document.querySelector<HTMLElement>(headerSelector);
  if (!header) {
    return;
  }

  const toggleBackground = () => {
    const scrollTop = getScrollTop();
    if (scrollTop >= SCROLL_THRESHOLD) {
      header.classList.add('header-bg');
    } else {
      header.classList.remove('header-bg');
      header.style.removeProperty('background');
    }
  };

  window.addEventListener('scroll', toggleBackground, { passive: true });
  toggleBackground();
}

