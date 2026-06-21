import {
  type Prisma,
  type Question,
  type ReviewSession,
  ReviewSessionStatus,
} from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import { prisma } from '@/lib/prisma';

export const getInProgressReviewSession = async () => {
  const user = await requireAuth();
  return prisma.reviewSession.findFirst({
    where: { userId: user.id, status: ReviewSessionStatus.in_progress },
    orderBy: { createdAt: 'desc' },
  });
};

// Transaction-only: creates a ReviewSession plus its snapshot of due questions in a
// single atomic step. Used when starting a fresh review (no in_progress session).
export const createReviewSessionWithSnapshotInTx = async (
  tx: Prisma.TransactionClient,
  params: { questionIds: Question['id'][] },
) => {
  const user = await requireAuth();
  const session = await tx.reviewSession.create({
    data: { userId: user.id },
  });
  await tx.reviewSessionQuestion.createMany({
    data: params.questionIds.map((questionId, position) => ({
      reviewSessionId: session.id,
      questionId,
      position,
    })),
  });
  return session;
};

export const getReviewSessionWithQuestions = async (id: ReviewSession['id']) => {
  const user = await requireAuth();
  return prisma.reviewSession.findUnique({
    where: { id, userId: user.id },
    include: {
      reviewSessionQuestions: {
        orderBy: { position: 'asc' },
        include: {
          question: {
            include: {
              topic: { select: { title: true } },
              answerOptions: true,
            },
          },
        },
      },
    },
  });
};

export const countReviewSessionAnswers = async (id: ReviewSession['id']) => {
  const user = await requireAuth();
  return prisma.reviewSessionAnswer.count({
    where: { reviewSessionId: id, reviewSession: { userId: user.id } },
  });
};

export const countReviewSessionQuestions = async (id: ReviewSession['id']) => {
  const user = await requireAuth();
  return prisma.reviewSessionQuestion.count({
    where: { reviewSessionId: id, reviewSession: { userId: user.id } },
  });
};

export const markReviewSessionCompletedOrThrow = async (id: ReviewSession['id']) => {
  const user = await requireAuth();
  return prisma.reviewSession.update({
    where: { id, userId: user.id },
    data: { status: ReviewSessionStatus.completed },
  });
};

// Transaction-only: ownership-checked existence check for the (session, question)
// answer pair. Used by submitReviewAnswer to short-circuit double submits before any
// state advance runs.
export const findReviewSessionAnswerInTx = async (
  tx: Prisma.TransactionClient,
  params: { reviewSessionId: ReviewSession['id']; questionId: Question['id'] },
) => {
  const user = await requireAuth();
  return tx.reviewSessionAnswer.findUnique({
    where: {
      reviewSessionId_questionId: {
        reviewSessionId: params.reviewSessionId,
        questionId: params.questionId,
      },
      reviewSession: { userId: user.id },
    },
    select: { id: true },
  });
};

// Transaction-only: records the user's answer to a single question in a review session.
// Paired with updateQuestionReviewStateInTx so both writes commit together.
export const upsertReviewSessionAnswerInTx = async (
  tx: Prisma.TransactionClient,
  params: {
    reviewSessionId: ReviewSession['id'];
    questionId: Question['id'];
    answerOptionId: string;
    isCorrect: boolean;
  },
) => {
  const user = await requireAuth();
  await tx.reviewSession.findUniqueOrThrow({
    where: { id: params.reviewSessionId, userId: user.id },
    select: { id: true },
  });
  return tx.reviewSessionAnswer.upsert({
    where: {
      reviewSessionId_questionId: {
        reviewSessionId: params.reviewSessionId,
        questionId: params.questionId,
      },
    },
    create: params,
    update: {},
  });
};

export const getReviewSessionResult = async (id: ReviewSession['id']) => {
  const user = await requireAuth();
  return prisma.reviewSession.findUnique({
    where: { id, userId: user.id },
    include: {
      reviewSessionQuestions: {
        orderBy: { position: 'asc' },
        include: {
          question: {
            include: {
              topic: { select: { title: true } },
              answerOptions: true,
            },
          },
        },
      },
      reviewSessionAnswers: true,
    },
  });
};
