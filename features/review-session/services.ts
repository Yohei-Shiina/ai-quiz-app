import { type ReviewSession } from '@/app/generated/prisma/client';
import {
  getDueQuestionReviewStates,
  getQuestionReviewStateInTx,
  updateQuestionReviewStateInTx,
} from '@/features/question-review-state/data';
import { computeNextStateOnReview } from '@/features/question-review-state/services';
import {
  countReviewSessionAnswers,
  countReviewSessionQuestions,
  createReviewSessionWithSnapshotInTx,
  findReviewSessionAnswerInTx,
  getInProgressReviewSession,
  markReviewSessionCompletedOrThrow,
  upsertReviewSessionAnswerInTx,
} from '@/features/review-session/data';
import { prisma } from '@/lib/prisma';

// Returns the current in_progress session if any, or creates a new one with a snapshot
// of all currently-due questions. Returns null when nothing is due (caller stays on home).
export const startOrResumeReviewSession = async () => {
  const existing = await getInProgressReviewSession();
  if (existing) return existing;

  const now = new Date();
  const dueStates = await getDueQuestionReviewStates(now);
  if (dueStates.length === 0) return null;

  return prisma.$transaction((tx) =>
    createReviewSessionWithSnapshotInTx(tx, {
      questionIds: dueStates.map((s) => s.questionId),
    }),
  );
};

export const submitReviewAnswer = async (params: {
  reviewSessionId: ReviewSession['id'];
  questionId: string;
  answerOptionId: string;
  isCorrect: boolean;
}) => {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // Problem: duplicate submissions for one user answer advance box too many times.
    // Solution: skip the tx if this (session, question) pair is already recorded.
    const existing = await findReviewSessionAnswerInTx(tx, {
      reviewSessionId: params.reviewSessionId,
      questionId: params.questionId,
    });
    if (existing) return;

    const current = await getQuestionReviewStateInTx(tx, params.questionId);
    const next = computeNextStateOnReview(current.box, params.isCorrect, now);
    await upsertReviewSessionAnswerInTx(tx, params);
    await updateQuestionReviewStateInTx(tx, {
      questionId: params.questionId,
      box: next.box,
      dueAt: next.dueAt,
    });
  });

  const [answeredCount, totalCount] = await Promise.all([
    countReviewSessionAnswers(params.reviewSessionId),
    countReviewSessionQuestions(params.reviewSessionId),
  ]);
  if (answeredCount >= totalCount) {
    await markReviewSessionCompletedOrThrow(params.reviewSessionId);
  }
};
