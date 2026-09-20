type MenuToggleOptions = {
  menuSelector: string;
  toggleSelector: string;
  openClass?: string;
  activeClass?: string;
  animationDuration?: number;
};

const DEFAULT_OPTIONS: Required<Omit<MenuToggleOptions, 'menuSelector' | 'toggleSelector'>> = {
  openClass: 'is-open',
  activeClass: 'open',
  animationDuration: 300
};

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function animateMenu(menu: HTMLElement, opening: boolean, duration: number): Promise<void> {
  if (opening) {
    menu.style.display = 'flex';
  }

  const initialHeight = opening ? 0 : menu.scrollHeight;

  if (opening) {
    menu.style.height = 'auto';
  }

  const targetHeight = opening ? menu.scrollHeight : 0;

  // Respect the user's motion preference: open/close instantly, no animation.
  const canAnimate = typeof menu.animate === 'function' && !prefersReducedMotion();

  if (!canAnimate) {
    menu.style.display = opening ? 'flex' : 'none';
    menu.style.height = '';
    menu.style.opacity = '';
    menu.style.overflow = '';
    return Promise.resolve();
  }

  menu.style.overflow = 'hidden';
  menu.style.height = `${initialHeight}px`;

  return menu
    .animate(
      [
        { height: `${initialHeight}px`, opacity: opening ? 0 : 1 },
        { height: `${targetHeight}px`, opacity: opening ? 1 : 0 }
      ],
      {
        duration,
        easing: 'ease-in-out',
        fill: 'forwards'
      }
    )
    .finished.then(() => {
      menu.style.overflow = '';
      menu.style.height = '';
      menu.style.opacity = '';

      if (!opening) {
        menu.style.display = 'none';
      }
    });
}

export function initMenuToggle(options: MenuToggleOptions): void {
  const { menuSelector, toggleSelector, openClass, activeClass, animationDuration } = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  const menu = document.querySelector<HTMLElement>(menuSelector);
  const toggles = Array.from(document.querySelectorAll<HTMLElement>(toggleSelector));

  if (!menu || toggles.length === 0) {
    return;
  }

  menu.style.display = 'none';
  let isAnimating = false;

  // A11y: wire toggles to the menu. Reflect state via aria-expanded, and point
  // aria-controls at the menu's id (generating one if needed) so assistive tech
  // knows which element each toggle operates.
  if (!menu.id) {
    menu.id = 'menu-toggle-target';
  }
  toggles.forEach((toggle) => {
    toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
  });

  const setExpanded = (expanded: boolean) => {
    toggles.forEach((toggle) => toggle.setAttribute('aria-expanded', String(expanded)));
  };

  const openMenu = async (toggle: HTMLElement) => {
    toggle.classList.add(activeClass);
    menu.classList.add(openClass);
    setExpanded(true);
    await animateMenu(menu, true, animationDuration);
  };

  const closeMenu = async (toggle: HTMLElement) => {
    toggle.classList.remove(activeClass);
    menu.classList.remove(openClass);
    setExpanded(false);
    await animateMenu(menu, false, animationDuration);
  };

  const runToggle = (toggle: HTMLElement, shouldOpen: boolean) => {
    if (isAnimating) {
      return;
    }
    isAnimating = true;
    void (shouldOpen ? openMenu(toggle) : closeMenu(toggle)).finally(() => {
      isAnimating = false;
    });
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      const isActive = toggle.classList.contains(activeClass);
      runToggle(toggle, !isActive);
    });
  });

  // A11y: Escape closes the menu when it is open, restoring focus context.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }
    if (!menu.classList.contains(openClass)) {
      return;
    }
    const activeToggle = toggles.find((toggle) => toggle.classList.contains(activeClass)) ?? toggles[0];
    runToggle(activeToggle, false);
  });
}
