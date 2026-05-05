import globals from 'globals'
import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import tseslintParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import eslintReact from '@eslint-react/eslint-plugin'

export default defineConfig([
  globalIgnores(['**/dist/', '**/node_modules/', '**/src/generated/', '**/*.d.ts']),
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: {
      prettier,
    },
    extends: [eslint.configs.recommended, tseslint.configs.recommended, eslintReact.configs['recommended-typescript']],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parser: tseslintParser,
    },
    rules: {
      'prettier/prettier': ['warn'],
    },
  },
])
