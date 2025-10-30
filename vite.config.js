import { defineConfig } from 'vite'
import path from 'path'
import { builtinModules } from 'module'

export default defineConfig({
  build: {
    target: 'ES2022',
    sourcemap: 'true',
    lib: {
      entry: 'src/main.mts',
      formats: ['es'],
      fileName: 'main',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        'express',
        'lightship',
        ...builtinModules, // Externalize Node.js built-in modules
      ],
      output: {
        entryFileNames: 'main.js',
      },
    },
  },
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
