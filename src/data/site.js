// Site-wide data available to every Handlebars template as the base context.
// Page-specific data (see `pages` below) is merged on top per page.
//
// Edit `nav` to change the top navigation everywhere at once — the header
// partial renders it with an {{#each}} loop.
export const site = {
  siteName: 'Frontend Starter',
  nav: [
    { href: '/index.html', label: 'Home' },
    { href: '/pages.html', label: 'Pages' },
    { href: '/typology.html', label: 'Typology' }
  ]
};

// Per-page context, keyed by the HTML entry file name. `title` and
// `description` are injected into <head> by the shared layout partial.
// Add a page by creating `my-page.html`, registering it in
// `vite.config.ts` (build.rollupOptions.input), and adding an entry here.
export const pages = {
  'index.html': {
    title: 'Frontend Starter',
    description: 'A lightweight Vite + TypeScript + SCSS + Bootstrap 5 frontend starter.'
  },
  'pages.html': {
    title: 'Pages — Frontend Starter',
    description: 'Example page powered by a native-JS entry instead of TypeScript.'
  },
  'typology.html': {
    title: 'Typology — Frontend Starter',
    description: 'Typography and component reference page for quick visual checks.'
  }
};
