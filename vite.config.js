import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
    sourcemap: 'true',
    lib: {
      entry: 'src/main.mts',
      formats: ['es'],
      fileName: 'main',
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['express', 'vite-express'],
      output: {
        entryFileNames: 'main.js',
      },
    },
  },
})
