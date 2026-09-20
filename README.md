# Frontend Starter

Lightweight, modern frontend starter: **Vite + TypeScript + SCSS + Bootstrap 5**. Clone it and start building — instant HMR in dev, optimized Rollup build for production.

## Stack

- **Vite 8** — dev server with hot module replacement, production bundling.
- **TypeScript** — strict mode, native ESM.
- **SCSS** via `sass-embedded` with the modern `@use` module system.
- **Bootstrap 5.3** — opt-in components for both CSS and JS (ship only what you use).
- **Autoprefixer** (PostCSS) driven by a `browserslist` field.
- **Handlebars** templating — shared layout + partials + per-page data (multi-page).
- **Image optimization** on build (`sharp` for raster, `svgo` for SVG).
- **ESLint 9** (flat config) + **Prettier**.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start Vite dev server with HMR                          |
| `npm run build`     | Production build to `dist/` (readable, non-minified)    |
| `npm run build:min` | Production build, minified (`--minify esbuild`)         |
| `npm run build:wp`  | WordPress/CMS build (stable `main.js`/`main.css` names) |
| `npm run preview`   | Serve the production build locally                      |
| `npm run typecheck` | `tsc --noEmit`                                          |
| `npm run lint`      | ESLint over the project                                 |
| `npm run format`    | Prettier write                                          |

## Structure

```
.
├── index.html            # entry pages live at the project root (Handlebars)
├── pages.html
├── typology.html
├── src/
│   ├── main.ts           # TS entry (index.html, typology.html)
│   ├── pages.js          # native-JS entry (pages.html) — no TypeScript
│   ├── data/site.js      # site-wide + per-page template data (title, nav, ...)
│   ├── partials/         # Handlebars: layout.hbs + header/footer partials
│   ├── img/              # images -> dist/img (optimized + verbatim copy)
│   │   └── favicon/       # favicon.ico, favicon-32x32.png
│   ├── fonts/            # web fonts -> dist/fonts (verbatim copy)
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
├── postcss.config.js     # autoprefixer (uses package.json "browserslist")
├── vite.config.ts
└── eslint.config.js
```

## Enabling only the Bootstrap you need

**CSS** — comment/uncomment components in `src/styles/vendor/bootstrap/_components.scss`. Required base parts (reboot, type, containers, forms, buttons, utilities API) live in `_index.scss`. Override Bootstrap variables in `_variables.scss`. To drop Bootstrap entirely, remove `@use 'vendor/bootstrap';` from `src/styles/main.scss`.

**JS** — enable plugins in `src/scripts/bootstrap.ts`. Each import registers that plugin's `data-bs-*` API; unused plugins are tree-shaken out of the bundle.

## Templating: layout, partials & page data (Handlebars)

Pages are [Handlebars](https://handlebarsjs.com/) templates compiled in both dev (`transformIndexHtml`) and build by the tiny `htmlTemplating()` plugin in `vite.config.ts`. Every `src/partials/*.hbs` file is registered as a partial (by base name).

**Shared layout.** Each page wraps its body in the shared layout (`src/partials/layout.hbs`), which owns `<head>`, the favicon links, and the `{{> header }}` / `{{> footer }}` partials:

```html
{{#> layout}}
  <h1>Hello</h1>
  <script type="module" src="/src/main.ts"></script>
{{/layout}}
```

**Partials.** Reference any partial with `{{> name }}`, e.g. `{{> header }}`, `{{> footer }}`.

**Page data.** Template data lives in `src/data/site.js`:

- `site` — shared on every page (e.g. `siteName` and the `nav` array).
- `pages` — per-page context keyed by file name; `title` and `description` are injected into `<head>`.

Each page is compiled with `{ ...site, ...pages['<file>.html'] }`. The header renders the nav with an `{{#each}}` loop:

```hbs
{{#each nav}}
<a href="{{this.href}}">{{this.label}}</a>
{{/each}}
```

**Add a page** in three steps:

1. Create `my-page.html` at the project root using `{{#> layout}} … {{/layout}}`.
2. Register it in `vite.config.ts` under `build.rollupOptions.input`.
3. Add its `title`/`description` to `pages` in `src/data/site.js`.

> Partial files are re-read on every transform, so edits appear live in dev. Changing `src/data/site.js` requires a dev-server restart (it is imported by the config).

## Scripts & styles: TS, native JS, plain CSS

The starter is not TypeScript-only. You have three ways to include code, pick per file:

**1. Bundled TypeScript** — `src/**/*.ts`, imported from an entry. Type-checked, tree-shaken, minified (when enabled).

**2. Bundled native JS** — `src/**/*.js`, plain ES modules (no TS). Bundled exactly like TS and fully interoperable: `.ts` can import `.js` and vice-versa (`allowJs` is on; add JSDoc for optional type hints). A whole page can run on native JS — `pages.html` uses the native entry `src/pages.js`.

**3. Bundled plain CSS** — `src/**/*.css`, imported from JS/TS (e.g. `import './styles/custom.css'`). Bundled together with the SCSS output; no Sass pipeline required.

```ts
// src/main.ts
import './styles/main.scss'; // SCSS
import './styles/custom.css'; // plain CSS
import { mountGreeting } from './scripts/native/greeting.js'; // native JS from TS
```

## Autoprefixer

`postcss.config.js` runs [autoprefixer](https://github.com/postcss/autoprefixer) after the SCSS/CSS pipeline; Vite auto-detects it. Target browsers come from the `browserslist` field in `package.json` — edit that list to change which prefixes are emitted.

## Static assets → `dist/` (images, fonts, verbatim vendor)

There is **no `public/` directory** (`publicDir: false`). Instead, the zero-config `srcStatic()` plugin in `vite.config.ts` copies whole trees verbatim (unbundled, unhashed) to fixed URLs and serves them at the same paths in dev — in both the default and `wp` builds:

| Source           | Output / URL       | Notes                              |
| ---------------- | ------------------ | ---------------------------------- |
| `src/img/`       | `/img/…`           | raster optimized via `sharp`, SVG via `svgo` |
| `src/fonts/`     | `/fonts/…`         | verbatim (see fonts below)         |
| `src/css/vendor/`| `/css/vendor/…`    | verbatim                           |
| `src/js/vendor/` | `/js/vendor/…`     | verbatim                           |

Reference them by absolute path in HTML:

```html
<link rel="icon" href="/img/favicon/favicon.ico" />
<img src="/img/sample.png" alt="…" />
<link rel="stylesheet" href="/css/vendor/vendor-theme.css" />
<script src="/js/vendor/vendor-widget.js" defer></script>
```

**Images.** Files under `src/img/` are optimized on build before being emitted (raster re-encoded with `sharp`, SVG minified with `svgo`); the smaller of original/optimized always wins, so it never regresses. Turn it off with `srcStatic({ optimizeImages: false })` in `vite.config.ts`. Dev serves the source bytes unoptimized for fast HMR.

**Fonts.** Drop font files in `src/fonts/` (copied to `dist/fonts/`, served at `/fonts/…`) and register them in `src/styles/base/_fonts.scss` with the `font-face` mixin (a commented, ready-to-use example is included).

Use verbatim `css/vendor` / `js/vendor` for classic (non-module) scripts, prebuilt libraries, or any CSS/JS you don't want Vite to touch. Use the bundled paths above (imports from `src/`) when you *do* want hashing, minification and tree-shaking.

## Minification

Default builds are **not minified** (`build.minify: false`) so the output is easy to read and debug. Minify any build by appending the cross-platform CLI flag — it overrides the config default:

```bash
npm run build:min                 # vite build --minify esbuild
npm run build:wp -- --minify esbuild   # minified WordPress/CMS build
```

For production (e.g. a WordPress theme), prefer the minified variant. The `--minify esbuild` flag needs the `esbuild` package (already a devDependency).

## Use inside a WordPress / CMS theme

When the site is rendered by a backend (WordPress, etc.) that enqueues the built assets from the theme's `dist/`, use the **`wp` mode**. It builds a single, predictable entry — `dist/assets/main.js` + `dist/assets/main.css` (no content hashes, no HTML) — so your `functions.php` can reference fixed paths that don't change on every rebuild.

Develop with auto-rebuild into `dist/`, then just refresh the page (e.g. `testsite.local/catalog/`):

```bash
npm run watch:wp    # rebuild dist/ on every src change (stable names)
npm run build:wp    # one-off build for the theme (append --minify esbuild for prod)
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

Verbatim static files (`src/img`, `src/fonts`, `src/css/vendor`, `src/js/vendor` → `dist/img`, `dist/fonts`, `dist/css/vendor`, `dist/js/vendor`) still land in `dist/` and are referenced by absolute theme path. If you'd rather keep Vite's HMR instead of refreshing, use the "Backend Integration" note in `vite.config.ts` (`manifest: true`) and point the theme at `http://localhost:3000/@vite/client` during dev.
