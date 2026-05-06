import type { QuizSession, Topic, User } from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import {
  getLatestQuizSession,
  createQuizSession,
  getQuizSessionWithTopicById,
} from '@/lib/dal/quizSession';

export const getOrCreateLatestQuizSession = async (userId: User['id'], topicId: Topic['id']) => {
  const latestSession = await getLatestQuizSession(userId, topicId);
  if (!latestSession) throw new Error('QuizSession not found');
  if (latestSession.status === 'in_progress') return latestSession;
  return createQuizSession(userId, topicId);
};

export const getQuizSessionWithTopic = async (sessionId: QuizSession['id']) => {
  const user = await requireAuth();
  const session = await getQuizSessionWithTopicById(sessionId);
  if (!session || !session.topic) throw new Error('QuizSession or topic not found');
  if (user.id !== session.userId) throw new Error('Forbidden');
  return session;
};
