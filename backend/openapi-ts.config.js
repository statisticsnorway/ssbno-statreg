import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '../shared/openapi/openapi.yaml',
  output: './src/parser',
  plugins: [
    {
      includeInEntry: (symbol) => symbol.name.endsWith('Body'),
      name: 'zod',
      requests: {
        body: {
          name: '{{name}}Body',
          types: {
            infer: {
              name: '{{name}}Body',
              case: 'PascalCase',
            },
          },
        },
        headers: false,
        path: false,
        query: false,
      },
      responses: false,
      definitions: false,
    },
  ],
})
