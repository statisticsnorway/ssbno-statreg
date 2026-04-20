import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    alias: {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'backend/src'),
      '@ssbno-statreg/shared': path.resolve(__dirname, 'shared/src/index.ts'),
    },
  },
})
