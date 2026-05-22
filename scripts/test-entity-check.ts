import { zodResponseFormat } from 'openai/helpers/zod';

import { ENTITY_CHECK_PROMPT } from '@/features/quiz/prompts';
import { EntityCheckResponseSchema } from '@/features/quiz/validations';
import { openai } from '@/lib/openai';

const TEST_INPUTS = [
  'くも',
  'apple',
  '日本とアメリカの違い',
  'PCの仕組み',
  '水はなんで透明なのか',
  'Why is the sun so bright?',
  'useStateの使い方',
  'What is はし?',
  'react について',
];

const run = async () => {
  for (const input of TEST_INPUTS) {
    const completion = await openai.chat.completions.parse({
      model: 'gpt-5.4-nano',
      messages: [
        { role: 'system', content: ENTITY_CHECK_PROMPT },
        { role: 'user', content: `<<<USER_INPUT>>>\n${input}\n<<<END_USER_INPUT>>>` },
      ],
      response_format: zodResponseFormat(EntityCheckResponseSchema, 'entity_check'),
      temperature: 0,
    });

    const parsed = completion.choices[0].message.parsed;
    console.log(`\nInput: ${input}`);
    console.log(JSON.stringify(parsed, null, 2));
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
