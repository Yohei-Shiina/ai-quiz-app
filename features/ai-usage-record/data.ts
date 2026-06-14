import {
  type AiUsageRecord,
  type Prisma,
  type QuizGenerationEvent,
  type User,
} from '@/app/generated/prisma/client';

// Transaction-only: inserted together with the generation success update so usage
// accounting reflects exactly the runs that committed.
export const createAiUsageRecordInTx = async (
  tx: Prisma.TransactionClient,
  data: {
    userId: User['id'];
    quizGenerationEventId: QuizGenerationEvent['id'];
    aiModel: AiUsageRecord['aiModel'];
    inputTokens: AiUsageRecord['inputTokens'];
    outputTokens: AiUsageRecord['outputTokens'];
    totalTokens: AiUsageRecord['totalTokens'];
    inputTokenDetails: Prisma.InputJsonValue;
    outputTokenDetails: Prisma.InputJsonValue;
  },
) => tx.aiUsageRecord.create({ data });
