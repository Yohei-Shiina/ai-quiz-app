import Link from 'next/link';

import { SiteHeader } from '@/components/shared/site-header';
import { Button } from '@/components/ui/button';
import { startOrResumeReviewSessionAction } from '@/features/review-session/actions';
import type { getReviewSessionResult } from '@/features/review-session/data';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { getDict } from '@/lib/i18n/server';

type ReviewResult = NonNullable<Awaited<ReturnType<typeof getReviewSessionResult>>>;

type Props = { result: ReviewResult };

const MSG_MISSING_ANSWER = 'a question in this completed review has no answer';
const MSG_PICKED_OPTION_NOT_FOUND = 'picked answer option does not belong to the question';
const MSG_CORRECT_OPTION_NOT_FOUND = 'no correct answer option marked on the question';

export const ReviewResultView = async ({ result }: Props) => {
  const t = await getDict();
  const { reviewSessionQuestions, reviewSessionAnswers: answers } = result;

  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));
  const items = reviewSessionQuestions.map((sq) => {
    const answer = answerByQuestionId.get(sq.questionId);
    if (!answer) throw new Error(MSG_MISSING_ANSWER);
    return {
      position: sq.position,
      question: sq.question,
      topicTitle: sq.question.topic.title,
      pickedOptionId: answer.answerOptionId,
      isCorrect: answer.isCorrect,
    };
  });

  const total = reviewSessionQuestions.length;
  const score = items.filter((i) => i.isCorrect).length;
  const misses = items.filter((i) => !i.isCorrect);

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 pt-8 pb-7">
        <header
          className="flex flex-col gap-1.5 mb-[22px]"
          style={{ animation: 'fade-up 0.4s ease-out both' }}
        >
          <p className="font-sans text-[13px] text-muted-foreground m-0">
            <span className="font-display italic">{t.reviewResult.headerLabel}</span>
          </p>
          <h1 className="font-display italic text-[30px] leading-tight tracking-[-0.01em] font-normal m-0">
            {t.reviewResult.youGotPre}
            <span className="text-primary">{t.reviewResult.score(score, total)}</span>
            {t.reviewResult.youGotPost}
          </h1>
        </header>

        {misses.length === 0 ? (
          <PerfectMessage t={t} />
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-sans text-sm font-medium text-foreground m-0">
                {t.result.whatYouMissed}
              </h2>
              <span className="font-sans text-xs text-muted-foreground">
                {t.result.missesCount(misses.length)}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {misses.map((item, i) => (
                <MissCard
                  key={item.question.id}
                  topicTitle={item.topicTitle}
                  question={item.question}
                  pickedOptionId={item.pickedOptionId}
                  index={i}
                  t={t}
                />
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 mt-[22px]">
          <form action={startOrResumeReviewSessionAction}>
            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm"
            >
              {t.reviewResult.tryAnother}
            </Button>
          </form>
          <Link
            href="/"
            className="text-center font-sans text-sm text-muted-foreground hover:text-foreground transition-colors py-2.5"
          >
            {t.reviewResult.backToCollection}
          </Link>
        </div>
      </div>
    </div>
  );
};

const PerfectMessage = ({ t }: { t: Dictionary }) => (
  <div
    className="bg-card border border-border rounded-xl px-4 py-6 flex flex-col items-center gap-2"
    style={{ animation: 'fade-up 0.4s ease-out 0.1s both' }}
  >
    <p className="font-display italic text-2xl text-foreground m-0">{t.reviewResult.perfect}</p>
    <p className="font-sans text-sm text-muted-foreground m-0 text-center">
      {t.reviewResult.nothingToReview}
    </p>
  </div>
);

type QuestionWithOptions = ReviewResult['reviewSessionQuestions'][number]['question'];

type MissCardProps = {
  topicTitle: string;
  question: QuestionWithOptions;
  pickedOptionId: string;
  index: number;
  t: Dictionary;
};

const MissCard = ({ topicTitle, question, pickedOptionId, index, t }: MissCardProps) => {
  const correctOption = question.answerOptions.find((o) => o.isCorrect);
  const pickedOption = question.answerOptions.find((o) => o.id === pickedOptionId);
  if (!correctOption) throw new Error(MSG_CORRECT_OPTION_NOT_FOUND);
  if (!pickedOption) throw new Error(MSG_PICKED_OPTION_NOT_FOUND);

  return (
    <div
      className="bg-card border border-border rounded-xl px-4 py-4 flex flex-col gap-3 shadow-sm"
      style={{ animation: `fade-up 0.4s ease-out ${0.04 + index * 0.06}s both` }}
    >
      <span className="font-display italic text-[12px] text-muted-foreground">
        &ldquo;{topicTitle}&rdquo;
      </span>
      <p className="font-sans text-[15px] leading-normal text-foreground m-0">{question.body}</p>

      <div className="flex flex-col gap-2">
        <AnswerRow kind="wrong" label={t.result.yourAnswer} text={pickedOption.body} />
        <AnswerRow kind="right" label={t.result.correct} text={correctOption.body} />
      </div>

      <div className="flex gap-2 pt-0.5">
        <div className="w-0.5 rounded-sm bg-primary/55 shrink-0" />
        <p className="font-sans text-[13px] leading-relaxed text-muted-foreground m-0">
          {question.explanation}
        </p>
      </div>
    </div>
  );
};

type AnswerRowProps = {
  kind: 'right' | 'wrong';
  label: string;
  text: string;
};

const AnswerRow = ({ kind, label, text }: AnswerRowProps) => {
  const isRight = kind === 'right';
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`w-[18px] h-[18px] rounded-full shrink-0 mt-px inline-flex items-center justify-center text-[11px] font-bold leading-none text-primary-foreground ${
          isRight ? 'bg-primary' : 'bg-destructive'
        }`}
      >
        {isRight ? '✓' : '✕'}
      </span>
      <span className="flex flex-col gap-px">
        <span className="font-sans text-[10.5px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
          {label}
        </span>
        <span
          className={`font-sans text-sm leading-snug ${
            isRight
              ? 'text-foreground font-medium'
              : 'text-muted-foreground line-through decoration-destructive/50'
          }`}
        >
          {text}
        </span>
      </span>
    </div>
  );
};
