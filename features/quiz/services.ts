import { Output, streamText } from 'ai';

import {
  type Prisma,
  QuizGenerationEventStatus,
  QuizSessionStatus,
  type QuizSession,
  type Topic,
} from '@/app/generated/prisma/client';
import { createAiUsageRecordInTx } from '@/features/ai-usage-record/data';
import { requireAuth } from '@/features/auth/services';
import {
  countSessionAnswers,
  countSessionQuestions,
  createQuestionWithOptionsInTx,
  createQuizSession,
  createSessionQuestionInTx,
  upsertSessionAnswer,
  createSessionQuestions,
  getLatestQuizSessionOrThrow,
  getQuizSessionWithTopicByIdOrThrow,
  getSessionQuestionsWithOptions,
  getStoredSessionQuestionsWithOptionsInTx,
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
  getQuizGenerationEventIdBySessionInTx,
  lockQuizGenerationEventForSessionInTx,
  markQuizGenerationEventFailedBySession,
  updateQuizGenerationEventBySessionInTx,
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
  await upsertSessionAnswer(params);
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

type GeneratedChunk = {
  position: number;
  question: Awaited<ReturnType<typeof createQuestionWithOptionsInTx>>;
};

// One-shot signal: the consumer awaits `chunkAvailable`, the producer calls
// `notifyChunkAvailable()` to wake it. Used once and replaced with a fresh pair afterward.
const createChunkAvailableSignal = () => {
  let notifyChunkAvailable!: () => void;
  const chunkAvailable = new Promise<void>((resolve) => {
    notifyChunkAvailable = resolve;
  });
  return { chunkAvailable, notifyChunkAvailable };
};

// → emit path: another tx already populated the session; send stored questions
//   as chunks so the SSE client (e.g. reloaded mid-generation) still receives them.
const emitStoredQuestions = async (
  tx: Prisma.TransactionClient,
  sessionId: QuizSession['id'],
  push: (chunk: GeneratedChunk) => void,
) => {
  const stored = await getStoredSessionQuestionsWithOptionsInTx(tx, sessionId);
  for (const sq of stored) {
    push({ position: sq.position, question: sq.question });
  }
};

// → generate path: stream from the LLM, persist each completed question, and push
//   chunks as we go. Finally flips the event to success and logs an AiUsageRecord
//   in the same tx so questions + event + usage commit together.
const generateAndPersistQuestions = async (
  tx: Prisma.TransactionClient,
  session: {
    id: QuizSession['id'];
    topicId: Topic['id'];
    topic: { title: string };
    questionCount: number;
  },
  startPosition: number,
  userId: string,
  push: (chunk: GeneratedChunk) => void,
) => {
  const result = streamText({
    model: quizModel(),
    output: Output.object({ schema: generatedQuizSchema }),
    prompt: buildQuizGenerationPrompt(session.topic.title),
  });

  let emittedCount = startPosition;
  for await (const partial of result.partialOutputStream) {
    // e.g. partial={questions:[{body:'...',options:[...]}, {body:'...half'}]}
    //   → questions[0] is complete, questions[1] is still streaming
    const questions = partial?.questions ?? [];
    while (emittedCount < questions.length && emittedCount < session.questionCount) {
      const candidate = questions[emittedCount];
      // → break out and wait for the next partial if this slot isn't complete yet
      if (!isCompleteQuestion(candidate)) break;
      const saved = await createQuestionWithOptionsInTx(tx, {
        topicId: session.topicId,
        question: candidate,
      });
      await createSessionQuestionInTx(tx, {
        quizSessionId: session.id,
        questionId: saved.id,
        position: emittedCount,
      });
      // e.g. emittedCount=0, saved={id:'q1', ...} → push {position:0, question:{...}}
      push({ position: emittedCount, question: saved });
      emittedCount++;
    }
  }

  const usage = await result.usage;
  await updateQuizGenerationEventBySessionInTx(tx, session.id, {
    status: QuizGenerationEventStatus.success,
  });
  const eventId = await getQuizGenerationEventIdBySessionInTx(tx, session.id);
  await createAiUsageRecordInTx(tx, {
    userId,
    quizGenerationEventId: eventId,
    aiModel: quizModelId(),
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
    inputTokenDetails: usage.inputTokenDetails as Prisma.InputJsonValue,
    outputTokenDetails: usage.outputTokenDetails as Prisma.InputJsonValue,
  });
};

// Problem 1: parallel /generate calls (e.g. reload mid-stream) trigger redundant
//            LLM runs (excess Question rows, wasted tokens).
// Solution: row lock on QuizGenerationEvent. First caller generates; later callers send
//            back the stored questions instead of generating again.
//
// Problem 2: $transaction's callback can't yield from a generator.
// Solution: tx pushes to a queue and notifies; outer generator awaits and yields.
export const generateQuizForSession = async function* (sessionId: QuizSession['id']) {
  const user = await requireAuth();

  const queue: GeneratedChunk[] = [];
  let finished = false;
  let caughtError: unknown = null;
  let { chunkAvailable, notifyChunkAvailable } = createChunkAvailableSignal();
  const push = (chunk: GeneratedChunk) => {
    queue.push(chunk);
    notifyChunkAvailable();
  };

  const generationTask = prisma
    .$transaction(
      async (tx) => {
        await lockQuizGenerationEventForSessionInTx(tx, sessionId, user.id);

        const session = await tx.quizSession.findUniqueOrThrow({
          where: { id: sessionId },
          include: { topic: true },
        });

        // e.g. existing=5, questionCount=5 → emit path (another tx already won)
        // e.g. existing=0, questionCount=5 → generate path (we are the first)
        const existing = await tx.sessionQuestion.count({
          where: { quizSessionId: sessionId },
        });
        if (existing >= session.questionCount) {
          await emitStoredQuestions(tx, sessionId, push);
          return;
        }
        await generateAndPersistQuestions(tx, session, existing, user.id, push);
      },
      // timeout: matches route's maxDuration so the tx never outlives the request.
      // maxWait: how long Prisma waits for a connection pool slot before giving up.
      { timeout: 60_000, maxWait: 30_000 },
    )
    .catch(async (error) => {
      // → stash for re-throw after the queue drains; route handler will log + emit SSE error
      caughtError = error;
      // → tx rolled back, so the event status is unchanged; record failure on a fresh
      //   connection. Ignore secondary failures so the original error is what surfaces.
      await markQuizGenerationEventFailedBySession(sessionId, user.id).catch(() => undefined);
    })
    .finally(() => {
      finished = true;
      // → final wake so the yield loop exits even if it's currently awaiting the signal
      notifyChunkAvailable();
    });

  while (!finished || queue.length > 0) {
    // e.g. queue=[c0, c1], finished=false   → yield c0, loop with queue=[c1]
    // e.g. queue=[], finished=false         → await chunkAvailable (CPU 0), wakes on next push or on finish
    // e.g. queue=[c2], finished=true        → yield c2, then loop exits (queue empty + finished)
    if (queue.length > 0) {
      yield queue.shift()!;
    } else {
      await chunkAvailable;
      // → swap in a fresh signal so the next sleep waits for the next notification
      ({ chunkAvailable, notifyChunkAvailable } = createChunkAvailableSignal());
    }
  }
  await generationTask;
  if (caughtError) throw caughtError;
};
