// features/quiz/validations.ts
import { z } from 'zod';

const topicTitleSchema = z.object({
  title: z.string().trim().min(1, 'Topic is required'),
});

export const validateTitleTopic = (formData: FormData) => {
  const result = topicTitleSchema.safeParse({ title: formData.get('title') });
  if (!result.success) {
    const errors = z.flattenError(result.error);
    return { error: errors.fieldErrors.title?.[0], data: null };
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

export const EntityCheckInputSchema = z
  .string()
  .trim()
  .min(1, 'Input is required')
  .max(200, 'Input is too long');

export const EntityCheckResponseSchema = z.object({
  entityAmbiguous: z.boolean(),
  angleAmbiguous: z.boolean(),
  entityCandidates: z.array(z.string()).max(5),
});

export const OutlineGenerationInputSchema = z.object({
  input: z.string().trim().min(1, 'Input is required').max(200, 'Input is too long'),
  entity: z.string().trim().min(1).max(100).optional(),
});

export const OutlineGenerationResponseSchema = z.object({
  outlines: z.array(z.string()).length(4),
});
