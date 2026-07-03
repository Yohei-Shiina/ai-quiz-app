// Single source of truth for the disposable integration-test database connection.
// Keep in sync with the published port in docker-compose.test.yml and the
// DIRECT_URL used by package.json's `test:integration` migrate step.
// vitest.integration.config.mts injects this as DATABASE_URL; resetDb() asserts
// against it before running destructive statements so a stray DATABASE_URL can
// never point the reset at a dev/prod database.
export const TEST_DB_URL = 'postgresql://test:test@localhost:5434/quriosity_test';
