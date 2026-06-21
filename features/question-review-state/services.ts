// Leitner-style intervals: 1-indexed box → days. Box 9 caps at 180 days so
// graduated cards never disappear from the schedule (no graduation concept).
const BOX_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60, 90, 180, 180] as const;
const MAX_BOX = BOX_INTERVALS_DAYS.length;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const nextBoxOnCorrect = (currentBox: number): number => Math.min(currentBox + 1, MAX_BOX);

const computeDueAtForBox = (box: number, from: Date): Date => {
  const days = BOX_INTERVALS_DAYS[box - 1];
  return new Date(from.getTime() + days * MS_PER_DAY);
};

export const computeInitialStateOnFirstWrong = (now: Date) => ({
  box: 1,
  dueAt: computeDueAtForBox(1, now),
});

export const computeNextStateOnReview = (currentBox: number, isCorrect: boolean, now: Date) => {
  const box = isCorrect ? nextBoxOnCorrect(currentBox) : 1;
  return { box, dueAt: computeDueAtForBox(box, now) };
};
