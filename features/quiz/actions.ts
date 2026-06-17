'use server';

import { redirect } from 'next/navigation';

import { createTopicAndSession, resumeOrRestartQuiz, submitAnswer } from '@/features/quiz/services';
import { validateTitleTopic, validateResumeOrRestartQuiz } from '@/features/quiz/validations';
import { createQuizGenerationEvent } from '@/features/quiz-generation-event/data';
import { isQuizGenerationLimitReached } from '@/features/quiz-generation-event/services';
import { QUIZ_GENERATION_RATE_LIMIT } from '@/lib/constants';
import { getDict } from '@/lib/i18n/server';
import { quizModelId } from '@/lib/openai';
import { ActionResult } from '@/lib/types';

export const startQuizAction = async (
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> => {
  const result = validateTitleTopic(formData);
  const t = await getDict();
  if (result.error) return { success: false, error: t.validation.topicRequired };
  if (await isQuizGenerationLimitReached())
    return { success: false, error: t.validation.rateLimit(QUIZ_GENERATION_RATE_LIMIT) };
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
  } catch (error) {
    console.error('Submit answer failed', { quizSessionId, questionId, error });
    const t = await getDict();
    return { success: false, error: t.answering.submitError };
  }
};

// Called from the stream-retry button when a prior generation failed (event
// status='failed' blocks the CAS lock from being re-acquired). Creates a fresh
// QuizGenerationEvent in `pending` so the next SSE call can CAS-acquire it
// and resume from the committed-so-far position.
export const retryQuizGenerationAction = async (
  quizSessionId: string,
): Promise<ActionResult> => {
  try {
    await createQuizGenerationEvent({ quizSessionId, aiModel: quizModelId() });
    return { success: true };
  } catch (error) {
    console.error('Retry quiz generation failed', { quizSessionId, error });
    const t = await getDict();
    return { success: false, error: t.answering.submitError };
  }
};
