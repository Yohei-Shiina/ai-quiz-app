import { Output, streamText } from 'ai';

import { QuizSessionStatus, type QuizSession, type Topic } from '@/app/generated/prisma/client';
import {
  countSessionQuestions,
  createQuestionWithOptions,
  createQuizSession,
  getLatestQuizSessionOrThrow,
  getQuizSessionWithTopicByIdOrThrow,
} from '@/features/quiz/data';
import { buildQuizGenerationPrompt } from '@/features/quiz/prompts';
import {
  generatedQuestionSchema,
  generatedQuizSchema,
  QUIZ_QUESTION_COUNT,
  type GeneratedQuestion,
} from '@/features/quiz/schemas';
import { createTopic } from '@/features/topic/data';
import { quizModel } from '@/lib/openai';

export const resumeOrRestartQuiz = async (topicId: Topic['id']) => {
  const latestSession = await getLatestQuizSessionOrThrow(topicId);
  if (latestSession.status === QuizSessionStatus.in_progress) return latestSession;
  return createQuizSession(topicId);
};

export const createTopicAndSession = async (title: Topic['title']) => {
  const topic = await createTopic(title);
  const session = await createQuizSession(topic.id);
  return session;
};

const isCompleteQuestion = (value: unknown): value is GeneratedQuestion => {
  return generatedQuestionSchema.safeParse(value).success;
};

export const generateQuizForSession = async function* (sessionId: QuizSession['id']) {
  const session = await getQuizSessionWithTopicByIdOrThrow(sessionId);

  const existing = await countSessionQuestions(sessionId);
  if (existing >= QUIZ_QUESTION_COUNT) return;

  const { partialOutputStream } = streamText({
    model: quizModel(),
    output: Output.object({ schema: generatedQuizSchema }),
    prompt: buildQuizGenerationPrompt(session.topic.title),
  });

  let emittedCount = existing;
  for await (const partial of partialOutputStream) {
    const questions = partial?.questions ?? [];
    while (emittedCount < questions.length && emittedCount < QUIZ_QUESTION_COUNT) {
      const candidate = questions[emittedCount];
      if (!isCompleteQuestion(candidate)) break;
      const saved = await createQuestionWithOptions({
        topicId: session.topicId,
        quizSessionId: sessionId,
        position: emittedCount,
        question: candidate,
      });
      yield { position: emittedCount, question: saved };
      emittedCount++;
    }
  }
};
