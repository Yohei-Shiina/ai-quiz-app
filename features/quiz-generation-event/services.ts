import { countActiveQuizGenerationEventsInWindow } from '@/features/quiz-generation-event/data';
import { QUIZ_GENERATION_RATE_LIMIT } from '@/lib/constants';

export const isQuizGenerationLimitReached = async () => {
  return (await countActiveQuizGenerationEventsInWindow()) >= QUIZ_GENERATION_RATE_LIMIT;
};
