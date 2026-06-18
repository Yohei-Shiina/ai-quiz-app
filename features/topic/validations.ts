import { z } from 'zod';

const deleteTopicsSchema = z.object({
  topicIds: z.array(z.string().min(1)).min(1),
});

export const validateDeleteTopics = (input: { topicIds: unknown }) => {
  const result = deleteTopicsSchema.safeParse(input);
  if (!result.success) throw new Error('Invalid topicIds');
  return result.data.topicIds;
};
