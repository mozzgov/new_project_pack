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

function animateMenu(menu: HTMLElement, opening: boolean, duration: number): Promise<void> {
  if (opening) {
    menu.style.display = 'flex';
  }

  const initialHeight = opening ? 0 : menu.scrollHeight;

  if (opening) {
    menu.style.height = 'auto';
  }

  const targetHeight = opening ? menu.scrollHeight : 0;

  const canAnimate = typeof menu.animate === 'function';

  if (!canAnimate) {
    if (!opening) {
      menu.style.display = 'none';
    } else {
      menu.style.display = 'flex';
    }
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

  const openMenu = async (toggle: HTMLElement) => {
    toggle.classList.add(activeClass);
    menu.classList.add(openClass);
    await animateMenu(menu, true, animationDuration);
  };

  const closeMenu = async (toggle: HTMLElement) => {
    toggle.classList.remove(activeClass);
    menu.classList.remove(openClass);
    await animateMenu(menu, false, animationDuration);
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', async (event) => {
      event.preventDefault();
      if (isAnimating) {
        return;
      }

      isAnimating = true;
      const isActive = toggle.classList.contains(activeClass);
      if (isActive) {
        await closeMenu(toggle);
      } else {
        await openMenu(toggle);
      }
      isAnimating = false;
    });
  });
}

