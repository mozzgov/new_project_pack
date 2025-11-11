import { initMenuToggle, initHeaderBackgroundToggle, initSmoothScroll } from './modules';

document.addEventListener('DOMContentLoaded', () => {
  initHeaderBackgroundToggle();

  initMenuToggle({
    menuSelector: '.header_nav',
    toggleSelector: '.menu_open_close',
    activeClass: 'open',
    animationDuration: 350
  });

  initSmoothScroll({
    linkSelector: 'a.down[href^="#"]',
    defaultOffset: 0
  });
});

