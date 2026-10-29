// Autocrat · eslint.config.mjs: basic checks for the game scripts (#53). The files are classic scripts that share globals in load order
// (index.html), so no-undef and unused-variable rules stay off; these rules catch syntax errors and real slips (a duplicate key in a data
// table, an unreachable line, a NaN comparison). Run: npx eslint@9 js
export default [
  { files: ['js/**/*.js'], languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
    rules: {
      'no-dupe-keys': 'error', 'no-duplicate-case': 'error', 'no-dupe-args': 'error', 'no-dupe-else-if': 'error', 'no-unreachable': 'error',
      'no-unsafe-finally': 'error', 'no-unsafe-negation': 'error', 'use-isnan': 'error', 'valid-typeof': 'error', 'no-self-assign': 'error',
      'no-func-assign': 'error', 'no-const-assign': 'error', 'no-invalid-regexp': 'error', 'no-empty-character-class': 'error', 'getter-return': 'error',
      'no-sparse-arrays': 'error', 'no-compare-neg-zero': 'error', 'no-unsafe-optional-chaining': 'error' } },
];
