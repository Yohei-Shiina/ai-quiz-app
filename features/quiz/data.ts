import type { Topic, QuizSession } from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import { prisma } from '@/lib/prisma';

export const createQuizSession = async (topicId: Topic['id']) => {
  const user = await requireAuth();
  return prisma.quizSession.create({
    data: { topicId, userId: user.id },
  });
};

export const getLatestQuizSessionOrThrow = async (topicId: Topic['id']) => {
  const user = await requireAuth();
  const session = await prisma.quizSession.findFirstOrThrow({
    where: { topicId, userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return session;
};

export const getQuizSessionWithTopicByIdOrThrow = async (id: QuizSession['id']) => {
  const user = await requireAuth();
  const session = await prisma.quizSession.findUniqueOrThrow({
    where: { id, userId: user.id },
    include: { topic: true },
  });
  return session;
};
