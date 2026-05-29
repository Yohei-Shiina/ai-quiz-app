'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
import { cn } from '@/lib/utils';

const PLACEHOLDER_EXPLANATION = 'Explanation will be available once the backend is implemented.';

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
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(initialIdx);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  // Awaited before navigating to /result so status='completed' lands first;
  // otherwise any return to the session URL re-shows the last question.
  const pendingSubmitsRef = useRef<Promise<unknown>[]>([]);

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
  }, []);

  const goToResult = useCallback(async () => {
    // Await pending submissions; ignore errors so a failed submit can't block navigation.
    await Promise.allSettled(pendingSubmitsRef.current);
    router.push(`/quiz/${sessionId}/result`);
  }, [router, sessionId]);

  // Auto-advance on correct pick. setTimeout avoids the cascading-render warning
  // from sync setState in effect bodies; restarts when isNextQuestionLoaded flips.
  useEffect(() => {
    if (answerPhase !== 'correct') return;
    const t = setTimeout(() => {
      if (isLastQuestion) goToResult();
      else if (isNextQuestionLoaded) goToNextQuestion();
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [answerPhase, isLastQuestion, isNextQuestionLoaded, goToResult, goToNextQuestion]);

  const handlePick = (choiceIdx: number) => {
    if (selectedOptionIdx !== null) return;
    setSelectedOptionIdx(choiceIdx);
    const isCorrect = choiceIdx === correctOptionIdx;
    const submission = submitSessionAnswerAction({
      quizSessionId: sessionId,
      questionId: currentQuestion.id,
      answerOptionId: currentQuestion.answerOptions[choiceIdx].id,
      isCorrect,
    });
    pendingSubmitsRef.current.push(submission);
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
            Leave quiz
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
              Not the topic you meant?{' '}
              <span className="text-primary font-medium underline underline-offset-[3px] decoration-1">
                Try a different wording
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

          {answerPhase === 'correct' && (
            <div
              className="flex items-center gap-2 font-sans text-sm text-primary font-medium"
              style={{ animation: 'fade-in 0.3s ease-out both' }}
            >
              <span className="w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-[11px] font-bold">
                ✓
              </span>
              Right
            </div>
          )}

          {answerPhase === 'wrong' && (
            <div
              className="flex flex-col gap-4"
              style={{ animation: 'fade-up 0.35s ease-out both' }}
            >
              <div className="bg-card border border-border rounded-xl px-4 py-[14px] flex flex-col gap-2">
                <p className="font-sans text-xs text-muted-foreground m-0 tracking-wide lowercase">
                  The answer was
                </p>
                <p className="font-display italic text-base text-foreground m-0 leading-snug">
                  {currentQuestion.answerOptions[correctOptionIdx]?.body}
                </p>
                <p className="font-sans text-[13px] text-muted-foreground mt-1 leading-relaxed m-0">
                  {PLACEHOLDER_EXPLANATION}
                </p>
              </div>
              <Button
                type="button"
                onClick={handleNextOnWrong}
                disabled={waitingForNext}
                className="h-12 w-full rounded-xl text-[15px] font-medium shadow-sm"
              >
                {waitingForNext ? (
                  <PreparingIndicator label="Preparing next…" />
                ) : isLastQuestion ? (
                  'Finish'
                ) : (
                  'Next question'
                )}
              </Button>
            </div>
          )}

          {waitingForNext && answerPhase === 'correct' && (
            <PreparingIndicator
              label="Preparing next question…"
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
