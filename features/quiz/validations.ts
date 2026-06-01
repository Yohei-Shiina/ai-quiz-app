// features/quiz/validations.ts
import { z } from 'zod';

// 'TOPIC_REQUIRED' is a stable code; the user-facing message is resolved
// per-locale in the action layer (lib/i18n/dictionaries.ts).
const topicTitleSchema = z.object({
  title: z.string().trim().min(1, 'TOPIC_REQUIRED'),
});

export type TitleValidationError = 'TOPIC_REQUIRED';

export const validateTitleTopic = (formData: FormData) => {
  const result = topicTitleSchema.safeParse({ title: formData.get('title') });
  if (!result.success) {
    return { error: 'TOPIC_REQUIRED' as TitleValidationError, data: null };
  }
  return { error: null, data: result.data };
};

const resumeOrRestartQuizSchema = z.object({
  topicId: z.string().min(1),
});

export const validateResumeOrRestartQuiz = (formData: FormData) => {
  const result = resumeOrRestartQuizSchema.safeParse({ topicId: formData.get('topicId') });
  if (!result.success) throw new Error('Invalid topicId');
  return result.data.topicId;
};
