import { openai } from '@ai-sdk/openai';

const DEFAULT_QUIZ_MODEL = 'gpt-5.4-mini';

export const quizModelId = () => process.env.OPENAI_MODEL ?? DEFAULT_QUIZ_MODEL;

export const quizModel = () => openai(quizModelId());
