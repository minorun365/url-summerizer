// eslint.config.mjs
import next from '@next/eslint-plugin-next';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  ...next.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    rules: {
      // カスタムルールがあればここに追加
    }
  }
];
