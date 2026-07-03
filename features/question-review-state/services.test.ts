import { describe, expect, test } from 'vitest';

import {
  computeInitialStateOnFirstWrong,
  computeNextStateOnReview,
} from '@/features/question-review-state/services';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-01-01T00:00:00.000Z');
const daysAfterNow = (days: number) => new Date(NOW.getTime() + days * MS_PER_DAY);

describe('computeInitialStateOnFirstWrong', () => {
  test('starts a wrong-answered question in box 1 due one day later', () => {
    expect(computeInitialStateOnFirstWrong(NOW)).toEqual({
      box: 1,
      dueAt: daysAfterNow(1),
    });
  });
});

describe('computeNextStateOnReview', () => {
  test('promotes to the next box on a correct answer', () => {
    const result = computeNextStateOnReview(1, true, NOW);

    // box 2 interval is 3 days
    expect(result).toEqual({ box: 2, dueAt: daysAfterNow(3) });
  });

  test('resets to box 1 on a wrong answer regardless of current box', () => {
    const result = computeNextStateOnReview(5, false, NOW);

    expect(result).toEqual({ box: 1, dueAt: daysAfterNow(1) });
  });

  test('caps the box at the maximum (9) on repeated correct answers', () => {
    // Already at the top box: staying capped, not overflowing to box 10.
    const result = computeNextStateOnReview(9, true, NOW);

    // box 9 interval is 180 days
    expect(result).toEqual({ box: 9, dueAt: daysAfterNow(180) });
  });

  test('applies the full box interval schedule on correct promotion', () => {
    // currentBox -> expected promoted box -> interval days for that box
    const cases: ReadonlyArray<[number, number, number]> = [
      [1, 2, 3],
      [2, 3, 7],
      [3, 4, 14],
      [4, 5, 30],
      [5, 6, 60],
      [6, 7, 90],
      [7, 8, 180],
      [8, 9, 180],
    ];

    for (const [currentBox, expectedBox, intervalDays] of cases) {
      expect(computeNextStateOnReview(currentBox, true, NOW)).toEqual({
        box: expectedBox,
        dueAt: daysAfterNow(intervalDays),
      });
    }
  });
});
