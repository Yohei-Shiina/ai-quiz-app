import { z } from 'zod';

export const QUIZ_QUESTION_COUNT = 5;
export const QUIZ_OPTION_COUNT = 4;

export const generatedAnswerOptionSchema = z.object({
  body: z.string().min(1).describe('The answer choice text'),
  isCorrect: z.boolean().describe('Whether this option is the correct answer'),
});

export const generatedQuestionSchema = z.object({
  body: z.string().min(1).describe('The question text'),
  explanation: z
    .string()
    .min(1)
    .describe('A brief explanation of why the correct answer is correct'),
  options: z
    .array(generatedAnswerOptionSchema)
    .length(QUIZ_OPTION_COUNT)
    .describe(`Exactly ${QUIZ_OPTION_COUNT} options, with exactly one marked isCorrect: true`),
});

export const generatedQuizSchema = z.object({
  detectedLanguage: z
    .string()
    .describe('The language the user wrote the topic in, e.g. "English" or "Japanese"'),
  questions: z
    .array(generatedQuestionSchema)
    .length(QUIZ_QUESTION_COUNT)
    .describe(`Exactly ${QUIZ_QUESTION_COUNT} questions`),
});

export type GeneratedAnswerOption = z.infer<typeof generatedAnswerOptionSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>;
