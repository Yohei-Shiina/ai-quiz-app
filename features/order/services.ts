import { countActiveOrdersInWindow } from '@/features/order/data';
import { ORDER_RATE_LIMIT } from '@/lib/constants';

export const isOrderLimitReached = async () => {
  return (await countActiveOrdersInWindow()) >= ORDER_RATE_LIMIT;
};
