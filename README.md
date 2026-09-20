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
├── public/               # copied as-is to the site root (favicon, fonts, ...)
├── src/
│   ├── main.ts           # app entry: imports styles, Bootstrap JS, modules
│   ├── partials/         # shared HTML fragments (header, footer)
│   ├── scripts/
│   │   ├── bootstrap.ts  # toggle Bootstrap JS plugins here
│   │   └── modules/      # your TS modules (menu, smooth scroll, ...)
│   └── styles/
│       ├── main.scss     # style entry (@use graph)
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

## Static assets

Put files that must be served verbatim (favicons, web fonts, robots.txt) in `public/`; they land at the site root. Import images/fonts from `src/` to let Vite hash and optimize them.
