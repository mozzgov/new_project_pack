type SmoothScrollOptions = {
  linkSelector: string;
  defaultOffset?: number;
};

export function initSmoothScroll({ linkSelector, defaultOffset = 0 }: SmoothScrollOptions): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(linkSelector);

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetSelector = link.getAttribute('href');
      if (!targetSelector || !targetSelector.startsWith('#')) {
        return;
      }

      const target = document.querySelector<HTMLElement>(targetSelector);
      if (!target) {
        return;
      }

      event.preventDefault();
      const rawOffset = link.dataset.offsetdown;
      const offset =
        rawOffset !== undefined && rawOffset !== null ? Number(rawOffset) || 0 : defaultOffset;

      const top = target.getBoundingClientRect().top + window.scrollY + offset;

      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    });
  });
}

