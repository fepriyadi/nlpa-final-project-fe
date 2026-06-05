import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import { fileURLToPath } from 'node:url'

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts,vue}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,cjs,ts,vue}'], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginVue.configs['flat/essential'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser, tsconfigRootDir } } },
  {
    ignores: ['.claude/**', 'dist/**', 'node_modules/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        tsconfigRootDir,
      }
    },
    rules: {
      'vue/no-unused-vars': 'error',
      'vue/multi-word-component-names': [
        'off',
        {
          ignores: []
        }
      ],
      'linebreak-style': 0,
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
      'no-unused-vars': ['error'],
      'no-trailing-spaces': ['error', { skipBlankLines: false }],
      'no-irregular-whitespace': 'error',
      'no-multiple-empty-lines': 'error',
      camelcase: 'warn'
    }
  }
])
