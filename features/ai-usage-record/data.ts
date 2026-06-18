import {
  type AiUsageRecord,
  type Prisma,
  type QuizGenerationEvent,
  type User,
} from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export const createAiUsageRecord = async (data: {
  userId: User['id'];
  quizGenerationEventId: QuizGenerationEvent['id'];
  aiModel: AiUsageRecord['aiModel'];
  inputTokens: AiUsageRecord['inputTokens'];
  outputTokens: AiUsageRecord['outputTokens'];
  totalTokens: AiUsageRecord['totalTokens'];
  inputTokenDetails: Prisma.InputJsonValue;
  outputTokenDetails: Prisma.InputJsonValue;
}) => prisma.aiUsageRecord.create({ data });
