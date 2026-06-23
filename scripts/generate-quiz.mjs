// Prompt regression harness for quiz generation (issue 106).
//
// Runs a fixed set of "golden" topics through the SAME prompt + schema + model the app
// uses (features/quiz/prompts.ts, schemas.ts, lib/openai.ts) via generateObject, so the
// output quality can be re-checked whenever the prompt is changed. Topics run in parallel.
//
// - Calls the OpenAI API directly (costs tokens). Loads .env.local for OPENAI_API_KEY.
// - Bypasses the app's per-user rate limit (that lives in actions.ts) and does NOT touch
//   the database, so it is safe to run repeatedly without polluting app data.
// - Node 24 strips TS types on import, so the .ts modules are imported directly.
//
//   pnpm gen:quiz                       # run the golden topic set
//   pnpm gen:quiz "react" "犬の種類"    # run custom topics instead
//
// Output: AI-readable Markdown written to <os tmp dir>/ai-quiz-gen-dump.md (path printed
// to stderr on completion).

import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { generateObject } from 'ai';

import { buildQuizGenerationPrompt } from '../features/quiz/prompts.ts';
import { generatedQuizSchema } from '../features/quiz/schemas.ts';
import { quizModel } from '../lib/openai.ts';

// Golden topic set — each topic probes a distinct quality dimension found in analysis.
const DEFAULT_TOPICS = [
  // --- Quality regression: the specific defects fixed in the prompt rewrite ---
  '日本で最も人口が多い県TOP5', // factual accuracy + no self-contradiction across questions
  'クワガタの種類', // no reworded-duplicate questions; plausible distractors
  'caveman とは', // distractors same-category, not absurd; tests understanding not definition
  'Anthropic とは', // single language only, no foreign-script leakage
  'はげ', // substantive questions, not thin definition restatement
  // --- Regression guard: topics that were already good, must not degrade ---
  '電子',
  'ベーシックインカムとは',
  'react', // English-language path
  'お金持ちになる方法',
  '2030年日本で最も流行った曲', // unknowable future — should hedge, not fabricate
  // --- Specificity adherence: narrow topics must go deep, not drift to generics ---
  'Reactのkeyがなぜ必要か', // mechanism / why
  'useEffectの依存配列の使い方', // specific-feature usage
  'useStateとuseRefの違い', // difference / comparison
  'なぜHTTPSは安全なのか', // mechanism / why
  'gitでコンフリクトを解決する方法', // procedure / how-to (concrete terms expected)
  'CSS flexboxで横中央寄せする方法', // narrow concrete how-to (concrete property names)
];

const topics = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_TOPICS;

const generateForTopic = async (topic) => {
  try {
    const { object } = await generateObject({
      model: quizModel(),
      schema: generatedQuizSchema,
      prompt: buildQuizGenerationPrompt(topic),
    });
    return { topic, quiz: object };
  } catch (error) {
    return { topic, error: error instanceof Error ? error.message : String(error) };
  }
};

const main = async () => {
  const results = await Promise.all(topics.map(generateForTopic));

  const lines = [`# Quiz generation (${results.length} topics, model: ${quizModel().modelId ?? 'unknown'})`, ''];
  for (const r of results) {
    lines.push(`## Topic: ${r.topic}`);
    if (r.error) {
      lines.push(`_ERROR: ${r.error}_`, '');
      continue;
    }
    lines.push(`detectedLanguage: ${r.quiz.detectedLanguage}`, '');
    r.quiz.questions.forEach((q, i) => {
      lines.push(`### Q${i + 1}. ${q.body}`);
      for (const opt of q.options) {
        lines.push(`- [${opt.isCorrect ? '✓' : ' '}] ${opt.body}`);
      }
      lines.push(`解説: ${q.explanation}`, '');
    });
  }

  const outPath = join(tmpdir(), 'ai-quiz-gen-dump.md');
  writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.error(`Wrote ${results.length} topics to ${outPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
