'use server';

import { zodResponseFormat } from 'openai/helpers/zod';

import { requireAuth } from '@/features/auth/services';
import { SENSE_CHECK_PROMPT } from '@/features/quiz/prompts';
import { SenseCheckInputSchema, SenseCheckResponseSchema } from '@/features/quiz/validations';
import { openai } from '@/lib/openai';

export const checkSenseAndAngle = async (input: string) => {
  const validated = SenseCheckInputSchema.parse(input);

  await requireAuth();

  const completion = await openai.chat.completions.parse({
    model: 'gpt-5.4-nano',
    messages: [
      { role: 'system', content: SENSE_CHECK_PROMPT },
      { role: 'user', content: `<<<USER_INPUT>>>\n${validated}\n<<<END_USER_INPUT>>>` },
    ],
    response_format: zodResponseFormat(SenseCheckResponseSchema, 'sense_check'),
    temperature: 0,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) throw new Error('Failed to parse OpenAI response');
  return parsed;
};
