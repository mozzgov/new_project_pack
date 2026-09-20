import './styles/main.scss';
import './styles/custom.css'; // plain CSS, bundled alongside SCSS
import './scripts/bootstrap';

import {
  initHeaderBackgroundToggle,
  initMenuToggle,
  initSmoothScroll
} from './scripts/modules';
import { mountGreeting } from './scripts/native/greeting.js'; // TS importing native JS

document.addEventListener('DOMContentLoaded', () => {
  mountGreeting('#native-note');

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
