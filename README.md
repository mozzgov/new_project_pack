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
│   └── vendor/           # verbatim external assets -> dist/vendor
│       ├── css/vendor-theme.css
│       └── js/vendor-widget.js
├── src/
│   ├── main.ts           # TS entry (index.html, typology.html)
│   ├── pages.js          # native-JS entry (pages.html) — no TypeScript
│   ├── partials/         # shared HTML fragments (header, footer)
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

Third-party or hand-written files that must ship **as-is** (unbundled, unhashed) go in `public/vendor/`. Everything under `public/` is copied to the site root, so `public/vendor/...` → `dist/vendor/...`. Reference them by absolute path in HTML:

```html
<link rel="stylesheet" href="/vendor/css/vendor-theme.css" />
<script src="/vendor/js/vendor-widget.js" defer></script>
```

Use this for classic (non-module) scripts, prebuilt libraries, or any CSS/JS you don't want Vite to touch. Use the bundled paths above (imports from `src/`) when you *do* want hashing, minification and tree-shaking.

## Static assets

Put files that must be served verbatim (favicons, web fonts, `robots.txt`, `vendor/`) in `public/`; they land at the site root. Import images/fonts from `src/` instead to let Vite hash and optimize them.
