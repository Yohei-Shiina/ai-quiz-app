import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { resumeOrRestartQuizAction } from '@/features/quiz/actions';
import type { getSessionResultOrThrow } from '@/features/quiz/data';

type SessionResult = Awaited<ReturnType<typeof getSessionResultOrThrow>>;

type Props = { result: SessionResult };

// FIXME: these invariant violations currently throw raw Errors; revisit when
// the app-wide error-handling strategy is in place.
const MSG_MISSING_ANSWER = 'a question in this completed session has no answer';
const MSG_PICKED_OPTION_NOT_FOUND = 'picked answer option does not belong to the question';
const MSG_CORRECT_OPTION_NOT_FOUND = 'no correct answer option marked on the question';

export const ResultView = ({ result }: Props) => {
  const { topic, sessionQuestions, sessionAnswer: answers } = result;

  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));
  const items = sessionQuestions.map((sq) => {
    const answer = answerByQuestionId.get(sq.questionId);
    if (!answer) throw new Error(MSG_MISSING_ANSWER);
    return {
      position: sq.position,
      question: sq.question,
      pickedOptionId: answer.answerOptionId,
      isCorrect: answer.isCorrect,
    };
  });

  const total = sessionQuestions.length;
  const score = items.filter((i) => i.isCorrect).length;
  const misses = items.filter((i) => !i.isCorrect);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md px-4 pt-16 pb-7">
        <header
          className="flex flex-col gap-1.5 mb-[22px]"
          style={{ animation: 'fade-up 0.4s ease-out both' }}
        >
          <p className="font-sans text-[13px] text-muted-foreground m-0">
            on <span className="font-display italic">&ldquo;{topic.title}&rdquo;</span>
          </p>
          <h1 className="font-display italic text-[30px] leading-tight tracking-[-0.01em] font-normal m-0">
            You got{' '}
            <span className="text-primary">
              {score} of {total}
            </span>
            .
          </h1>
        </header>

        {misses.length === 0 ? (
          <PerfectMessage />
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-sans text-sm font-medium text-foreground m-0">
                What you missed
              </h2>
              <span className="font-sans text-xs text-muted-foreground">
                {misses.length} {misses.length === 1 ? 'question' : 'questions'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {misses.map((item, i) => (
                <MissCard
                  key={item.question.id}
                  number={item.position + 1}
                  question={item.question}
                  pickedOptionId={item.pickedOptionId}
                  index={i}
                />
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 mt-[22px]">
          <form action={resumeOrRestartQuizAction}>
            <input type="hidden" name="topicId" value={topic.id} />
            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm"
            >
              Try another round
            </Button>
          </form>
          <Link
            href="/"
            className="text-center font-sans text-sm text-muted-foreground hover:text-foreground transition-colors py-2.5"
          >
            Back to your collection
          </Link>
        </div>
      </div>
    </div>
  );
};

const PerfectMessage = () => (
  <div
    className="bg-card border border-border rounded-xl px-4 py-6 flex flex-col items-center gap-2"
    style={{ animation: 'fade-up 0.4s ease-out 0.1s both' }}
  >
    <p className="font-display italic text-2xl text-foreground m-0">Perfect.</p>
    <p className="font-sans text-sm text-muted-foreground m-0 text-center">
      Nothing to review on this round.
    </p>
  </div>
);

type QuestionWithOptions = SessionResult['sessionQuestions'][number]['question'];

type MissCardProps = {
  number: number;
  question: QuestionWithOptions;
  pickedOptionId: string;
  index: number;
};

const MissCard = ({ number, question, pickedOptionId, index }: MissCardProps) => {
  const correctOption = question.answerOptions.find((o) => o.isCorrect);
  const pickedOption = question.answerOptions.find((o) => o.id === pickedOptionId);
  if (!correctOption) throw new Error(MSG_CORRECT_OPTION_NOT_FOUND);
  if (!pickedOption) throw new Error(MSG_PICKED_OPTION_NOT_FOUND);

  return (
    <div
      className="bg-card border border-border rounded-xl px-4 py-4 flex flex-col gap-3 shadow-sm"
      style={{ animation: `fade-up 0.4s ease-out ${0.04 + index * 0.06}s both` }}
    >
      <span className="font-sans text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        Question {number}
      </span>
      <p className="font-sans text-[15px] leading-normal text-foreground m-0">{question.body}</p>

      <div className="flex flex-col gap-2">
        <AnswerRow kind="wrong" label="Your answer" text={pickedOption.body} />
        <AnswerRow kind="right" label="Correct" text={correctOption.body} />
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
