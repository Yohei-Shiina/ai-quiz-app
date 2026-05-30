import {
  OrderStatus,
  type Order,
  type QuizSession,
  type Topic,
} from '@/app/generated/prisma/client';
import { requireAuth } from '@/features/auth/services';
import { ORDER_RATE_LIMIT_WINDOW_MS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export const createOrder = async ({
  topicId,
  quizSessionId,
}: {
  topicId: Topic['id'];
  quizSessionId: QuizSession['id'];
}) => {
  const user = await requireAuth();
  return prisma.order.create({
    data: { userId: user.id, topicId, quizSessionId },
  });
};

// Rolling window: count the current user's non-failed orders created within the
// trailing ORDER_RATE_LIMIT_WINDOW_MS. The userId key is isolated here in case a future
// switch to anonymous identifiers only touches this query.
export const countActiveOrdersInWindow = async () => {
  const user = await requireAuth();
  const since = new Date(Date.now() - ORDER_RATE_LIMIT_WINDOW_MS);
  return prisma.order.count({
    where: {
      userId: user.id,
      status: { not: OrderStatus.failed },
      createdAt: { gte: since },
    },
  });
};

export const updateOrderByQuizSession = async (
  quizSessionId: QuizSession['id'],
  data: Pick<Order, 'status'> &
    Partial<Pick<Order, 'aiModel' | 'inputTokens' | 'outputTokens' | 'errorMessage'>>,
) => {
  const user = await requireAuth();
  return prisma.order.updateMany({
    where: { quizSessionId, userId: user.id },
    data,
  });
};
