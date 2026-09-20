import { defineConfig, type Plugin } from 'vite';
import { readFileSync, existsSync, readdirSync, statSync, createReadStream } from 'node:fs';
import { resolve, dirname, join, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Minimal HTML partials plugin (zero extra deps).
 * Inline a file with:  <!-- @include src/partials/header.html -->
 * Includes are resolved from the project root and expanded recursively.
 */
function htmlPartials(): Plugin {
  const includeRe = /<!--\s*@include\s+([^\s]+)\s*-->/g;

  const expand = (html: string, seen: Set<string>): string =>
    html.replace(includeRe, (_match, file: string) => {
      const filePath = resolve(root, file);
      if (seen.has(filePath)) {
        throw new Error(`[html-partials] circular include: ${file}`);
      }
      const nested = new Set(seen).add(filePath);
      return expand(readFileSync(filePath, 'utf8'), nested);
    });

  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => expand(html, new Set<string>())
    }
  };
}

/**
 * Verbatim vendor assets plugin (zero extra deps).
 *
 * Ships hand-written / third-party files from `src/css/vendor/**` and
 * `src/js/vendor/**` unchanged (unbundled, unhashed) to the same public URLs
 * in both dev and build:
 *   src/css/vendor/<path> -> /css/vendor/<path>  (dist/css/vendor/<path>)
 *   src/js/vendor/<path>  -> /js/vendor/<path>   (dist/js/vendor/<path>)
 *
 * Using an explicit `fileName` in emitFile bypasses `assetFileNames`, so the
 * files keep their exact paths (no hashing) in the default and `wp` modes.
 */
function srcVendor(): Plugin {
  // Map of URL prefix -> absolute source directory.
  const dirs: Array<{ urlPrefix: string; absDir: string }> = [
    { urlPrefix: 'css/vendor', absDir: resolve(root, 'src/css/vendor') },
    { urlPrefix: 'js/vendor', absDir: resolve(root, 'src/js/vendor') }
  ];

  const contentTypes: Record<string, string> = {
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript'
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
    name: 'src-vendor',
    generateBundle() {
      for (const { urlPrefix, absDir } of dirs) {
        if (!existsSync(absDir)) {
          continue;
        }
        for (const abs of walk(absDir)) {
          const rel = relative(absDir, abs).split(sep).join('/');
          this.emitFile({
            type: 'asset',
            fileName: `${urlPrefix}/${rel}`,
            source: readFileSync(abs)
          });
        }
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
    plugins: [htmlPartials(), srcVendor()],
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
