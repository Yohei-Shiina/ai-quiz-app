import {
  OrderStatus,
  type Order,
  type Prisma,
  type QuizSession,
  type Topic,
  type User,
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

// Transaction-only: takes a row lock on the session's Order so concurrent /generate
// calls for the same session serialize. Throws if no Order is found (wrong user or
// missing row), which doubles as an ownership check.
export const lockOrderForQuizSessionInTx = async (
  tx: Prisma.TransactionClient,
  quizSessionId: QuizSession['id'],
  userId: User['id'],
) => {
  // e.g. quizSessionId='s1', userId='u1' → locked=[{id:'o1'}] (we hold the lock)
  // e.g. wrong user or no order            → locked=[]        (throw below)
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM orders
    WHERE "quizSessionId" = ${quizSessionId} AND "userId" = ${userId}
    FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new Error(`No order row to lock for quiz session ${quizSessionId}`);
  }
};

// Transaction-only: called from inside generateQuizForSession's $transaction so the
// Order success/failure status flips atomically with the SessionQuestion inserts.
export const updateOrderByQuizSessionInTx = async (
  tx: Prisma.TransactionClient,
  quizSessionId: QuizSession['id'],
  data: Pick<Order, 'status'> &
    Partial<Pick<Order, 'aiModel' | 'inputTokens' | 'outputTokens' | 'errorMessage'>>,
) =>
  tx.order.updateMany({
    where: { quizSessionId },
    data,
  });

// Post-rollback recovery: the generation transaction rolled back, leaving the Order
// in its previous state. Record the failure on a fresh connection so analytics
// reflect what happened. Caller treats this as best-effort.
export const markOrderFailedByQuizSession = async (
  quizSessionId: QuizSession['id'],
  userId: User['id'],
  data: Partial<Pick<Order, 'aiModel' | 'errorMessage'>>,
) =>
  prisma.order.updateMany({
    where: { quizSessionId, userId },
    data: { status: OrderStatus.failed, ...data },
  });
