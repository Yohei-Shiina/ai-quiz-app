import {
  QuizSessionStatus,
  type Topic,
  type QuizSession,
  type Question,
} from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import { QUIZ_QUESTION_COUNT, type GeneratedQuestion } from '@/features/quiz/schemas';
import { prisma } from '@/lib/prisma';

export const createQuizSession = async (topicId: Topic['id']) => {
  const user = await requireAuth();
  await prisma.topic.findFirstOrThrow({
    where: { id: topicId, userId: user.id },
  });
  return prisma.quizSession.create({
    data: { topicId, userId: user.id, questionCount: QUIZ_QUESTION_COUNT },
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

// Internal flows (quiz generation / answer submission): the session was already
// verified at page load, so a miss here is unexpected -> throw (handled by R5/R6/R7).
export const getQuizSessionWithTopicByIdOrThrow = async (id: QuizSession['id']) => {
  const user = await requireAuth();
  const session = await prisma.quizSession.findUniqueOrThrow({
    where: { id, userId: user.id },
    include: { topic: true },
  });
  return session;
};

export const getQuizSessionWithTopicById = async (id: QuizSession['id']) => {
  const user = await requireAuth();
  return prisma.quizSession.findUnique({
    where: { id, userId: user.id },
    include: { topic: true },
  });
};

export const countSessionQuestions = async (quizSessionId: QuizSession['id']) => {
  const user = await requireAuth();
  return prisma.sessionQuestion.count({
    where: { quizSessionId, quizSession: { userId: user.id } },
  });
};

export const getSessionQuestionsWithOptions = async (quizSessionId: QuizSession['id']) => {
  const user = await requireAuth();
  const sessionQuestions = await prisma.sessionQuestion.findMany({
    where: { quizSessionId, quizSession: { userId: user.id } },
    orderBy: { position: 'asc' },
    include: {
      question: {
        include: { answerOptions: true },
      },
    },
  });
  return sessionQuestions.map(({ question }) => question);
};

export const createSessionAnswer = async ({
  quizSessionId,
  questionId,
  answerOptionId,
  isCorrect,
}: {
  quizSessionId: QuizSession['id'];
  questionId: string;
  answerOptionId: string;
  isCorrect: boolean;
}) => {
  const user = await requireAuth();
  await prisma.quizSession.findFirstOrThrow({
    where: { id: quizSessionId, userId: user.id },
  });
  return prisma.sessionAnswer.create({
    data: { quizSessionId, questionId, answerOptionId, isCorrect },
  });
};

export const countSessionAnswers = async (quizSessionId: QuizSession['id']) => {
  const user = await requireAuth();
  return prisma.sessionAnswer.count({
    where: { quizSessionId, quizSession: { userId: user.id } },
  });
};

export const markSessionCompletedOrThrow = async (id: QuizSession['id']) => {
  const user = await requireAuth();
  await prisma.quizSession.findFirstOrThrow({
    where: { id, userId: user.id },
  });
  return prisma.quizSession.update({
    where: { id },
    data: { status: QuizSessionStatus.completed },
  });
};

export const createQuestionWithOptions = async ({
  topicId,
  question,
}: {
  topicId: Topic['id'];
  question: GeneratedQuestion;
}) => {
  const user = await requireAuth();
  await prisma.topic.findFirstOrThrow({
    where: { id: topicId, userId: user.id },
  });
  return prisma.question.create({
    data: {
      topicId,
      body: question.body,
      explanation: question.explanation,
      answerOptions: {
        create: question.options.map((option) => ({
          body: option.body,
          isCorrect: option.isCorrect,
        })),
      },
    },
    include: { answerOptions: true },
  });
};

export const createSessionQuestion = async ({
  quizSessionId,
  questionId,
  position,
}: {
  quizSessionId: QuizSession['id'];
  questionId: string;
  position: number;
}) => {
  const user = await requireAuth();
  await prisma.quizSession.findFirstOrThrow({
    where: {
      id: quizSessionId,
      userId: user.id,
      topic: {
        userId: user.id,
        questions: { some: { id: questionId } },
      },
    },
  });
  return prisma.sessionQuestion.create({
    data: { quizSessionId, questionId, position },
  });
};

export const createSessionQuestions = async ({
  quizSessionId,
  questionIds,
}: {
  quizSessionId: QuizSession['id'];
  questionIds: Question['id'][];
}) => {
  const user = await requireAuth();
  const session = await prisma.quizSession.findFirstOrThrow({
    where: { id: quizSessionId, userId: user.id },
    select: { topicId: true },
  });
  const validCount = await prisma.question.count({
    where: { topicId: session.topicId, id: { in: questionIds } },
  });
  if (validCount !== questionIds.length) {
    throw new Error('Some questionIds do not belong to the session topic');
  }
  return prisma.sessionQuestion.createManyAndReturn({
    data: questionIds.map((questionId, position) => ({
      quizSessionId,
      questionId,
      position,
    })),
  });
};

export const getTopicQuestions = async (topicId: Topic['id']) => {
  const user = await requireAuth();
  const topic = await prisma.topic.findFirstOrThrow({
    where: { id: topicId, userId: user.id },
    include: { questions: { orderBy: { createdAt: 'asc' } } },
  });
  return topic.questions;
};

export const getSessionResult = async (sessionId: QuizSession['id']) => {
  const user = await requireAuth();
  return prisma.quizSession.findUnique({
    where: { id: sessionId, userId: user.id },
    include: {
      topic: true,
      sessionQuestions: {
        orderBy: { position: 'asc' },
        include: {
          question: {
            include: { answerOptions: true },
          },
        },
      },
      sessionAnswer: true,
    },
  });
};
