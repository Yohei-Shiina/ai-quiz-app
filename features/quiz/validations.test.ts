import { describe, expect, test } from 'vitest';

import { validateResumeOrRestartQuiz, validateTitleTopic } from '@/features/quiz/validations';

const formDataWith = (entries: Record<string, string>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.set(key, value);
  return formData;
};

describe('validateTitleTopic', () => {
  test('returns trimmed data for a non-empty title', () => {
    const result = validateTitleTopic(formDataWith({ title: '  Roman history  ' }));

    expect(result).toEqual({ error: null, data: { title: 'Roman history' } });
  });

  test('returns TOPIC_REQUIRED for an empty title', () => {
    const result = validateTitleTopic(formDataWith({ title: '' }));

    expect(result).toEqual({ error: 'TOPIC_REQUIRED', data: null });
  });

  test('returns TOPIC_REQUIRED for a whitespace-only title', () => {
    const result = validateTitleTopic(formDataWith({ title: '   ' }));

    expect(result).toEqual({ error: 'TOPIC_REQUIRED', data: null });
  });

  test('returns TOPIC_REQUIRED when the title field is missing', () => {
    const result = validateTitleTopic(formDataWith({}));

    expect(result).toEqual({ error: 'TOPIC_REQUIRED', data: null });
  });
});

describe('validateResumeOrRestartQuiz', () => {
  test('returns the topicId for a valid form', () => {
    expect(validateResumeOrRestartQuiz(formDataWith({ topicId: 'topic-123' }))).toBe('topic-123');
  });

  test('throws when topicId is empty', () => {
    expect(() => validateResumeOrRestartQuiz(formDataWith({ topicId: '' }))).toThrow(
      'Invalid topicId',
    );
  });

  test('throws when topicId is missing', () => {
    expect(() => validateResumeOrRestartQuiz(formDataWith({}))).toThrow('Invalid topicId');
  });
});
