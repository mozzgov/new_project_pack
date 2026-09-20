# Frontend Starter

Lightweight, modern frontend starter: **Vite + TypeScript + SCSS + Bootstrap 5**. Clone it and start building — instant HMR in dev, optimized Rollup build for production.

## Stack

- **Vite 8** — dev server with hot module replacement, production bundling.
- **TypeScript** — strict mode, native ESM.
- **SCSS** via `sass-embedded` with the modern `@use` module system.
- **Bootstrap 5.3** — opt-in components for both CSS and JS (ship only what you use).
- **ESLint 9** (flat config) + **Prettier**.
- Multi-page with a zero-dependency HTML partials plugin (shared header/footer).

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start Vite dev server with HMR                 |
| `npm run build`     | Production build to `dist/`                    |
| `npm run preview`   | Serve the production build locally             |
| `npm run typecheck` | `tsc --noEmit`                                 |
| `npm run lint`      | ESLint over the project                        |
| `npm run format`    | Prettier write                                 |

## Structure

```
.
├── index.html            # entry pages live at the project root
├── pages.html
├── typology.html
├── public/               # copied as-is to the site root
│   ├── favicon.ico
│   └── favicon-32x32.png
├── src/
│   ├── main.ts           # TS entry (index.html, typology.html)
│   ├── pages.js          # native-JS entry (pages.html) — no TypeScript
│   ├── partials/         # shared HTML fragments (header, footer)
│   ├── css/vendor/       # verbatim external CSS -> dist/css/vendor
│   ├── js/vendor/        # verbatim external JS  -> dist/js/vendor
│   ├── scripts/
│   │   ├── bootstrap.ts  # toggle Bootstrap JS plugins here
│   │   ├── native/       # plain native JS modules (bundled)
│   │   └── modules/      # your TS modules (menu, smooth scroll, ...)
│   └── styles/
│       ├── main.scss     # SCSS entry (@use graph)
│       ├── custom.css    # plain CSS example (bundled)
│       ├── abstracts/    # variables, mixins (no CSS output)
│       ├── base/         # reset, fonts, helpers
│       ├── layout/       # header, footer
│       └── vendor/bootstrap/
│           ├── _index.scss       # Bootstrap import chain (required parts)
│           ├── _components.scss   # toggle Bootstrap CSS components
│           └── _variables.scss    # Bootstrap overrides
├── vite.config.ts
└── eslint.config.js
```

## Enabling only the Bootstrap you need

**CSS** — comment/uncomment components in `src/styles/vendor/bootstrap/_components.scss`. Required base parts (reboot, type, containers, forms, buttons, utilities API) live in `_index.scss`. Override Bootstrap variables in `_variables.scss`. To drop Bootstrap entirely, remove `@use 'vendor/bootstrap';` from `src/styles/main.scss`.

**JS** — enable plugins in `src/scripts/bootstrap.ts`. Each import registers that plugin's `data-bs-*` API; unused plugins are tree-shaken out of the bundle.

## HTML partials & multi-page

Inline a shared fragment anywhere in an HTML page:

```html
<!-- @include src/partials/header.html -->
```

Includes resolve from the project root and expand recursively (see the tiny plugin in `vite.config.ts`). Add a new page by creating `some-page.html` at the root and registering it in `vite.config.ts` under `build.rollupOptions.input`.

## Scripts & styles: TS, native JS, plain CSS

The starter is not TypeScript-only. You have three ways to include code, pick per file:

**1. Bundled TypeScript** — `src/**/*.ts`, imported from an entry. Type-checked, tree-shaken, minified.

**2. Bundled native JS** — `src/**/*.js`, plain ES modules (no TS). Bundled exactly like TS and fully interoperable: `.ts` can import `.js` and vice-versa (`allowJs` is on; add JSDoc for optional type hints). A whole page can run on native JS — `pages.html` uses the native entry `src/pages.js`.

**3. Bundled plain CSS** — `src/**/*.css`, imported from JS/TS (e.g. `import './styles/custom.css'`). Bundled together with the SCSS output; no Sass pipeline required.

```ts
// src/main.ts
import './styles/main.scss'; // SCSS
import './styles/custom.css'; // plain CSS
import { mountGreeting } from './scripts/native/greeting.js'; // native JS from TS
```

## Vendor / verbatim assets → dist

Third-party or hand-written files that must ship **as-is** (unbundled, unhashed) go in `src/css/vendor/` and `src/js/vendor/`. A tiny zero-dependency plugin (`srcVendor()` in `vite.config.ts`) copies them verbatim to `dist/css/vendor/...` and `dist/js/vendor/...` (preserving subpaths, no hashing) and serves them at the same URLs in dev. This works in both the default and `wp` builds. Reference them by absolute path in HTML:

```html
<link rel="stylesheet" href="/css/vendor/vendor-theme.css" />
<script src="/js/vendor/vendor-widget.js" defer></script>
```

Use this for classic (non-module) scripts, prebuilt libraries, or any CSS/JS you don't want Vite to touch. Use the bundled paths above (imports from `src/`) when you *do* want hashing, minification and tree-shaking.

## Use inside a WordPress / CMS theme

When the site is rendered by a backend (WordPress, etc.) that enqueues the built assets from the theme's `dist/`, use the **`wp` mode**. It builds a single, predictable entry — `dist/assets/main.js` + `dist/assets/main.css` (no content hashes, no HTML) — so your `functions.php` can reference fixed paths that don't change on every rebuild.

Develop with auto-rebuild into `dist/`, then just refresh the page (e.g. `testsite.local/catalog/`):

```bash
npm run watch:wp    # rebuild dist/ on every src change (stable names)
npm run build:wp    # one-off production build for the theme
```

`functions.php` — enqueue with `filemtime` cache-busting (so a rebuild busts the browser cache) and load `main.js` as an ES module:

```php
add_action('wp_enqueue_scripts', function () {
    $dir = get_template_directory() . '/dist/assets';
    $uri = get_template_directory_uri() . '/dist/assets';

    wp_enqueue_style('theme-main', "$uri/main.css", [],
        file_exists("$dir/main.css") ? filemtime("$dir/main.css") : null);

    wp_enqueue_script('theme-main', "$uri/main.js", [],
        file_exists("$dir/main.js") ? filemtime("$dir/main.js") : null, true);
});

// main.js is an ES module — emit type="module".
add_filter('script_loader_tag', function ($tag, $handle, $src) {
    return $handle === 'theme-main'
        ? '<script type="module" src="' . esc_url($src) . '"></script>' . "\n"
        : $tag;
}, 10, 3);
```

Assets from `public/` (fonts, favicon) and verbatim vendor files (`src/css/vendor`, `src/js/vendor` → `dist/css/vendor`, `dist/js/vendor`) still land in `dist/` and are referenced by absolute theme path. If you'd rather keep Vite's HMR instead of refreshing, use the "Backend Integration" note in `vite.config.ts` (`manifest: true`) and point the theme at `http://localhost:3000/@vite/client` during dev.

## Static assets

Put files that must be served verbatim (favicons, web fonts, `robots.txt`) in `public/`; they land at the site root. For verbatim CSS/JS use `src/css/vendor` and `src/js/vendor` (see "Vendor / verbatim assets" above). Import images/fonts from `src/` instead to let Vite hash and optimize them.
