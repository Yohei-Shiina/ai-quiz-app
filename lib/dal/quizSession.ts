import type { User, Topic, QuizSession } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export const createQuizSession = async (userId: User['id'], topicId: Topic['id']) => {
  return prisma.quizSession.create({
    data: { userId, topicId },
  });
};

export const getLatestQuizSession = async (userId: User['id'], topicId: Topic['id']) => {
  return prisma.quizSession.findFirst({
    where: { userId, topicId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getQuizSessionWithTopicById = async (id: QuizSession['id']) => {
  return prisma.quizSession.findUnique({ where: { id }, include: { topic: true } });
};
