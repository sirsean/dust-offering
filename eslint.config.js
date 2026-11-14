import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', '.wrangler/**', 'coverage/**'] },
  js.configs.recommended,
  { files: ['src/**/*.js'], languageOptions: { globals: globals.browser } },
  {
    files: ['scripts/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
];
