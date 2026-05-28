import { redirect } from 'next/navigation';

import { QuizSessionStatus, type QuizSession } from '@/app/generated/prisma/client';
import { AnsweringView } from '@/app/quiz/[sessionId]/answering-view';
import {
  countSessionAnswers,
  getQuizSessionWithTopicByIdOrThrow,
  getSessionQuestionsWithOptions,
} from '@/features/quiz/data';

type Props = { sessionId: QuizSession['id'] };
export default async function QuizPage({ params }: { params: Props }) {
  const { sessionId } = await params;
  const [session, initialQuestions, answeredCount] = await Promise.all([
    getQuizSessionWithTopicByIdOrThrow(sessionId),
    getSessionQuestionsWithOptions(sessionId),
    countSessionAnswers(sessionId),
  ]);

  if (session.status === QuizSessionStatus.completed) {
    redirect(`/quiz/${sessionId}/result`);
  }

  const initialIdx = answeredCount;

  return (
    <AnsweringView
      sessionId={sessionId}
      topic={session.topic.title}
      questionCount={session.questionCount}
      initialQuestions={initialQuestions}
      initialIdx={initialIdx}
    />
  );
}
