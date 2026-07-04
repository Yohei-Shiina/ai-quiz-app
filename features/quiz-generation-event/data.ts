import {
  type QuizGenerationEvent,
  QuizGenerationEventStatus,
  type QuizSession,
} from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import {
  DEMO_QUIZ_GENERATION_GLOBAL_WINDOW_MS,
  DEMO_USER,
  QUIZ_GENERATION_RATE_LIMIT_WINDOW_MS,
} from '@/lib/constants';
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

export const hasPendingQuizGenerationEventBySession = async (
  quizSessionId: QuizSession['id'],
): Promise<boolean> => {
  const user = await requireAuth();
  const event = await prisma.quizGenerationEvent.findFirst({
    where: { quizSessionId, userId: user.id, status: QuizGenerationEventStatus.pending },
    select: { id: true },
  });
  return event !== null;
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

export const countActiveQuizGenerationEventsForUser = async () => {
  const user = await requireAuth();
  return prisma.quizGenerationEvent.count({
    where: {
      userId: user.id,
      status: { not: QuizGenerationEventStatus.failed },
    },
  });
};

// Demo global cap: count non-failed events from all demo users within the trailing
// window. The relation filter also excludes events whose user was nulled by the
// cleanup script (onDelete: SetNull), which are old by definition.
export const countActiveDemoQuizGenerationEventsInWindow = async () => {
  const since = new Date(Date.now() - DEMO_QUIZ_GENERATION_GLOBAL_WINDOW_MS);
  return prisma.quizGenerationEvent.count({
    where: {
      status: { not: QuizGenerationEventStatus.failed },
      createdAt: { gte: since },
      user: {
        email: {
          startsWith: DEMO_USER.emailPrefix,
          endsWith: `@${DEMO_USER.emailDomain}`,
        },
      },
    },
  });
};

// CAS lock acquisition: atomically transitions pending -> generating. The single
// statement holds an internal row lock only for the duration of the UPDATE, so
// it works with Prisma's connection pool and Supabase's transaction pooler
// (unlike pg_advisory_lock, which is session-scoped and leaks across pooled
// connections). Returns the acquired event id, or null if no pending row matched.
export const tryAcquireGenerationLockBySession = async (
  quizSessionId: QuizSession['id'],
): Promise<string | null> => {
  const user = await requireAuth();
  const result = await prisma.quizGenerationEvent.updateManyAndReturn({
    where: {
      quizSessionId,
      userId: user.id,
      status: QuizGenerationEventStatus.pending,
    },
    data: { status: QuizGenerationEventStatus.generating },
    select: { id: true },
  });
  if (result.length !== 1) return null;
  return result[0].id;
};

export const markGenerationSuccess = async (eventId: QuizGenerationEvent['id']) =>
  prisma.quizGenerationEvent.update({
    where: { id: eventId },
    data: { status: QuizGenerationEventStatus.success },
  });

export const markGenerationFailed = async (eventId: QuizGenerationEvent['id']) =>
  prisma.quizGenerationEvent.update({
    where: { id: eventId },
    data: { status: QuizGenerationEventStatus.failed },
  });
