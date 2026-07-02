import { afterEach, describe, expect, test, vi } from 'vitest';

import { shuffleArray } from '@/lib/shuffle';

describe('shuffleArray', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];

    shuffleArray(input);

    expect(input).toEqual(snapshot);
  });

  test('returns a new array reference', () => {
    const input = [1, 2, 3];

    expect(shuffleArray(input)).not.toBe(input);
  });

  test('preserves length and multiset of elements', () => {
    const input = ['a', 'b', 'c', 'd', 'e', 'a'];

    const result = shuffleArray(input);

    expect(result).toHaveLength(input.length);
    expect([...result].sort()).toEqual([...input].sort());
  });

  test('returns an empty array for empty input', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  test('returns the single element for a one-element array', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });

  test('is deterministic given a fixed random sequence', () => {
    // Fisher-Yates walks i from n-1 down to 1, picking j in [0, i].
    // With Math.random forced to 0, every j = 0, so each step swaps
    // result[i] with result[0]. For [A,B,C,D] the swaps produce [B,C,D,A].
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(shuffleArray(['A', 'B', 'C', 'D'])).toEqual(['B', 'C', 'D', 'A']);
  });

  test('every element can reach every position across many shuffles', () => {
    const input = [0, 1, 2, 3];
    const seen = input.map(() => new Set<number>());

    for (let run = 0; run < 500; run++) {
      const result = shuffleArray(input);
      result.forEach((value, index) => seen[value].add(index));
    }

    // A correct, unbiased shuffle lands each value in each index at least once.
    for (const positions of seen) {
      expect(positions.size).toBe(input.length);
    }
  });
});
