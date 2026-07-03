import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

import { TEST_DB_URL } from './test/integration/test-db';

// Integration tests: run against the disposable Postgres from
// docker-compose.test.yml (node environment, no jsdom). DATABASE_URL points at
// the throwaway container so lib/prisma.ts connects there on import.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    env: {
      DATABASE_URL: TEST_DB_URL,
    },
    // Concurrency assertions race real DB writes; keep the DB the only shared
    // state by running one file at a time (per-test control stays explicit).
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
