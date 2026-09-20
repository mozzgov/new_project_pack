/* External/vendor JS served verbatim from src/js/vendor -> dist/js/vendor.
   Classic (non-module) script, not bundled or transpiled by Vite.
   Reference it directly in HTML:
   <script src="/js/vendor/vendor-widget.js" defer></script> */
(function () {
  'use strict';
  function init() {
    var el = document.getElementById('vendor-widget');
    if (!el) {
      return;
    }
    el.textContent = 'Vendor JS loaded from /vendor (verbatim) ✅';
    el.classList.add('vendor-badge');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
