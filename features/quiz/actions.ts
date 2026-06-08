'use server';

import { redirect } from 'next/navigation';

import { isOrderLimitReached } from '@/features/order/services';
import { createTopicAndSession, resumeOrRestartQuiz, submitAnswer } from '@/features/quiz/services';
import { validateTitleTopic, validateResumeOrRestartQuiz } from '@/features/quiz/validations';
import { ORDER_RATE_LIMIT } from '@/lib/constants';
import { getDict } from '@/lib/i18n/server';
import { ActionResult } from '@/lib/types';

export const startQuizAction = async (
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> => {
  const result = validateTitleTopic(formData);
  const t = await getDict();
  if (result.error) return { success: false, error: t.validation.topicRequired };
  if (await isOrderLimitReached())
    return { success: false, error: t.validation.rateLimit(ORDER_RATE_LIMIT) };
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
}): Promise<ActionResult> => {
  try {
    await submitAnswer({ quizSessionId, questionId, answerOptionId, isCorrect });
    return { success: true };
  } catch {
    const t = await getDict();
    return { success: false, error: t.answering.submitError };
  }
};
