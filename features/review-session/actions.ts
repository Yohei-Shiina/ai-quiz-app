'use server';

import { redirect } from 'next/navigation';

import { startOrResumeReviewSession, submitReviewAnswer } from '@/features/review-session/services';
import { ROUTES } from '@/lib/constants';
import { getDict } from '@/lib/i18n/server';
import { type ActionResult } from '@/lib/types';

export const startOrResumeReviewSessionAction = async () => {
  const session = await startOrResumeReviewSession();
  if (!session) redirect(ROUTES.home);
  redirect(`/review/${session.id}`);
};

export const submitReviewSessionAnswerAction = async (params: {
  reviewSessionId: string;
  questionId: string;
  answerOptionId: string;
  isCorrect: boolean;
}): Promise<ActionResult> => {
  try {
    await submitReviewAnswer(params);
    return { success: true };
  } catch (error) {
    console.error('Submit review answer failed', {
      reviewSessionId: params.reviewSessionId,
      questionId: params.questionId,
      error,
    });
    const t = await getDict();
    return { success: false, error: t.answering.submitError };
  }
};
