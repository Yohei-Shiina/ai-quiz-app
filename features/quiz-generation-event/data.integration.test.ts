import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';

// Only auth is mocked; the DB is real. requireAuth() is the boundary these
// data functions call, so we swap it for the seeded user and let every query
// hit the throwaway Postgres. vi.hoisted lets the mock read a mutable holder
// updated per test.
const authHolder = vi.hoisted(() => ({ userId: '' }));
vi.mock('@/features/auth/services', () => ({
  requireAuth: vi.fn(async () => ({
    id: authHolder.userId,
    email: 'test@test.local',
    name: 'Test User',
    createdAt: new Date(),
  })),
}));

import { QuizGenerationEventStatus } from '@/app/generated/prisma/client';
import {
  countActiveQuizGenerationEventsInWindow,
  hasPendingQuizGenerationEventBySession,
  tryAcquireGenerationLockBySession,
} from '@/features/quiz-generation-event/data';
import { isQuizGenerationLimitReached } from '@/features/quiz-generation-event/services';
import { QUIZ_GENERATION_RATE_LIMIT, QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

import {
  disconnectDb,
  resetDb,
  seedGenerationEvent,
  seedQuizSession,
  seedUser,
} from '@/test/integration/db';

let userId: string;

beforeEach(async () => {
  await resetDb();
  const user = await seedUser();
  userId = user.id;
  authHolder.userId = user.id;
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

describe('tryAcquireGenerationLockBySession (CAS lock)', () => {
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
