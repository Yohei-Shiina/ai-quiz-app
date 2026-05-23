import { zodResponseFormat } from 'openai/helpers/zod';

import { ENTITY_CHECK_PROMPT } from '@/features/quiz/prompts';
import { EntityCheckResponseSchema } from '@/features/quiz/validations';
import { openai } from '@/lib/openai';

const TEST_INPUTS = [
  'け',
  // metalinguistic 除外: 歯/葉/刃 などが出るべき。助詞/音名/五十音は出ないこと
  'は',

  // 日本語の同音異義: 蜘蛛/雲 など実体だけが出るべき
  'くも',

  // 文中の日本語同音異義: 橋/箸/端
  'What is はし?',

  // 英語の多義: programming language / snake / Monty Python
  'python',

  // 英語の固有名詞衝突: planet / element / Roman god / Freddie
  'Mercury',

  // 英語の多義: fruit / company
  'apple',

  // 部分一致の排除: Java は通るが JavaScript は出ないこと
  'java',

  // 文脈で曖昧さが解消されたフレーズ: not ambiguous
  'python flask',

  // 一意の固有名詞: not ambiguous
  '東京',

  // 複数 entity の共存(各々が一意): not ambiguous
  '日本とアメリカの違い',

  // 句の中で意味が一意: not ambiguous
  'PCの仕組み',

  // 句の中で意味が一意: not ambiguous
  'useStateの使い方',
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
