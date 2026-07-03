import { randomUUID } from 'node:crypto';

import { QuizGenerationEventStatus } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { TEST_DB_URL } from '@/test/integration/test-db';

// Problem: resetDb wipes every table; if DATABASE_URL isn't the disposable test
//          DB (config regression / stray env / direct run) it would erase dev/prod.
// Solution: refuse unless the active connection is exactly the throwaway test DB.
const assertTargetingTestDb = () => {
  if (process.env.DATABASE_URL !== TEST_DB_URL) {
    throw new Error(
      `resetDb refused: DATABASE_URL is not the disposable test DB (expected ${TEST_DB_URL}).`,
    );
  }
};

// Wipe every table before each test. TRUNCATE ... CASCADE on users removes all
// child rows (topics, sessions, events, ...) in one statement; RESTART IDENTITY
// keeps runs independent.
export const resetDb = async () => {
  assertTargetingTestDb();
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
      aiModel: 'gpt-5.4-mini',
      ...(createdAt ? { createdAt } : {}),
    },
  });

export const disconnectDb = () => prisma.$disconnect();
