import type { User, Topic } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export const createTopic = async (userId: User['id'], title: Topic['title']) => {
  return prisma.topic.create({
    data: { userId, title },
  });
};

export const getTopicsWithLatestSession = async (userId: User['id']) => {
  const topics = await prisma.topic.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30, // placeholder
    include: {
      quizSessions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true },
      },
    },
  });
  return topics
    .filter((topic) => topic.quizSessions.length > 0)
    .map(({ quizSessions, ...topic }) => ({
      ...topic,
      latestQuizSession: quizSessions[0],
    }));
};

export const getTopicById = async (id: Topic['id']) => {
  return prisma.topic.findUnique({
    where: { id },
  });
};
