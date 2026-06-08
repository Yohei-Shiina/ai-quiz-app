'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

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
import { submitSessionAnswerAction } from '@/features/quiz/actions';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

type Props = {
  sessionId: QuizSession['id'];
  topic: string;
  questionCount: number;
  initialQuestions: QuestionWithOptions[];
  initialIdx: number;
};

type AnswerPhase = 'idle' | 'correct' | 'wrong';

const AUTO_ADVANCE_MS = 1000;

export const AnsweringView = ({
  sessionId,
  topic,
  questionCount,
  initialQuestions,
  initialIdx,
}: Props) => {
  const { t } = useI18n();
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(initialIdx);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [shouldNavigateToResult, setShouldNavigateToResult] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalQuestions = questionCount;
  const currentQuestion = questions[currentQuestionIdx];
  const correctOptionIdx = currentQuestion?.answerOptions.findIndex((o) => o.isCorrect) ?? -1;
  const answerPhase: AnswerPhase =
    selectedOptionIdx === null
      ? 'idle'
      : selectedOptionIdx === correctOptionIdx
        ? 'correct'
        : 'wrong';
  const isLastQuestion = currentQuestionIdx === totalQuestions - 1;
  const isNextQuestionLoaded = currentQuestionIdx + 1 < questions.length;

  const { streamError } = useQuestionStream({
    sessionId,
    initialCount: initialQuestions.length,
    totalCount: totalQuestions,
    onQuestionReceived: (q) =>
      setQuestions((prev) => (prev.length >= totalQuestions ? prev : [...prev, q])),
  });

  const goToNextQuestion = useCallback(() => {
    setCurrentQuestionIdx((i) => i + 1);
    setSelectedOptionIdx(null);
    setSubmitError(null);
  }, []);

  useEffect(() => {
    if (shouldNavigateToResult && !isSubmitting && !submitError) {
      router.push(`/quiz/${sessionId}/result`);
    }
  }, [shouldNavigateToResult, isSubmitting, submitError, router, sessionId]);

  const goToResult = useCallback(() => {
    setShouldNavigateToResult(true);
  }, []);

  // Auto-advance on correct pick. setTimeout avoids the cascading-render warning
  // from sync setState in effect bodies; restarts when isNextQuestionLoaded flips.
  useEffect(() => {
    if (answerPhase !== 'correct') return;
    if (submitError) return;
    if (isSubmitting) return;
    const timer = setTimeout(() => {
      if (isLastQuestion) goToResult();
      else if (isNextQuestionLoaded) goToNextQuestion();
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [
    answerPhase,
    isLastQuestion,
    isNextQuestionLoaded,
    goToResult,
    goToNextQuestion,
    submitError,
    isSubmitting,
  ]);

  const handlePick = (choiceIdx: number) => {
    if (selectedOptionIdx !== null) return;
    setSelectedOptionIdx(choiceIdx);
    const isCorrect = choiceIdx === correctOptionIdx;
    startTransition(async () => {
      const result = await submitSessionAnswerAction({
        quizSessionId: sessionId,
        questionId: currentQuestion.id,
        answerOptionId: currentQuestion.answerOptions[choiceIdx].id,
        isCorrect,
      });
      if (result.error) setSubmitError(result.error);
    });
  };

  const retrySubmit = () => {
    if (selectedOptionIdx === null) return;
    startTransition(async () => {
      const result = await submitSessionAnswerAction({
        quizSessionId: sessionId,
        questionId: currentQuestion.id,
        answerOptionId: currentQuestion.answerOptions[selectedOptionIdx].id,
        isCorrect: selectedOptionIdx === correctOptionIdx,
      });
      if (result.error) setSubmitError(result.error);
      else setSubmitError(null);
    });
  };

  const handleNextOnWrong = () => {
    if (isLastQuestion) goToResult();
    else if (isNextQuestionLoaded) goToNextQuestion();
  };

  if (!currentQuestion) {
    return <LoadingView topic={topic} />;
  }

  const progressPct =
    ((currentQuestionIdx + (selectedOptionIdx !== null ? 1 : 0)) / totalQuestions) * 100;
  const waitingForNext = answerPhase !== 'idle' && !isLastQuestion && !isNextQuestionLoaded;

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
            {currentQuestionIdx + 1} / {totalQuestions}
          </div>
        </div>

        <div className="h-0.5 bg-muted rounded-full overflow-hidden mt-2.5 mb-5">
          <div
            className="h-full bg-primary transition-[width] duration-400 ease-out"
            style={{ width: `${progressPct}%` }}
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

          {currentQuestionIdx === 0 && selectedOptionIdx === null && (
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

          {answerPhase === 'correct' && !submitError && (
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

          {answerPhase === 'wrong' && (
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
              {!submitError && (
                <Button
                  type="button"
                  onClick={handleNextOnWrong}
                  disabled={waitingForNext || isSubmitting}
                  className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm"
                >
                  {waitingForNext || isSubmitting ? (
                    <PreparingIndicator label={t.answering.preparingNext} />
                  ) : isLastQuestion ? (
                    t.answering.finish
                  ) : (
                    t.answering.next
                  )}
                </Button>
              )}
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-[14px] flex flex-col gap-3"
              style={{ animation: 'fade-up 0.35s ease-out both' }}
            >
              <p className="font-sans text-sm text-destructive m-0">{submitError}</p>
              <Button
                type="button"
                variant="destructive"
                onClick={retrySubmit}
                disabled={isSubmitting}
                className="h-10 rounded-lg text-[14px] font-medium"
              >
                {isSubmitting ? (
                  <PreparingIndicator label={t.answering.preparingNext} />
                ) : (
                  t.answering.submitRetry
                )}
              </Button>
            </div>
          )}

          {waitingForNext && answerPhase === 'correct' && !submitError && (
            <PreparingIndicator
              label={t.answering.preparingNextQuestion}
              className="text-muted-foreground text-[13px]"
            />
          )}

          {streamError &&
            answerPhase === 'idle' &&
            !isNextQuestionLoaded &&
            questions.length < totalQuestions && (
              <p className="text-xs text-destructive" role="alert">
                {streamError}
              </p>
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
