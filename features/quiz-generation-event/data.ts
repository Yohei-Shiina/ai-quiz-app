import {
  type Prisma,
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

// Transaction-only: takes a row lock on the session's QuizGenerationEvent so concurrent
// /generate calls for the same session serialize. Throws if no event row is found
// (wrong user or missing row), which doubles as an ownership check.
export const lockQuizGenerationEventForSessionInTx = async (
  tx: Prisma.TransactionClient,
  quizSessionId: QuizSession['id'],
  userId: User['id'],
) => {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM quiz_generation_events
    WHERE "quizSessionId" = ${quizSessionId} AND "userId" = ${userId}
    FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new Error(`No quiz generation event row to lock for quiz session ${quizSessionId}`);
  }
};

// Transaction-only: called from inside generateQuizForSession's $transaction so the
// event success/failure status flips atomically with the SessionQuestion inserts.
export const updateQuizGenerationEventBySessionInTx = async (
  tx: Prisma.TransactionClient,
  quizSessionId: QuizSession['id'],
  data: Pick<QuizGenerationEvent, 'status'>,
) =>
  tx.quizGenerationEvent.updateMany({
    where: { quizSessionId },
    data,
  });

// Post-rollback recovery: the generation transaction rolled back, leaving the event
// in its previous state. Record the failure on a fresh connection. Caller treats this
// as best-effort.
export const markQuizGenerationEventFailedBySession = async (
  quizSessionId: QuizSession['id'],
  userId: User['id'],
) =>
  prisma.quizGenerationEvent.updateMany({
    where: { quizSessionId, userId },
    data: { status: QuizGenerationEventStatus.failed },
  });

export const getQuizGenerationEventIdBySessionInTx = async (
  tx: Prisma.TransactionClient,
  quizSessionId: QuizSession['id'],
) => {
  const event = await tx.quizGenerationEvent.findFirstOrThrow({
    where: { quizSessionId },
    select: { id: true },
  });
  return event.id;
};
