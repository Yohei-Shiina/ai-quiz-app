'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Loader2 } from 'lucide-react';

import { AnswerChoice } from '@/app/quiz/[sessionId]/answer-choice';
import { Button } from '@/components/ui/button';
import { submitReviewSessionAnswerAction } from '@/features/review-session/actions';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

type ReviewQuestion = {
  id: string;
  body: string;
  explanation: string;
  topicTitle: string;
  answerOptions: { id: string; body: string; isCorrect: boolean }[];
};

type Props = {
  reviewSessionId: string;
  questions: ReviewQuestion[];
  initialIdx: number;
};

type AnswerPhase =
  | { kind: 'idle' }
  | { kind: 'attempting'; choiceIdx: number; isCorrect: boolean; previousError?: string }
  | { kind: 'succeeded'; choiceIdx: number; isCorrect: boolean }
  | { kind: 'failed'; choiceIdx: number; isCorrect: boolean; error: string };

const AUTO_ADVANCE_MS = 1000;

export const ReviewAnsweringView = ({ reviewSessionId, questions, initialIdx }: Props) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(initialIdx);
  const [answerPhase, setAnswerPhase] = useState<AnswerPhase>({ kind: 'idle' });
  const [autoAdvanceReady, setAutoAdvanceReady] = useState(false);

  const { t } = useI18n();
  const router = useRouter();

  const totalCount = questions.length;
  const currentQuestion = questions[currentQuestionIdx];
  const correctOptionIdx = currentQuestion?.answerOptions.findIndex((o) => o.isCorrect) ?? -1;
  const selectedOptionIdx = answerPhase.kind === 'idle' ? null : answerPhase.choiceIdx;
  const isLastQuestion = currentQuestionIdx === totalCount - 1;
  const isAttemptingSave = answerPhase.kind === 'attempting';
  const showWrongBlock = answerPhase.kind !== 'idle' && !answerPhase.isCorrect;
  const submissionError =
    answerPhase.kind === 'failed'
      ? answerPhase.error
      : answerPhase.kind === 'attempting'
        ? answerPhase.previousError
        : undefined;
  const showCorrectBadge =
    (answerPhase.kind === 'attempting' || answerPhase.kind === 'succeeded') &&
    answerPhase.isCorrect &&
    !submissionError;
  const showWrongNextButton = showWrongBlock && !submissionError;
  const shouldStartAutoAdvanceTimer = answerPhase.kind === 'succeeded' && answerPhase.isCorrect;
  const canAdvance = answerPhase.kind === 'succeeded';
  const progressPercent =
    ((currentQuestionIdx + (answerPhase.kind !== 'idle' ? 1 : 0)) / totalCount) * 100;

  const goToNextQuestion = useCallback(() => {
    setCurrentQuestionIdx((i) => i + 1);
    setAnswerPhase({ kind: 'idle' });
    setAutoAdvanceReady(false);
  }, []);

  const goToResult = useCallback(() => {
    router.push(`/review/${reviewSessionId}/result`);
  }, [router, reviewSessionId]);

  const submitAnswer = (choiceIdx: number, isCorrect: boolean, previousError?: string) => {
    setAnswerPhase({ kind: 'attempting', choiceIdx, isCorrect, previousError });
    setAutoAdvanceReady(false);
    startTransition(async () => {
      const result = await submitReviewSessionAnswerAction({
        reviewSessionId,
        questionId: currentQuestion.id,
        answerOptionId: currentQuestion.answerOptions[choiceIdx].id,
        isCorrect,
      });
      setAnswerPhase(
        result.success
          ? { kind: 'succeeded', choiceIdx, isCorrect }
          : { kind: 'failed', choiceIdx, isCorrect, error: result.error },
      );
    });
  };

  const handlePick = (choiceIdx: number) => {
    if (answerPhase.kind !== 'idle') return;
    submitAnswer(choiceIdx, choiceIdx === correctOptionIdx);
  };

  const retrySubmit = () => {
    if (answerPhase.kind !== 'failed') return;
    submitAnswer(answerPhase.choiceIdx, answerPhase.isCorrect, answerPhase.error);
  };

  useEffect(() => {
    if (!shouldStartAutoAdvanceTimer) return;
    const timer = setTimeout(() => setAutoAdvanceReady(true), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [shouldStartAutoAdvanceTimer]);

  useEffect(() => {
    if (!autoAdvanceReady || !canAdvance) return;
    if (isLastQuestion) goToResult();
    // goToNextQuestion writes state in its handler; the lint rule that flags
    // cascading state writes in effects is overly strict for this coordination
    // pattern (acknowledged false positive in facebook/react#34743).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else goToNextQuestion();
  }, [autoAdvanceReady, canAdvance, isLastQuestion, goToResult, goToNextQuestion]);

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-dvh bg-background lg:flex lg:items-center lg:justify-center">
      <div className="mx-auto w-full max-w-md sm:max-w-lg px-4 pt-14 pb-8 lg:py-12">
        <div className="flex items-center justify-between min-h-8">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="bg-transparent border-0 font-sans text-[13px] text-muted-foreground hover:text-foreground transition-colors px-1 py-1.5 cursor-pointer"
          >
            {t.review.leave}
          </button>
          <div className="font-sans text-xs font-medium text-muted-foreground tracking-wider tabular-nums">
            {currentQuestionIdx + 1} / {totalCount}
          </div>
        </div>

        <div className="h-0.5 bg-muted rounded-full overflow-hidden mt-2.5 mb-5">
          <div
            className="h-full bg-primary transition-[width] duration-400 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <main
          key={currentQuestionIdx}
          className="flex flex-col gap-[18px]"
          style={{ animation: 'fade-up 0.4s ease-out both' }}
        >
          <p className="font-sans text-xs text-muted-foreground leading-snug m-0">
            <span className="font-display italic text-[13px] text-muted-foreground">
              &ldquo;{currentQuestion.topicTitle}&rdquo;
            </span>
          </p>

          <h1 className="font-sans text-[19px] leading-normal font-normal m-0 text-foreground">
            {currentQuestion.body}
          </h1>

          <div className="flex flex-col gap-2.5">
            {currentQuestion.answerOptions.map((option, i) => (
              <div
                key={option.id}
                style={{ animation: `fade-up 0.35s ease-out ${0.06 + i * 0.05}s both` }}
              >
                <AnswerChoice
                  label={option.body}
                  index={i}
                  selectedOptionIdx={selectedOptionIdx}
                  correctOptionIdx={correctOptionIdx}
                  onClick={() => handlePick(i)}
                />
              </div>
            ))}
          </div>

          {showCorrectBadge && (
            <div
              className="flex items-center gap-2 font-sans text-sm text-primary font-medium"
              style={{ animation: 'fade-in 0.3s ease-out both' }}
            >
              <span className="w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-[11px] font-bold">
                ✓
              </span>
              {t.answering.right}
            </div>
          )}

          {showWrongBlock && (
            <div
              className="flex flex-col gap-4"
              style={{ animation: 'fade-up 0.35s ease-out both' }}
            >
              <div className="bg-card border border-border rounded-xl px-4 py-[14px] flex flex-col gap-2">
                <p className="font-sans text-xs text-muted-foreground m-0 tracking-wide lowercase">
                  {t.answering.theAnswerWas}
                </p>
                <p className="font-display italic text-base text-foreground m-0 leading-snug">
                  {currentQuestion.answerOptions[correctOptionIdx]?.body}
                </p>
                <p className="font-sans text-[13px] text-muted-foreground mt-1 leading-relaxed m-0">
                  {currentQuestion.explanation}
                </p>
              </div>
              {showWrongNextButton && (
                <Button
                  type="button"
                  onClick={isLastQuestion ? goToResult : goToNextQuestion}
                  disabled={!canAdvance}
                  className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm"
                >
                  {isLastQuestion ? t.review.finish : t.review.next}
                </Button>
              )}
            </div>
          )}

          {submissionError && (
            <ErrorRetryCard
              message={submissionError}
              onRetry={retrySubmit}
              retryLabel={t.answering.submitRetry}
              isPending={isAttemptingSave}
              pendingLabel={t.answering.preparingNext}
            />
          )}
        </main>
      </div>
    </div>
  );
};

const PreparingIndicator = ({ label, className }: { label: string; className?: string }) => (
  <span className={cn('inline-flex items-center gap-2', className)}>
    <Loader2 className="animate-spin" size={14} />
    {label}
  </span>
);

type ErrorRetryCardProps = {
  message: string;
  onRetry: () => void;
  retryLabel: string;
  isPending?: boolean;
  pendingLabel?: string;
};

const ErrorRetryCard = ({
  message,
  onRetry,
  retryLabel,
  isPending,
  pendingLabel,
}: ErrorRetryCardProps) => (
  <div
    role="alert"
    className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-[14px] flex flex-col gap-3"
    style={{ animation: 'fade-up 0.35s ease-out both' }}
  >
    <p className="font-sans text-sm text-destructive m-0">{message}</p>
    <Button
      type="button"
      variant="destructive"
      onClick={onRetry}
      disabled={isPending}
      className="h-10 rounded-lg text-[14px] font-medium"
    >
      {isPending && pendingLabel ? <PreparingIndicator label={pendingLabel} /> : retryLabel}
    </Button>
  </div>
);
