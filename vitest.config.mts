import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    // Integration tests need a real Postgres; they run via
    // vitest.integration.config.mts (pnpm test:integration), not the unit run.
    exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
  },
});
