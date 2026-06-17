import {
  type QuizGenerationEvent,
  QuizGenerationEventStatus,
  type QuizSession,
  type User,
} from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import { QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export const createQuizGenerationEvent = async ({
  quizSessionId,
  aiModel,
}: {
  quizSessionId: QuizSession['id'];
  aiModel: QuizGenerationEvent['aiModel'];
}) => {
  const user = await requireAuth();
  return prisma.quizGenerationEvent.create({
    data: { userId: user.id, quizSessionId, aiModel },
  });
};

// Rolling window: count the current user's non-failed events created within the
// trailing QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS.
export const countActiveQuizGenerationEventsInWindow = async () => {
  const user = await requireAuth();
  const since = new Date(Date.now() - QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS);
  return prisma.quizGenerationEvent.count({
    where: {
      userId: user.id,
      status: { not: QuizGenerationEventStatus.failed },
      createdAt: { gte: since },
    },
  });
};

// CAS lock acquisition: atomically transitions pending -> generating. The single
// statement holds an internal row lock only for the duration of the UPDATE, so
// it works with Prisma's connection pool and Supabase's transaction pooler
// (unlike pg_advisory_lock, which is session-scoped and leaks across pooled
// connections). Returns true when this caller became the generator.
export const tryAcquireGenerationLockBySession = async (
  quizSessionId: QuizSession['id'],
  userId: User['id'],
): Promise<boolean> => {
  const result = await prisma.quizGenerationEvent.updateMany({
    where: {
      quizSessionId,
      userId,
      status: QuizGenerationEventStatus.pending,
    },
    data: { status: QuizGenerationEventStatus.generating },
  });
  return result.count === 1;
};

// Inverse of tryAcquire: returns generating -> pending so the next caller can
// take over. Used when the active generator aborts (e.g., client disconnect).
export const releaseGenerationLockAsPending = async (
  quizSessionId: QuizSession['id'],
  userId: User['id'],
) =>
  prisma.quizGenerationEvent.updateMany({
    where: {
      quizSessionId,
      userId,
      status: QuizGenerationEventStatus.generating,
    },
    data: { status: QuizGenerationEventStatus.pending },
  });

export const markGenerationSuccessBySession = async (
  quizSessionId: QuizSession['id'],
  userId: User['id'],
) =>
  prisma.quizGenerationEvent.updateMany({
    where: { quizSessionId, userId },
    data: { status: QuizGenerationEventStatus.success },
  });

export const markGenerationFailedBySession = async (
  quizSessionId: QuizSession['id'],
  userId: User['id'],
) =>
  prisma.quizGenerationEvent.updateMany({
    where: { quizSessionId, userId },
    data: { status: QuizGenerationEventStatus.failed },
  });

export const getQuizGenerationEventIdBySession = async (
  quizSessionId: QuizSession['id'],
  userId: User['id'],
) => {
  const event = await prisma.quizGenerationEvent.findFirstOrThrow({
    where: { quizSessionId, userId },
    select: { id: true },
  });
  return event.id;
};
