module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  overrides: [
    {
      files: ['src/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.eslint.json']
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked'
      ],
      rules: {
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    },
    {
      files: ['src/**/*.js'],
      extends: ['eslint:recommended'],
      rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
      }
    },
    {
      files: ['gulpfile.js'],
      env: { node: true },
      extends: ['eslint:recommended'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};

