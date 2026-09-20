// PostCSS config (ESM — the package is `type: module`). Vite auto-detects this
// file and runs it after the SCSS/CSS pipeline. Autoprefixer adds vendor
// prefixes based on the `browserslist` field in package.json.
import autoprefixer from 'autoprefixer';

export default {
  plugins: [autoprefixer()]
};
