// features/quiz/validations.ts
import { z } from 'zod';

const topicTitleSchema = z.object({
  title: z.string().trim().min(1, 'Topic is required'),
});

export function validateTitleTopic(formData: FormData) {
  const result = topicTitleSchema.safeParse({ title: formData.get('title') });
  if (!result.success) {
    const errors = z.flattenError(result.error);
    return { error: errors.fieldErrors.title?.[0], data: null };
  }
  return { error: null, data: result.data };
}

const retryQuizSchema = z.object({
  topicId: z.string().min(1),
});

export const validateRetryQuiz = (formData: FormData) => {
  const result = retryQuizSchema.safeParse({ topicId: formData.get('topicId') });
  if (!result.success) throw new Error('Invalid topicId');
  return result.data.topicId;
};
