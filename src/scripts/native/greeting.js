// Plain native ES module (no TypeScript). It is bundled by Vite just like TS,
// and can be imported from both .ts and .js files. JSDoc gives you optional
// type hints without switching to TypeScript.

/**
 * Write a "hello from native JS" note into the given element.
 * @param {string} selector - CSS selector of the target element.
 * @param {string} [message] - Optional custom message.
 * @returns {boolean} true if the element was found and updated.
 */
export function mountGreeting(selector, message = 'Hello from native JS (bundled) ✅') {
  const el = document.querySelector(selector);
  if (!el) {
    return false;
  }
  el.textContent = message;
  el.classList.add('native-note');
  return true;
}
