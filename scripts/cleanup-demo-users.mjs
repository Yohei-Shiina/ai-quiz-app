// Deletes ephemeral portfolio demo users and their data.
//
// Each Credentials sign-in mints a unique user (email `demo-<uuid>@demo.local`,
// see lib/constants.ts DEMO_USER), so these accumulate over time. This script
// purges them. Run it manually:
//
//   pnpm cleanup:demo            # against .env.local (DATABASE_URL)
//   pnpm cleanup:demo:prod       # against .env.production
//
// Deletion order respects foreign keys: topics first (cascades questions and
// quiz sessions and their children), then any stray sessions, then the users
// themselves (cascades review state/sessions; nulls usage/generation records).

import { Client } from 'pg';

// Matches the email shape minted in auth.ts: `${prefix}<uuid>@${domain}`.
const DEMO_EMAIL_LIKE = 'demo-%@demo.local';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Run via pnpm cleanup:demo (loads .env.local).');
  process.exit(1);
}

const client = new Client({ connectionString });

const main = async () => {
  await client.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT id FROM users WHERE email LIKE $1', [
      DEMO_EMAIL_LIKE,
    ]);
    const ids = rows.map((r) => r.id);

    if (ids.length === 0) {
      console.log('No demo users found. Nothing to clean up.');
      await client.query('COMMIT');
      return;
    }

    const topics = await client.query('DELETE FROM topics WHERE "userId" = ANY($1)', [ids]);
    const sessions = await client.query('DELETE FROM quiz_sessions WHERE "userId" = ANY($1)', [ids]);
    const users = await client.query('DELETE FROM users WHERE id = ANY($1)', [ids]);

    await client.query('COMMIT');

    console.log(`Deleted ${users.rowCount} demo users.`);
    console.log(`  topics removed: ${topics.rowCount}`);
    console.log(`  stray quiz sessions removed: ${sessions.rowCount}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
