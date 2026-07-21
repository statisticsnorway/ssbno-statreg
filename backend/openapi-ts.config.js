import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '../shared/openapi/openapi.yaml',
  output: './src/generated/zod',
  plugins: [{ includeInEntry: true, name: 'zod' }],
})
