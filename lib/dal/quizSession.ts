import type { User, Topic } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export async function createQuizSession(userId: User['id'], topicId: Topic['id']) {
  return prisma.quizSession.create({
    data: { userId, topicId },
  });
}
