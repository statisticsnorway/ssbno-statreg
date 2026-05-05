import { defineProject } from 'vitest/config'
import path from 'path'

export default defineProject({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'backend/src'),
            '@ssbno-statreg/shared': path.resolve(__dirname, 'shared/src'),
          },
        },
        test: {
          name: 'backend',
          include: ['backend/**/*.test.ts'],
          exclude: ['**/integration/*.test.ts'],
          env: {
            TZ: 'UTC',
          },
        },
      },
      {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'backend/src'),
            '@ssbno-statreg/shared': path.resolve(__dirname, 'shared/src'),
          },
        },
        test: {
          name: 'integration',
          include: ['**/integration/*.test.ts'],
          env: {
            TZ: 'UTC',
          },
        },
      },
      {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'frontend/src'),
            '@ssbno-statreg/shared': path.resolve(__dirname, 'shared/src'),
          },
        },
        test: {
          name: 'frontend',
          include: ['frontend/**/*.test.ts'],
          env: {
            TZ: 'Europe/Oslo',
          },
        },
      },
    ],
  },
})
