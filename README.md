## New Project Starter

Ready-to-use Gulp stack for modern frontend builds: SCSS, TypeScript, native JavaScript, Bootstrap 5.3.8, BrowserSync, and lightweight linting.

### What's Included
- Gulp 5 tasks (`build`, `clean`, `dev`) with BrowserSync live reload.
- SCSS pipeline via `gulp-sass`, grouped media queries, autoprefixer, sourcemaps in development.
- Bootstrap SCSS entry at `src/css/vendor/bootstrap/bootstrap.scss`; toggle components in `bootstrap-components.scss`.
- Dual JS workflow: native ES2018+ code in `src/js` bundling into `dist/js/script.js`, and TypeScript in `src/ts` bundling via esbuild into `dist/js/app.js`.
- ESLint (TS) via `npm run lint` with strict mode.

### Quick Start
```
npm install
npm run start    # gulp dev (build + watcher + BrowserSync)
```

Other scripts:
- `npm run build` — production build (`NODE_ENV=production`, minified assets, no sourcemaps).
- `npm run clean` — remove `dist`.
- `npm run lint` — ESLint with `--strict-lint`.

### Development Commands
- `gulp scriptsJs` — bundle native JavaScript (`src/js`) into `dist/js/script.js`.
- `gulp scriptsTs` — bundle TypeScript (`src/ts`) into `dist/js/app.js`.
- `gulp copyJsVendor` / `gulp copyTsVendor` — copy vendor assets without bundling.
- `gulp styles` / `gulp bootstrapStyles` — build SCSS bundles individually.

Component directories follow `src/css/vendor/bootstrap` for Bootstrap overrides and `src/css/scss` for project sections (core, layout, components).

### Structure
- `src/css/scss` — project styles, entry point `style.scss`.
- `src/css/vendor/bootstrap` — Bootstrap SCSS overrides and component list.
- `src/js` — native JS modules, main entry `main.js`, vendor assets in `src/js/vendor`.
- `src/ts` — TypeScript modules exported via `modules/index.ts`, main entry `main.ts`.
- `dist/` — build output (HTML, CSS, JS, images, fonts, vendor assets).

### Highlights
- Bootstrap flexibility: keep a separate bundle (`dist/css/vendor/bootstrap/bootstrap.css`) or import into `style.scss`.
- Unified JS/TS bundling through esbuild (IIFE targets, minification in production).
- Environment-specific paths and BrowserSync settings configured via `.env` (see `env.example`). When `BS_USE_PROXY=true`, open the site through the BrowserSync address (for example, `http://newprojectpack.local:3000`) to keep live reload working.
- Gulp-notify + plumber keep tasks resilient.
- `gulp-imagemin` optimizes images during builds.

Edit `src`, run `npm run start`, and develop with live reload out of the box.
