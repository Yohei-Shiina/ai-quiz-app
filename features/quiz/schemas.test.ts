import { describe, expect, test } from 'vitest';

import {
  QUIZ_OPTION_COUNT,
  QUIZ_QUESTION_COUNT,
  generatedQuizSchema,
} from '@/features/quiz/schemas';

const makeOption = (body: string, isCorrect: boolean) => ({ body, isCorrect });

const makeQuestion = (seed: number) => ({
  body: `Question ${seed}`,
  explanation: `Because ${seed}`,
  options: [
    makeOption('a', true),
    makeOption('b', false),
    makeOption('c', false),
    makeOption('d', false),
  ],
});

const makeQuiz = (questionCount = QUIZ_QUESTION_COUNT) => ({
  detectedLanguage: 'English',
  questions: Array.from({ length: questionCount }, (_, i) => makeQuestion(i)),
});

describe('generatedQuizSchema', () => {
  test('accepts a well-formed quiz', () => {
    expect(generatedQuizSchema.safeParse(makeQuiz()).success).toBe(true);
  });

  test('rejects fewer than the required number of questions', () => {
    expect(generatedQuizSchema.safeParse(makeQuiz(QUIZ_QUESTION_COUNT - 1)).success).toBe(false);
  });

  test('rejects more than the required number of questions', () => {
    expect(generatedQuizSchema.safeParse(makeQuiz(QUIZ_QUESTION_COUNT + 1)).success).toBe(false);
  });

  test('rejects a question with the wrong number of options', () => {
    const quiz = makeQuiz();
    quiz.questions[0].options = quiz.questions[0].options.slice(0, QUIZ_OPTION_COUNT - 1);

    expect(generatedQuizSchema.safeParse(quiz).success).toBe(false);
  });

  test('rejects an empty question body', () => {
    const quiz = makeQuiz();
    quiz.questions[0].body = '';

    expect(generatedQuizSchema.safeParse(quiz).success).toBe(false);
  });

  test('rejects an empty option body', () => {
    const quiz = makeQuiz();
    quiz.questions[0].options[0].body = '';

    expect(generatedQuizSchema.safeParse(quiz).success).toBe(false);
  });

  test('rejects a missing detectedLanguage', () => {
    const quiz = makeQuiz() as Record<string, unknown>;
    delete quiz.detectedLanguage;

    expect(generatedQuizSchema.safeParse(quiz).success).toBe(false);
  });

  // Documents a known gap: the schema enforces option COUNT but not
  // "exactly one isCorrect". A question with zero (or several) correct
  // options still passes. Tighten with a .refine() if this becomes a real
  // data-quality problem.
  test('does NOT currently enforce exactly one correct option', () => {
    const quiz = makeQuiz();
    quiz.questions[0].options = [
      makeOption('a', false),
      makeOption('b', false),
      makeOption('c', false),
      makeOption('d', false),
    ];

    expect(generatedQuizSchema.safeParse(quiz).success).toBe(true);
  });
});
