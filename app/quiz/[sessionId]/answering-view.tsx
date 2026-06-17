'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Loader2 } from 'lucide-react';

import type { QuizSession } from '@/app/generated/prisma/client';
import { AnswerChoice } from '@/app/quiz/[sessionId]/answer-choice';
import { LoadingView } from '@/app/quiz/[sessionId]/loading-view';
import {
  useQuestionStream,
  type QuestionWithOptions,
} from '@/app/quiz/[sessionId]/use-question-stream';
import { Button } from '@/components/ui/button';
import { retryQuizGenerationAction, submitSessionAnswerAction } from '@/features/quiz/actions';
import { ROUTES } from '@/lib/constants';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

type Props = {
  sessionId: QuizSession['id'];
  topic: string;
  questionCount: number;
  initialQuestions: QuestionWithOptions[];
  initialIdx: number;
};

type AnswerPhase =
  | { kind: 'idle' }
  | { kind: 'attempting'; choiceIdx: number; isCorrect: boolean; previousError?: string }
  | { kind: 'succeeded'; choiceIdx: number; isCorrect: boolean }
  | { kind: 'failed'; choiceIdx: number; isCorrect: boolean; error: string };

const AUTO_ADVANCE_MS = 1000;

export const AnsweringView = ({
  sessionId,
  topic,
  questionCount,
  initialQuestions,
  initialIdx,
}: Props) => {
  // === state ===
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(initialIdx);
  const [answerPhase, setAnswerPhase] = useState<AnswerPhase>({ kind: 'idle' });
  const [autoAdvanceReady, setAutoAdvanceReady] = useState(false);

  // === external hooks ===
  const { t } = useI18n();
  const router = useRouter();
  const { streamError, retryStream } = useQuestionStream({
    sessionId,
    initialCount: initialQuestions.length,
    totalCount: questionCount,
    onQuestionReceived: (q) =>
      setQuestions((prev) => {
        if (prev.length >= questionCount) return prev;
        const ids = new Set(prev.map((p) => p.id));
        return ids.has(q.id) ? prev : [...prev, q];
      }),
  });

  const handleStreamRetry = async () => {
    await retryQuizGenerationAction(sessionId);
    retryStream();
  };

  // === derived ===
  const currentQuestion = questions[currentQuestionIdx];
  const correctOptionIdx = currentQuestion?.answerOptions.findIndex((o) => o.isCorrect) ?? -1;
  const selectedOptionIdx = answerPhase.kind === 'idle' ? null : answerPhase.choiceIdx;
  const isLastQuestion = currentQuestionIdx === questionCount - 1;
  const isNextQuestionLoaded = currentQuestionIdx + 1 < questions.length;
  const isAttemptingSave = answerPhase.kind === 'attempting';
  const canGoToNextQuestion =
    !isLastQuestion && isNextQuestionLoaded && answerPhase.kind === 'succeeded';
  const canGoToResult = isLastQuestion && answerPhase.kind === 'succeeded';
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
  const progressPercent =
    ((currentQuestionIdx + (answerPhase.kind !== 'idle' ? 1 : 0)) / questionCount) * 100;

  // === callbacks ===
  const goToNextQuestion = useCallback(() => {
    setCurrentQuestionIdx((i) => i + 1);
    setAnswerPhase({ kind: 'idle' });
    setAutoAdvanceReady(false);
  }, []);

  const goToResult = useCallback(() => {
    router.push(`/quiz/${sessionId}/result`);
  }, [router, sessionId]);

  const submitAnswer = (choiceIdx: number, isCorrect: boolean, previousError?: string) => {
    setAnswerPhase({ kind: 'attempting', choiceIdx, isCorrect, previousError });
    setAutoAdvanceReady(false);
    startTransition(async () => {
      const result = await submitSessionAnswerAction({
        quizSessionId: sessionId,
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

  // === effects ===
  // Auto-advance runs in two phases so the timer doesn't restart when the next
  // question streams in mid-wait:
  //   1. Arm a timer when the answer is settled (succeeded + correct).
  //      Depends only on `shouldStartAutoAdvanceTimer`, not on destination
  //      readiness, so a late stream chunk can't extend the wait.
  //   2. When the timer has signalled readiness AND a destination is reachable,
  //      navigate. If the destination isn't ready yet, we just wait — this
  //      effect re-runs when `canGoTo*` flips.
  useEffect(() => {
    if (!shouldStartAutoAdvanceTimer) return;
    const timer = setTimeout(() => setAutoAdvanceReady(true), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [shouldStartAutoAdvanceTimer]);

  useEffect(() => {
    if (!autoAdvanceReady) return;
    if (canGoToResult) goToResult();
    // goToNextQuestion writes state in its handler; the lint rule that flags
    // cascading state writes in effects is overly strict for this coordination
    // pattern (acknowledged false positive in facebook/react#34743).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else if (canGoToNextQuestion) goToNextQuestion();
  }, [autoAdvanceReady, canGoToResult, canGoToNextQuestion, goToResult, goToNextQuestion]);

  // === early return ===
  if (!currentQuestion) {
    if (streamError) {
      return (
        <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md flex flex-col gap-3">
            <ErrorRetryCard
              message={streamError}
              onRetry={handleStreamRetry}
              retryLabel={t.answering.submitRetry}
            />
            <Link
              href={ROUTES.home}
              className="text-center font-sans text-sm text-muted-foreground hover:text-foreground transition-colors py-2.5"
            >
              {t.error.backHome}
            </Link>
          </div>
        </div>
      );
    }
    return <LoadingView topic={topic} />;
  }

  // === render ===
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-md px-4 pt-14 pb-8">
        <div className="flex items-center justify-between min-h-8">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="bg-transparent border-0 font-sans text-[13px] text-muted-foreground hover:text-foreground transition-colors px-1 py-1.5 cursor-pointer"
          >
            {t.answering.leave}
          </button>
          <div className="font-sans text-xs font-medium text-muted-foreground tracking-wider tabular-nums">
            {currentQuestionIdx + 1} / {questionCount}
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
              &ldquo;{topic}&rdquo;
            </span>
          </p>

          <h1 className="font-sans text-[19px] leading-normal font-normal m-0 text-foreground">
            {currentQuestion.body}
          </h1>

          {currentQuestionIdx === 0 && answerPhase.kind === 'idle' && (
            <button
              type="button"
              onClick={() => router.push('/')}
              className="self-start bg-transparent border-0 px-0 -my-1 font-sans text-[13px] text-muted-foreground cursor-pointer inline-flex items-baseline gap-1.5 leading-snug text-left"
            >
              {t.answering.notTheTopic}
              <span className="text-primary font-medium underline underline-offset-[3px] decoration-1">
                {t.answering.tryDifferent}
              </span>
            </button>
          )}

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
              {showWrongNextButton &&
                (isLastQuestion ? (
                  <Button
                    type="button"
                    onClick={goToResult}
                    disabled={!canGoToResult}
                    className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm"
                  >
                    {canGoToResult ? (
                      t.answering.finish
                    ) : (
                      <PreparingIndicator label={t.answering.preparingNext} />
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goToNextQuestion}
                    disabled={!canGoToNextQuestion}
                    className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm"
                  >
                    {canGoToNextQuestion ? (
                      t.answering.next
                    ) : (
                      <PreparingIndicator label={t.answering.preparingNext} />
                    )}
                  </Button>
                ))}
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

          {!isLastQuestion && !isNextQuestionLoaded && showCorrectBadge && (
            <PreparingIndicator
              label={t.answering.preparingNextQuestion}
              className="text-muted-foreground text-[13px]"
            />
          )}

          {streamError &&
            answerPhase.kind === 'idle' &&
            !isNextQuestionLoaded &&
            questions.length < questionCount && (
              <ErrorRetryCard
                message={streamError}
                onRetry={handleStreamRetry}
                retryLabel={t.answering.submitRetry}
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
