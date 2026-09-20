import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
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

export default defineConfig(({ mode }) => {
  // `--mode wp`: emit stable (non-hashed) filenames so a CMS/WordPress theme
  // can enqueue fixed paths (dist/assets/main.js, main.css, ...) that don't
  // change on every rebuild. Default build keeps content hashes for caching.
  const isCms = mode === 'wp';
  const stableNames = {
    entryFileNames: 'assets/[name].js',
    chunkFileNames: 'assets/[name].js',
    assetFileNames: 'assets/[name][extname]'
  };

  return {
    plugins: [htmlPartials()],
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
        input: isCms
          ? { main: resolve(root, 'src/main.ts') }
          : {
              main: resolve(root, 'index.html'),
              pages: resolve(root, 'pages.html'),
              typology: resolve(root, 'typology.html')
            },
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
