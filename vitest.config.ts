import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['client/src/**/*.{ts,tsx}', 'server/src/**/*.ts'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types/**',
        'client/src/main.tsx',
        'client/src/test-setup.ts',
        'client/src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    projects: [
      {
        test: {
          name: 'client',
          root: './client',
          globals: true,
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/test-setup.ts'],
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
