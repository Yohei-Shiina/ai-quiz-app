'use server';

import { redirect } from 'next/navigation';

import { isOrderLimitReached } from '@/features/order/services';
import { createTopicAndSession, resumeOrRestartQuiz, submitAnswer } from '@/features/quiz/services';
import { validateTitleTopic, validateResumeOrRestartQuiz } from '@/features/quiz/validations';
import { ORDER_RATE_LIMIT_MESSAGE } from '@/lib/constants';
import { ActionState } from '@/lib/types';

export const startQuizAction = async (
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const result = validateTitleTopic(formData);
  if (result.error) return { error: result.error };
  if (await isOrderLimitReached()) return { error: ORDER_RATE_LIMIT_MESSAGE };
  const session = await createTopicAndSession(result.data!.title);
  redirect(`/quiz/${session.id}`);
};

export const resumeOrRestartQuizAction = async (formData: FormData) => {
  const formTopicId = validateResumeOrRestartQuiz(formData);
  const session = await resumeOrRestartQuiz(formTopicId);
  redirect(`/quiz/${session.id}`);
};

export const submitSessionAnswerAction = async ({
  quizSessionId,
  questionId,
  answerOptionId,
  isCorrect,
}: {
  quizSessionId: string;
  questionId: string;
  answerOptionId: string;
  isCorrect: boolean;
}): Promise<void> => {
  await submitAnswer({ quizSessionId, questionId, answerOptionId, isCorrect });
};
