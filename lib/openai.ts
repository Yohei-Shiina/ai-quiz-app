import { openai } from '@ai-sdk/openai';

const DEFAULT_QUIZ_MODEL = 'gpt-5.4-nano';

export const quizModel = () => {
  const modelId = process.env.OPENAI_MODEL ?? DEFAULT_QUIZ_MODEL;
  return openai(modelId);
};
