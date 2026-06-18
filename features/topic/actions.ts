'use server';

import { revalidatePath } from 'next/cache';

import { deleteTopics } from '@/features/topic/data';
import { validateDeleteTopics } from '@/features/topic/validations';

export const deleteTopicsAction = async (topicIds: string[]) => {
  const validated = validateDeleteTopics({ topicIds });
  await deleteTopics(validated);
  revalidatePath('/');
};
