import { Output, streamText } from 'ai';

import {
  OrderStatus,
  QuizSessionStatus,
  type QuizSession,
  type Topic,
} from '@/app/generated/prisma/client';
import { createOrder, updateOrderByQuizSession } from '@/features/order/data';
import {
  countSessionAnswers,
  countSessionQuestions,
  createQuestionWithOptions,
  createQuizSession,
  upsertSessionAnswer,
  createSessionQuestion,
  createSessionQuestions,
  getLatestQuizSessionOrThrow,
  getQuizSessionWithTopicByIdOrThrow,
  getSessionQuestionsWithOptions,
  getTopicQuestions,
  markSessionCompletedOrThrow,
} from '@/features/quiz/data';
import { buildQuizGenerationPrompt } from '@/features/quiz/prompts';
import {
  generatedQuestionSchema,
  generatedQuizSchema,
  type GeneratedQuestion,
} from '@/features/quiz/schemas';
import { createTopic } from '@/features/topic/data';
import { quizModel, quizModelId } from '@/lib/openai';

export const resumeOrRestartQuiz = async (topicId: Topic['id']) => {
  const latestSession = await getLatestQuizSessionOrThrow(topicId);
  if (latestSession.status === QuizSessionStatus.in_progress) return latestSession;
  return createQuizSession(topicId);
};

export const submitAnswer = async (params: {
  quizSessionId: QuizSession['id'];
  questionId: string;
  answerOptionId: string;
  isCorrect: boolean;
}) => {
  const session = await getQuizSessionWithTopicByIdOrThrow(params.quizSessionId);
  await upsertSessionAnswer(params);
  const answeredCount = await countSessionAnswers(params.quizSessionId);
  if (answeredCount >= session.questionCount) {
    await markSessionCompletedOrThrow(params.quizSessionId);
  }
};

export const createTopicAndSession = async (title: Topic['title']) => {
  const topic = await createTopic(title);
  const session = await createQuizSession(topic.id);
  await createOrder({ topicId: topic.id, quizSessionId: session.id });
  return session;
};

const linkExistingTopicQuestionsIfRetry = async (sessionId: QuizSession['id']) => {
  const linkedCount = await countSessionQuestions(sessionId);
  if (linkedCount > 0) return;
  const session = await getQuizSessionWithTopicByIdOrThrow(sessionId);
  const topicQuestions = await getTopicQuestions(session.topicId);
  if (topicQuestions.length === 0) return;
  await createSessionQuestions({
    quizSessionId: sessionId,
    questionIds: topicQuestions.map((q) => q.id),
  });
};

export const prepareSessionQuestions = async (sessionId: QuizSession['id']) => {
  await linkExistingTopicQuestionsIfRetry(sessionId);
  return getSessionQuestionsWithOptions(sessionId);
};

const isCompleteQuestion = (value: unknown): value is GeneratedQuestion => {
  return generatedQuestionSchema.safeParse(value).success;
};

export const generateQuizForSession = async function* (sessionId: QuizSession['id']) {
  const session = await getQuizSessionWithTopicByIdOrThrow(sessionId);

  const existing = await countSessionQuestions(sessionId);
  if (existing >= session.questionCount) return;

  const result = streamText({
    model: quizModel(),
    output: Output.object({ schema: generatedQuizSchema }),
    prompt: buildQuizGenerationPrompt(session.topic.title),
  });

  let emittedCount = existing;
  try {
    for await (const partial of result.partialOutputStream) {
      const questions = partial?.questions ?? [];
      while (emittedCount < questions.length && emittedCount < session.questionCount) {
        const candidate = questions[emittedCount];
        if (!isCompleteQuestion(candidate)) break;
        const saved = await createQuestionWithOptions({
          topicId: session.topicId,
          question: candidate,
        });
        await createSessionQuestion({
          quizSessionId: sessionId,
          questionId: saved.id,
          position: emittedCount,
        });
        yield { position: emittedCount, question: saved };
        emittedCount++;
      }
    }
    const usage = await result.usage;
    await updateOrderByQuizSession(sessionId, {
      status: OrderStatus.success,
      aiModel: quizModelId(),
      inputTokens: usage.inputTokens ?? null,
      outputTokens: usage.outputTokens ?? null,
    });
  } catch (error) {
    await updateOrderByQuizSession(sessionId, {
      status: OrderStatus.failed,
      aiModel: quizModelId(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
