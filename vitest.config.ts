import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'client',
          root: './client',
          globals: true,
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'server',
          root: './server',
          globals: true,
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
    ],
  },
})
