// Native JS entry point (no TypeScript). pages.html loads this directly.
// It imports styles and modules exactly like the TS entry does.
import './styles/main.scss';
import './styles/custom.css';
import './scripts/bootstrap';
import { mountGreeting } from './scripts/native/greeting.js';

document.addEventListener('DOMContentLoaded', () => {
  mountGreeting('#native-note', 'Hello from a native-JS page entry ✅');
});
