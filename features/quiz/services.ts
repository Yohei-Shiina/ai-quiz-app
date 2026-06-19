import { Output, streamText } from 'ai';

import {
  type Prisma,
  QuizSessionStatus,
  type QuizSession,
  type Topic,
} from '@/app/generated/prisma/client';
import { createAiUsageRecord } from '@/features/ai-usage-record/data';
import { requireAuth } from '@/features/auth/services';
import { createInitialReviewStateIfMissingInTx } from '@/features/question-review-state/data';
import { computeInitialStateOnFirstWrong } from '@/features/question-review-state/services';
import {
  countSessionAnswers,
  countSessionQuestions,
  createQuestionWithOptionsInTx,
  createQuizSession,
  createSessionQuestionInTx,
  upsertSessionAnswerInTx,
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
import {
  createQuizGenerationEvent,
  markGenerationFailed,
  markGenerationSuccess,
  tryAcquireGenerationLockBySession,
} from '@/features/quiz-generation-event/data';
import { createTopic } from '@/features/topic/data';
import { quizModel, quizModelId } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

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
  const initial = !params.isCorrect ? computeInitialStateOnFirstWrong(new Date()) : null;
  try {
    await prisma.$transaction(async (tx) => {
      await upsertSessionAnswerInTx(tx, params);
      if (initial) {
        await createInitialReviewStateIfMissingInTx(tx, {
          questionId: params.questionId,
          box: initial.box,
          dueAt: initial.dueAt,
        });
      }
    });
  } catch (err) {
    // Diagnostic for P2003 on session_answers.questionId — distinguishes "row missing"
    // (real bug) from "row not yet visible" (race with question generation tx).
    if ((err as { code?: string })?.code === 'P2003') {
      const q = await prisma.question.findUnique({
        where: { id: params.questionId },
        select: { id: true },
      });
      console.log('[FK-check]', {
        questionId: params.questionId,
        existsNow: !!q,
        ts: new Date().toISOString(),
      });
    }
    throw err;
  }
  const answeredCount = await countSessionAnswers(params.quizSessionId);
  if (answeredCount >= session.questionCount) {
    await markSessionCompletedOrThrow(params.quizSessionId);
  }
};

export const createTopicAndSession = async (title: Topic['title']) => {
  const topic = await createTopic(title);
  const session = await createQuizSession(topic.id);
  await createQuizGenerationEvent({ quizSessionId: session.id, aiModel: quizModelId() });
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

// Problem: parallel /generate calls (e.g. reload mid-stream, multi-tab) used to
//          trigger redundant LLM runs and duplicate Question rows. The previous
//          fix wrapped the whole stream in one long $transaction, but that kept
//          questions invisible to other tx's until all five committed, so a fast
//          user answer hit an FK race against an uncommitted Question row.
// Solution: CAS lock on the event row (single-statement, pool-safe) + commit
//           each question in its own small tx so the Question is visible to
//           other connections the moment it's pushed to the SSE client.
export const generateQuizForSession = async function* (sessionId: QuizSession['id']) {
  const user = await requireAuth();

  const eventId = await tryAcquireGenerationLockBySession(sessionId);

  if (eventId === null) {
    // Another caller holds the lock; emit what's already committed so the
    // client at least sees prior progress. Live forwarding of new commits is
    // not implemented yet, so clients hitting this path should reload to retry.
    const stored = await getSessionQuestionsWithOptions(sessionId);
    for (let i = 0; i < stored.length; i++) {
      yield { position: i, question: stored[i] };
    }
    return;
  }

  try {
    const session = await prisma.quizSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { topic: true },
    });

    const existing = await prisma.sessionQuestion.count({
      where: { quizSessionId: sessionId },
    });

    if (existing >= session.questionCount) {
      // Already complete (a previous run finished but the event was left in
      // pending somehow, or the row got re-armed). Just emit stored.
      const stored = await getSessionQuestionsWithOptions(sessionId);
      for (let i = 0; i < stored.length; i++) {
        yield { position: i, question: stored[i] };
      }
    } else {
      const result = streamText({
        model: quizModel(),
        output: Output.object({ schema: generatedQuizSchema }),
        prompt: buildQuizGenerationPrompt(session.topic.title),
      });

      let emittedCount = existing;
      for await (const partial of result.partialOutputStream) {
        const questions = partial?.questions ?? [];
        while (emittedCount < questions.length && emittedCount < session.questionCount) {
          const candidate = questions[emittedCount];
          if (!isCompleteQuestion(candidate)) break;

          const saved = await prisma.$transaction(async (tx) => {
            const q = await createQuestionWithOptionsInTx(tx, {
              topicId: session.topicId,
              question: candidate,
            });
            await createSessionQuestionInTx(tx, {
              quizSessionId: session.id,
              questionId: q.id,
              position: emittedCount,
            });
            return q;
          });

          yield { position: emittedCount, question: saved };
          emittedCount++;
        }
      }

      const usage = await result.usage;
      await createAiUsageRecord({
        userId: user.id,
        quizGenerationEventId: eventId,
        aiModel: quizModelId(),
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
        inputTokenDetails: usage.inputTokenDetails as Prisma.InputJsonValue,
        outputTokenDetails: usage.outputTokenDetails as Prisma.InputJsonValue,
      });
    }

    await markGenerationSuccess(eventId);
  } catch (error) {
    await markGenerationFailed(eventId).catch(() => undefined);
    throw error;
  }
};
