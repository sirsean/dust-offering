import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      '.wrangler/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  { files: ['src/**/*.js'], languageOptions: { globals: globals.browser } },
  {
    files: ['scripts/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['tests/browser/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, dust: 'readonly' },
    },
  },
  {
    files: ['scripts/playtest.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        dust: 'readonly',
        frameTimes: 'readonly',
      },
    },
  },
];
