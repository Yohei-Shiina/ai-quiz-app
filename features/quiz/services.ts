import type { Topic, User } from '@/app/generated/prisma/client';
import { getLatestQuizSession, createQuizSession } from '@/lib/dal/quizSession';

export const getOrCreateLatestQuizSession = async (userId: User['id'], topicId: Topic['id']) => {
  const latestSession = await getLatestQuizSession(userId, topicId);
  if (!latestSession) throw new Error('QuizSession not found');
  if (latestSession.status === 'in_progress') return latestSession;
  return createQuizSession(userId, topicId);
};
