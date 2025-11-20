import globals from 'globals'
import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import tseslintParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'

export default defineConfig([
  globalIgnores(['dist/', 'node_modules/', 'generated/']),
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: {
      prettier,
    },
    languageOptions: {
      globals: globals.browser,
      parser: tseslintParser,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'prettier/prettier': ['warn'],
    },
  },
])
