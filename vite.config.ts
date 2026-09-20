import { defineConfig, type Plugin } from 'vite';
import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  createReadStream
} from 'node:fs';
import { resolve, dirname, join, relative, sep, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import sharp from 'sharp';
import { optimize as svgoOptimize } from 'svgo';
import { site, pages as pageData } from './src/data/site.js';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Handlebars templating plugin (multi-page, layout + partials + per-page data).
 *
 * - Registers every `src/partials/*.hbs` file as a partial (by base name), so
 *   pages reference them with `{{> header }}`, `{{> footer }}`, and wrap their
 *   body in the shared layout via `{{#> layout}} ... {{/layout}}`.
 * - Compiles each HTML entry with `{ ...site, ...pageData[<file>] }` so
 *   per-page `title`/`description` land in <head> and shared data (e.g. the
 *   `nav` array rendered with `{{#each}}`) is available everywhere.
 * - Runs in dev (`transformIndexHtml`) and in build with the same context, so
 *   the rendered markup is identical. Partials are re-read on every transform
 *   so edits show up live in dev without a restart.
 *
 * Page data lives in `src/data/site.js`. Add a page by creating the HTML entry,
 * registering it in `build.rollupOptions.input`, and adding a `pages` entry.
 */
function htmlTemplating(): Plugin {
  const partialsDir = resolve(root, 'src/partials');

  const registerPartials = () => {
    if (!existsSync(partialsDir)) {
      return;
    }
    for (const entry of readdirSync(partialsDir)) {
      if (extname(entry) !== '.hbs') {
        continue;
      }
      const name = basename(entry, '.hbs');
      Handlebars.registerPartial(name, readFileSync(join(partialsDir, entry), 'utf8'));
    }
  };

  const render = (html: string, filename: string): string => {
    registerPartials();
    const key = basename(filename);
    const perPage = (pageData as Record<string, Record<string, unknown>>)[key] ?? {};
    const context = { ...site, ...perPage };
    return Handlebars.compile(html)(context);
  };

  return {
    name: 'html-templating',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => render(html, ctx.filename)
    }
  };
}

/**
 * Verbatim static assets plugin (with optional image optimization).
 *
 * Ships hand-written / third-party files unchanged (unbundled, unhashed) to the
 * same public URLs in both dev and build, for all of:
 *   src/css/vendor/<p> -> /css/vendor/<p>  (dist/css/vendor/<p>)
 *   src/js/vendor/<p>  -> /js/vendor/<p>   (dist/js/vendor/<p>)
 *   src/img/<p>        -> /img/<p>         (dist/img/<p>)
 *   src/fonts/<p>      -> /fonts/<p>       (dist/fonts/<p>)
 *
 * Using an explicit `fileName` in emitFile bypasses `assetFileNames`, so files
 * keep their exact paths (no hashing) in the default and `wp` modes.
 *
 * Images under `src/img` are optimized before emit (raster via `sharp`, SVG via
 * `svgo`) unless `optimizeImages` is disabled. Optimization never runs in dev,
 * so HMR stays fast; dev serves the source bytes verbatim.
 */
function srcStatic(options: { optimizeImages?: boolean } = {}): Plugin {
  const { optimizeImages = true } = options;

  // Map of URL prefix -> absolute source directory. `optimize: true` marks the
  // directory whose images get run through sharp/svgo on build.
  const dirs: Array<{ urlPrefix: string; absDir: string; optimize?: boolean }> = [
    { urlPrefix: 'css/vendor', absDir: resolve(root, 'src/css/vendor') },
    { urlPrefix: 'js/vendor', absDir: resolve(root, 'src/js/vendor') },
    { urlPrefix: 'img', absDir: resolve(root, 'src/img'), optimize: true },
    { urlPrefix: 'fonts', absDir: resolve(root, 'src/fonts') }
  ];

  const contentTypes: Record<string, string> = {
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    // Images
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    // Fonts
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject'
  };

  const rasterExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

  const optimizeAsset = async (abs: string): Promise<Buffer> => {
    const source = readFileSync(abs);
    if (!optimizeImages) {
      return source;
    }
    const ext = extname(abs).toLowerCase();
    try {
      if (rasterExts.has(ext)) {
        let pipeline = sharp(source);
        if (ext === '.png') {
          pipeline = pipeline.png({ compressionLevel: 9, palette: true });
        } else if (ext === '.jpg' || ext === '.jpeg') {
          pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
        } else if (ext === '.webp') {
          pipeline = pipeline.webp({ quality: 80 });
        } else if (ext === '.avif') {
          pipeline = pipeline.avif({ quality: 50 });
        }
        const out = await pipeline.toBuffer();
        // Never regress: keep the smaller of the two.
        return out.length < source.length ? out : source;
      }
      if (ext === '.svg') {
        const result = svgoOptimize(source.toString('utf8'), { multipass: true });
        const out = Buffer.from(result.data, 'utf8');
        return out.length < source.length ? out : source;
      }
    } catch {
      // On any optimizer error, fall back to the original bytes.
      return source;
    }
    return source;
  };

  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      if (statSync(abs).isDirectory()) {
        out.push(...walk(abs));
      } else {
        out.push(abs);
      }
    }
    return out;
  };

  return {
    name: 'src-static',
    async generateBundle() {
      for (const { urlPrefix, absDir, optimize } of dirs) {
        if (!existsSync(absDir)) {
          continue;
        }
        const files = walk(absDir);
        await Promise.all(
          files.map(async (abs) => {
            const rel = relative(absDir, abs).split(sep).join('/');
            const source = optimize ? await optimizeAsset(abs) : readFileSync(abs);
            this.emitFile({
              type: 'asset',
              fileName: `${urlPrefix}/${rel}`,
              source
            });
          })
        );
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || req.method !== 'GET') {
          return next();
        }
        // Strip query string / hash before resolving.
        const urlPath = decodeURIComponent(req.url.split(/[?#]/)[0]).replace(/^\/+/, '');
        const match = dirs.find(
          (d) => urlPath === d.urlPrefix || urlPath.startsWith(`${d.urlPrefix}/`)
        );
        if (!match) {
          return next();
        }
        const rel = urlPath.slice(match.urlPrefix.length).replace(/^\/+/, '');
        const abs = resolve(match.absDir, rel);
        // Guard against path traversal: keep the resolved path inside the dir.
        if (abs !== match.absDir && !abs.startsWith(match.absDir + sep)) {
          return next();
        }
        if (!existsSync(abs) || !statSync(abs).isFile()) {
          return next();
        }
        const type = contentTypes[extname(abs).toLowerCase()];
        if (type) {
          res.setHeader('Content-Type', type);
        }
        createReadStream(abs).pipe(res);
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // `--mode wp`: emit stable (non-hashed) filenames so a CMS/WordPress theme
  // can enqueue fixed paths (dist/assets/main.js, main.css, ...) that don't
  // change on every rebuild. Default build keeps content hashes for caching.
  const isCms = mode === 'wp';
  const input: Record<string, string> = isCms
    ? { main: resolve(root, 'src/main.ts') }
    : {
        main: resolve(root, 'index.html'),
        pages: resolve(root, 'pages.html'),
        typology: resolve(root, 'typology.html')
      };
  const stableNames = {
    entryFileNames: 'assets/[name].js',
    chunkFileNames: 'assets/[name].js',
    assetFileNames: 'assets/[name][extname]'
  };

  return {
    // Static assets are served from src/ via the srcStatic() plugin below, so
    // there is no top-level public/ directory to copy.
    publicDir: false,
    plugins: [htmlTemplating(), srcStatic()],
    server: {
      host: true,
      port: 3000
      // Developing against a backend? Keep HMR here on :3000 and forward API
      // calls to your backend so the frontend stays live while data comes from
      // the backend. Adjust the path prefix and target to match your server:
      //
      // proxy: {
      //   '/api': { target: 'http://localhost:8080', changeOrigin: true }
      // }
    },
    preview: {
      host: true,
      port: 3000
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Default builds stay readable (non-minified) for easy inspection and
      // debugging. Minify any build by appending the CLI flag, e.g.
      // `npm run build:min` or `npm run build:wp -- --minify esbuild`. The CLI
      // flag overrides this default.
      minify: false,
      // Uncomment when the backend renders HTML and injects hashed assets from
      // dist/.vite/manifest.json (Vite "Backend Integration").
      // manifest: true,
      rollupOptions: {
        // CMS/WordPress: build a single JS entry (src/main.ts) into predictable
        // dist/assets/main.js + main.css that the theme enqueues. Otherwise build
        // the multi-page static site from the HTML entries.
        input,
        output: isCms ? stableNames : undefined
      }
    },
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          // Bootstrap 5 still ships legacy @import-based Sass; silence the noise.
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function']
        }
      }
    }
  };
});
