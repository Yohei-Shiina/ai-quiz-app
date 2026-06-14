import { Topic } from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import { prisma } from '@/lib/prisma';

export const createTopic = async (title: Topic['title']) => {
  const user = await requireAuth();
  return prisma.topic.create({
    data: { userId: user.id, title },
  });
};

export const deleteTopics = async (topicIds: Topic['id'][]) => {
  if (topicIds.length === 0) return { count: 0 };
  const user = await requireAuth();
  return prisma.topic.deleteMany({
    where: { id: { in: topicIds }, userId: user.id },
  });
};

export const getTopicsWithLatestSession = async () => {
  const user = await requireAuth();
  const topics = await prisma.topic.findMany({
    where: { userId: user.id },
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
