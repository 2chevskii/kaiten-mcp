import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import {defineConfig} from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  {
    files: ['**/*.{js,ts,d.ts}'],
    ignores: ['lib/**/*', 'docs/.vitepress/dist/**/*'],
    plugins: {js, ts: tseslint.plugin},
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    languageOptions: {globals: globals.node},
  },
  {
    files: ['**/*.json'],
    ignores: ['.vscode/*', 'package-lock.json'],
    plugins: {json},
    language: 'json/json',
    extends: [json.configs.recommended],
  },
  {
    files: ['**/*.jsonc', '.vscode/*.json'],
    plugins: {json},
    language: 'json/jsonc',
    extends: [json.configs.recommended],
  },
  {
    files: ['**/*.md'],
    plugins: {markdown},
    language: 'markdown/gfm',
    extends: [markdown.configs.recommended],
  },
]);
