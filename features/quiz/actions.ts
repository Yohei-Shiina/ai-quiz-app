'use server';

import { redirect } from 'next/navigation';

import { createTopicAndSession, resumeOrRestartQuiz, submitAnswer } from '@/features/quiz/services';
import { validateTitleTopic, validateResumeOrRestartQuiz } from '@/features/quiz/validations';
import {
  createQuizGenerationEvent,
  hasPendingQuizGenerationEventBySession,
} from '@/features/quiz-generation-event/data';
import { getQuizGenerationLimit } from '@/features/quiz-generation-event/services';
import {
  DEMO_QUIZ_GENERATION_GLOBAL_LIMIT,
  DEMO_QUIZ_GENERATION_PER_ACCOUNT_LIMIT,
  QUIZ_GENERATION_RATE_LIMIT,
} from '@/lib/constants';
import { getDict } from '@/lib/i18n/server';
import { quizModelId } from '@/lib/openai';
import { ActionResult } from '@/lib/types';

// Resolves the active quiz-generation limit to a user-facing message, or null when
// generation is allowed. Keeps the per-limit copy in one place for both actions.
const getQuizGenerationLimitError = async (
  t: Awaited<ReturnType<typeof getDict>>,
): Promise<string | null> => {
  const limit = await getQuizGenerationLimit();
  switch (limit) {
    case 'none':
      return null;
    case 'user_window':
      return t.validation.rateLimit(QUIZ_GENERATION_RATE_LIMIT);
    case 'demo_account':
      return t.validation.demoAccountLimit(DEMO_QUIZ_GENERATION_PER_ACCOUNT_LIMIT);
    case 'demo_global':
      return t.validation.demoGlobalLimit(DEMO_QUIZ_GENERATION_GLOBAL_LIMIT);
  }
};

export const startQuizAction = async (
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> => {
  const result = validateTitleTopic(formData);
  const t = await getDict();
  if (result.error) return { success: false, error: t.validation.topicRequired };
  const limitError = await getQuizGenerationLimitError(t);
  if (limitError) return { success: false, error: limitError };
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
export const retryQuizGenerationAction = async (quizSessionId: string): Promise<ActionResult> => {
  const t = await getDict();
  const limitError = await getQuizGenerationLimitError(t);
  if (limitError) return { success: false, error: limitError };
  // Problem: multi-tab / API parallel retry creates multiple pending events, making
  //          tryAcquireGenerationLockBySession see count > 1 and lock the session
  //          into a permanent CAS dead-end (no /generate can ever acquire).
  // Solution: skip create if a pending event already exists for this session.
  //           Best-effort dedup; a sub-millisecond TOCTOU race window still permits
  //           parallel inserts, accepted as the rare-edge cost.
  if (await hasPendingQuizGenerationEventBySession(quizSessionId)) return { success: true };
  try {
    await createQuizGenerationEvent({ quizSessionId, aiModel: quizModelId() });
    return { success: true };
  } catch (error) {
    console.error('Retry quiz generation failed', { quizSessionId, error });
    return { success: false, error: t.answering.submitError };
  }
};
