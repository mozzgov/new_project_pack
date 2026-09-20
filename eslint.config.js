import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Vendor/verbatim assets in public/ are third-party — don't lint them.
  { ignores: ['dist', 'node_modules', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // TypeScript sources
    files: ['**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { sourceType: 'module' }
    }
  },
  {
    // Native JS sources (bundled) — browser env, ESM
    files: ['src/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser },
      sourceType: 'module'
    }
  },
  {
    // Node-side config files
    files: ['vite.config.ts', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node }
    }
  }
);
