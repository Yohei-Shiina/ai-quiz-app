import { randomUUID } from 'node:crypto';

import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';

// Only auth is mocked; the DB is real. requireAuth() is the boundary these
// data functions call, so we swap it for the seeded user and let every query
// hit the throwaway Postgres. vi.hoisted lets the mock read a mutable holder
// updated per test.
const authHolder = vi.hoisted(() => ({ userId: '', email: 'test@test.local' }));
vi.mock('@/features/auth/services', () => ({
  requireAuth: vi.fn(async () => ({
    id: authHolder.userId,
    email: authHolder.email,
    name: 'Test User',
    createdAt: new Date(),
  })),
}));

import { QuizGenerationEventStatus } from '@/app/generated/prisma/client';
import {
  countActiveDemoQuizGenerationEventsInWindow,
  countActiveQuizGenerationEventsForUser,
  countActiveQuizGenerationEventsInWindow,
  hasPendingQuizGenerationEventBySession,
  tryAcquireGenerationLockBySession,
} from '@/features/quiz-generation-event/data';
import {
  getQuizGenerationLimit,
  isQuizGenerationLimitReached,
} from '@/features/quiz-generation-event/services';
import {
  DEMO_QUIZ_GENERATION_GLOBAL_LIMIT,
  DEMO_QUIZ_GENERATION_GLOBAL_WINDOW_MS,
  DEMO_QUIZ_GENERATION_PER_ACCOUNT_LIMIT,
  DEMO_USER,
  QUIZ_GENERATION_RATE_LIMIT,
  QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS,
} from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import {
  disconnectDb,
  resetDb,
  seedGenerationEvent,
  seedQuizSession,
  seedUser,
} from '@/test/integration/db';

const demoEmail = () => `${DEMO_USER.emailPrefix}${randomUUID()}@${DEMO_USER.emailDomain}`;

let userId: string;

beforeEach(async () => {
  await resetDb();
  const user = await seedUser();
  userId = user.id;
  authHolder.userId = user.id;
  authHolder.email = user.email;
});

afterAll(async () => {
  await disconnectDb();
});

describe('hasPendingQuizGenerationEventBySession', () => {
  test('returns true when a pending event exists for the session', async () => {
    const session = await seedQuizSession(userId);
    await seedGenerationEvent({ userId, quizSessionId: session.id });

    expect(await hasPendingQuizGenerationEventBySession(session.id)).toBe(true);
  });

  test('returns false when only non-pending events exist', async () => {
    const session = await seedQuizSession(userId);
    await seedGenerationEvent({
      userId,
      quizSessionId: session.id,
      status: QuizGenerationEventStatus.success,
    });
    await seedGenerationEvent({
      userId,
      quizSessionId: session.id,
      status: QuizGenerationEventStatus.failed,
    });

    expect(await hasPendingQuizGenerationEventBySession(session.id)).toBe(false);
  });

  test('returns false when the session has no events', async () => {
    const session = await seedQuizSession(userId);

    expect(await hasPendingQuizGenerationEventBySession(session.id)).toBe(false);
  });
});

describe('tryAcquireGenerationLockBySession', () => {
  test('exactly one of many concurrent callers wins the lock', async () => {
    const session = await seedQuizSession(userId);
    await seedGenerationEvent({ userId, quizSessionId: session.id });

    const results = await Promise.all(
      Array.from({ length: 10 }, () => tryAcquireGenerationLockBySession(session.id)),
    );

    const winners = results.filter((id): id is string => id !== null);
    expect(winners).toHaveLength(1);

    // The single pending row is now transitioned to generating.
    const event = await prisma.quizGenerationEvent.findUniqueOrThrow({
      where: { id: winners[0] },
    });
    expect(event.status).toBe(QuizGenerationEventStatus.generating);
  });

  test('returns null when there is no pending event to acquire', async () => {
    const session = await seedQuizSession(userId);

    expect(await tryAcquireGenerationLockBySession(session.id)).toBeNull();
  });

  test('returns null (defensive) when multiple pending rows match', async () => {
    const session = await seedQuizSession(userId);
    await seedGenerationEvent({ userId, quizSessionId: session.id });
    await seedGenerationEvent({ userId, quizSessionId: session.id });

    // The guard rejects an ambiguous state rather than locking two rows.
    expect(await tryAcquireGenerationLockBySession(session.id)).toBeNull();
  });
});

describe('rate-limit rolling window', () => {
  const insideWindow = () => new Date(Date.now() - 60_000);
  const outsideWindow = () => new Date(Date.now() - QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS - 60_000);

  test('counts only non-failed events created within the window', async () => {
    const session = await seedQuizSession(userId);
    // 3 inside, non-failed -> counted
    for (const status of [
      QuizGenerationEventStatus.pending,
      QuizGenerationEventStatus.generating,
      QuizGenerationEventStatus.success,
    ]) {
      await seedGenerationEvent({
        userId,
        quizSessionId: session.id,
        status,
        createdAt: insideWindow(),
      });
    }
    // failed inside -> excluded
    await seedGenerationEvent({
      userId,
      quizSessionId: session.id,
      status: QuizGenerationEventStatus.failed,
      createdAt: insideWindow(),
    });
    // success outside -> excluded
    await seedGenerationEvent({
      userId,
      quizSessionId: session.id,
      status: QuizGenerationEventStatus.success,
      createdAt: outsideWindow(),
    });

    expect(await countActiveQuizGenerationEventsInWindow()).toBe(3);
  });

  test('limit is not reached one below the threshold', async () => {
    const session = await seedQuizSession(userId);
    for (let i = 0; i < QUIZ_GENERATION_RATE_LIMIT - 1; i++) {
      await seedGenerationEvent({ userId, quizSessionId: session.id, createdAt: insideWindow() });
    }

    expect(await isQuizGenerationLimitReached()).toBe(false);
  });

  test('limit is reached exactly at the threshold', async () => {
    const session = await seedQuizSession(userId);
    for (let i = 0; i < QUIZ_GENERATION_RATE_LIMIT; i++) {
      await seedGenerationEvent({ userId, quizSessionId: session.id, createdAt: insideWindow() });
    }

    expect(await isQuizGenerationLimitReached()).toBe(true);
  });
});

describe('demo user limits', () => {
  let demoUserId: string;

  // Re-authenticate as a fresh demo account so the demo branch of the limit logic runs.
  beforeEach(async () => {
    const demo = await seedUser({ email: demoEmail() });
    demoUserId = demo.id;
    authHolder.userId = demo.id;
    authHolder.email = demo.email;
  });

  test('per-account count includes non-failed events with no time window', async () => {
    const staleCreatedAt = new Date(Date.now() - DEMO_QUIZ_GENERATION_GLOBAL_WINDOW_MS - 60_000);
    // recent + stale non-failed -> both counted (no window); failed -> excluded
    await seedGenerationEvent({ userId: demoUserId, status: QuizGenerationEventStatus.success });
    await seedGenerationEvent({
      userId: demoUserId,
      status: QuizGenerationEventStatus.success,
      createdAt: staleCreatedAt,
    });
    await seedGenerationEvent({ userId: demoUserId, status: QuizGenerationEventStatus.failed });

    expect(await countActiveQuizGenerationEventsForUser()).toBe(2);
  });

  test('per-account cap: none below threshold, demo_account at threshold', async () => {
    for (let i = 0; i < DEMO_QUIZ_GENERATION_PER_ACCOUNT_LIMIT - 1; i++) {
      await seedGenerationEvent({ userId: demoUserId, status: QuizGenerationEventStatus.success });
    }
    expect(await getQuizGenerationLimit()).toBe('none');

    await seedGenerationEvent({ userId: demoUserId, status: QuizGenerationEventStatus.success });
    expect(await getQuizGenerationLimit()).toBe('demo_account');
  });

  test('global count: only non-failed demo events within the window, across all demo users', async () => {
    const otherDemo = await seedUser({ email: demoEmail() });
    const nonDemo = await seedUser(); // test-...@test.local
    const inside = () => new Date(Date.now() - 60_000);
    const outside = () => new Date(Date.now() - DEMO_QUIZ_GENERATION_GLOBAL_WINDOW_MS - 60_000);

    await seedGenerationEvent({
      userId: demoUserId,
      status: QuizGenerationEventStatus.success,
      createdAt: inside(),
    });
    await seedGenerationEvent({
      userId: otherDemo.id,
      status: QuizGenerationEventStatus.pending,
      createdAt: inside(),
    });
    // failed inside -> excluded
    await seedGenerationEvent({
      userId: demoUserId,
      status: QuizGenerationEventStatus.failed,
      createdAt: inside(),
    });
    // success outside window -> excluded
    await seedGenerationEvent({
      userId: otherDemo.id,
      status: QuizGenerationEventStatus.success,
      createdAt: outside(),
    });
    // non-demo user inside -> excluded
    await seedGenerationEvent({
      userId: nonDemo.id,
      status: QuizGenerationEventStatus.success,
      createdAt: inside(),
    });

    expect(await countActiveDemoQuizGenerationEventsInWindow()).toBe(2);
  });

  test('global cap trips demo_global while the current account is under its per-account cap', async () => {
    // Fill the global window with OTHER demo users so the current account stays at
    // zero; the block must then originate from the global cap, not the per-account one.
    const others = await Promise.all(
      Array.from({ length: DEMO_QUIZ_GENERATION_GLOBAL_LIMIT }, () =>
        seedUser({ email: demoEmail() }),
      ),
    );
    await Promise.all(
      others.map((u) =>
        seedGenerationEvent({ userId: u.id, status: QuizGenerationEventStatus.success }),
      ),
    );

    expect(await countActiveQuizGenerationEventsForUser()).toBe(0);
    expect(await getQuizGenerationLimit()).toBe('demo_global');
  });
});
