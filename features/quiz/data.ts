import type { Topic, QuizSession } from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import type { GeneratedQuestion } from '@/features/quiz/schemas';
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

export const countSessionQuestions = async (quizSessionId: QuizSession['id']) => {
  const user = await requireAuth();
  return prisma.sessionQuestion.count({
    where: { quizSessionId, quizSession: { userId: user.id } },
  });
};

export const createQuestionWithOptions = async ({
  topicId,
  quizSessionId,
  position,
  question,
}: {
  topicId: Topic['id'];
  quizSessionId: QuizSession['id'];
  position: number;
  question: GeneratedQuestion;
}) => {
  const user = await requireAuth();
  await prisma.quizSession.findFirstOrThrow({
    where: { id: quizSessionId, userId: user.id, topicId },
  });
  return prisma.question.create({
    data: {
      topicId,
      body: question.body,
      answerOptions: {
        create: question.options.map((option, index) => ({
          body: option.body,
          position: index,
          isCorrect: option.isCorrect,
        })),
      },
      sessionQuestions: {
        create: { quizSessionId, position },
      },
    },
    include: { answerOptions: { orderBy: { position: 'asc' } } },
  });
};
