'use server';

import { redirect } from 'next/navigation';

import { createTopicAndSession, resumeOrRestartQuiz } from '@/features/quiz/services';
import { validateTitleTopic, validateResumeOrRestartQuiz } from '@/features/quiz/validations';
import { ActionState } from '@/lib/types';

export const startQuizAction = async (
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const result = validateTitleTopic(formData);
  if (result.error) return { error: result.error };
  const session = await createTopicAndSession(result.data!.title);
  redirect(`/quiz/${session.id}`);
};

export const resumeOrRestartQuizAction = async (formData: FormData) => {
  const formTopicId = validateResumeOrRestartQuiz(formData);
  const session = await resumeOrRestartQuiz(formTopicId);
  redirect(`/quiz/${session.id}`);
};
