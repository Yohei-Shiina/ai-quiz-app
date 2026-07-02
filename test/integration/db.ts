import { randomUUID } from 'node:crypto';

import { QuizGenerationEventStatus } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

// Wipe every table before each test. TRUNCATE ... CASCADE on users removes all
// child rows (topics, sessions, events, ...) in one statement; RESTART IDENTITY
// keeps runs independent.
export const resetDb = async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
};

export const seedUser = async () =>
  prisma.user.create({
    data: { email: `test-${randomUUID()}@test.local`, name: 'Test User' },
  });

export const seedQuizSession = async (userId: string) => {
  const topic = await prisma.topic.create({ data: { userId, title: 'Test Topic' } });
  return prisma.quizSession.create({ data: { userId, topicId: topic.id } });
};

interface SeedEventOptions {
  userId: string;
  quizSessionId?: string;
  status?: QuizGenerationEventStatus;
  createdAt?: Date;
}

export const seedGenerationEvent = ({
  userId,
  quizSessionId,
  status = QuizGenerationEventStatus.pending,
  createdAt,
}: SeedEventOptions) =>
  prisma.quizGenerationEvent.create({
    data: {
      userId,
      quizSessionId,
      status,
      aiModel: 'gpt-4o-mini',
      ...(createdAt ? { createdAt } : {}),
    },
  });

export const disconnectDb = () => prisma.$disconnect();
