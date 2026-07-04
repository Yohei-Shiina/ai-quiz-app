import { requireAuth } from '@/features/auth/services';
import {
  countActiveDemoQuizGenerationEventsInWindow,
  countActiveQuizGenerationEventsForUser,
  countActiveQuizGenerationEventsInWindow,
} from '@/features/quiz-generation-event/data';
import {
  DEMO_QUIZ_GENERATION_GLOBAL_LIMIT,
  DEMO_QUIZ_GENERATION_PER_ACCOUNT_LIMIT,
  isDemoEmail,
  QUIZ_GENERATION_RATE_LIMIT,
} from '@/lib/constants';

// Which limit (if any) blocks the current user from generating another quiz.
// 'user_window' is the Google rolling-window cap; the two 'demo_*' reasons let the
// caller show a message matching the specific cap that was hit.
export type QuizGenerationLimit = 'none' | 'user_window' | 'demo_account' | 'demo_global';

export const getQuizGenerationLimit = async (): Promise<QuizGenerationLimit> => {
  const user = await requireAuth();

  if (isDemoEmail(user.email)) {
    const [perAccount, global] = await Promise.all([
      countActiveQuizGenerationEventsForUser(),
      countActiveDemoQuizGenerationEventsInWindow(),
    ]);
    if (perAccount >= DEMO_QUIZ_GENERATION_PER_ACCOUNT_LIMIT) return 'demo_account';
    if (global >= DEMO_QUIZ_GENERATION_GLOBAL_LIMIT) return 'demo_global';
    return 'none';
  }

  const count = await countActiveQuizGenerationEventsInWindow();
  return count >= QUIZ_GENERATION_RATE_LIMIT ? 'user_window' : 'none';
};

export const isQuizGenerationLimitReached = async (): Promise<boolean> => {
  return (await getQuizGenerationLimit()) !== 'none';
};
