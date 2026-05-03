import type { User, Topic } from '@/app/generated/prisma/client';
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
