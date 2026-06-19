import {
  type Prisma,
  type QuestionReviewState,
  type Question,
} from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import { prisma } from '@/lib/prisma';

export const countDueQuestionReviewStates = async (now: Date) => {
  const user = await requireAuth();
  return prisma.questionReviewState.count({
    where: { userId: user.id, dueAt: { lte: now } },
  });
};

// Returns due review states for the current user, oldest dueAt first. Used to build
// the snapshot of question ids when starting a new ReviewSession.
export const getDueQuestionReviewStates = async (now: Date) => {
  const user = await requireAuth();
  return prisma.questionReviewState.findMany({
    where: { userId: user.id, dueAt: { lte: now } },
    orderBy: { dueAt: 'asc' },
    select: { questionId: true, box: true },
  });
};

// Transaction-only: inserts the initial state on the user's first wrong answer for a
// question. No-ops via @unique on questionId if a state already exists (a later wrong
// answer in a regular session must not reset the review schedule).
export const createInitialReviewStateIfMissingInTx = async (
  tx: Prisma.TransactionClient,
  params: {
    questionId: Question['id'];
    box: QuestionReviewState['box'];
    dueAt: QuestionReviewState['dueAt'];
  },
) => {
  const user = await requireAuth();
  return tx.questionReviewState.createMany({
    data: { ...params, userId: user.id },
    skipDuplicates: true,
  });
};

// Transaction-only: read current state to decide the next box on a review answer.
// Ownership-scoped via userId so a forged questionId from another user can't be read.
export const getQuestionReviewStateInTx = async (
  tx: Prisma.TransactionClient,
  questionId: Question['id'],
) => {
  const user = await requireAuth();
  return tx.questionReviewState.findUniqueOrThrow({
    where: { questionId, userId: user.id },
  });
};

// Transaction-only: write new box + dueAt after a review session answer.
// Ownership-scoped via userId so the update can't target another user's row.
export const updateQuestionReviewStateInTx = async (
  tx: Prisma.TransactionClient,
  params: {
    questionId: Question['id'];
    box: QuestionReviewState['box'];
    dueAt: QuestionReviewState['dueAt'];
  },
) => {
  const user = await requireAuth();
  return tx.questionReviewState.update({
    where: { questionId: params.questionId, userId: user.id },
    data: { box: params.box, dueAt: params.dueAt },
  });
};
