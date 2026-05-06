import type { Topic } from '@/app/generated/prisma/client';
import { getLatestQuizSessionOrThrow, createQuizSession } from '@/features/quiz/data';
import { createTopic } from '@/features/topic/data';

export const resumeOrRestartQuiz = async (topicId: Topic['id']) => {
  const latestSession = await getLatestQuizSessionOrThrow(topicId);
  if (latestSession.status === 'in_progress') return latestSession;
  return createQuizSession(topicId);
};

export const createTopicAndSession = async (title: Topic['title']) => {
  const topic = await createTopic(title);
  const session = await createQuizSession(topic.id);
  return session;
};
