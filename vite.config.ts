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

export default defineConfig({
  plugins: [htmlPartials()],
  server: {
    host: true,
    port: 3000
  },
  preview: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        pages: resolve(root, 'pages.html'),
        typology: resolve(root, 'typology.html')
      }
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
});
