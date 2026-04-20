'use server';

import { redirect } from 'next/navigation';

import { requireAuth } from '@/features/auth/services';
import { getOrCreateLatestQuizSession } from '@/features/quiz/services';
import { validateTitleTopic, validateRetryQuiz } from '@/features/quiz/validations';
import { createQuizSession } from '@/lib/dal/quizSession';
import {
  createTopic,
  getTopicById,
  getTopicsWithLatestSession as getTopicsWithLatestSessionFromDB,
} from '@/lib/dal/topic';
import { ActionState } from '@/lib/types';

export const createQuizTopic = async (
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const user = await requireAuth();

  const result = validateTitleTopic(formData);
  if (result.error) {
    return { error: result.error };
  }

  const topic = await createTopic(user.id, result.data!.title);
  const session = await createQuizSession(user.id, topic.id);

  redirect(`/quiz/${session.id}`);
};

export const getTopicsWithLatestSession = async () => {
  const user = await requireAuth();
  return getTopicsWithLatestSessionFromDB(user.id);
};

export const resumeOrStartQuizSession = async (formData: FormData) => {
  const user = await requireAuth();
  const formTopicId = validateRetryQuiz(formData);
  const topic = await getTopicById(formTopicId);
  if (!topic || topic.userId !== user.id) throw new Error('Topic not found');
  const session = await getOrCreateLatestQuizSession(user.id, topic.id);

  redirect(`/quiz/${session.id}`);
};
