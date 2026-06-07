import { notFound, redirect } from 'next/navigation';

import { QuizSessionStatus, type QuizSession } from '@/app/generated/prisma/client';
import { AnsweringView } from '@/app/quiz/[sessionId]/answering-view';
import { countSessionAnswers, getQuizSessionWithTopicById } from '@/features/quiz/data';
import { prepareSessionQuestions } from '@/features/quiz/services';

type Props = { sessionId: QuizSession['id'] };
export default async function QuizPage({ params }: { params: Props }) {
  const { sessionId } = await params;

  // Authoritative ownership gate first: a missing/not-owned session resolves to 404
  // here, before any other query can throw a raw error into the error boundary.
  const session = await getQuizSessionWithTopicById(sessionId);
  if (!session) notFound();

  if (session.status === QuizSessionStatus.completed) {
    redirect(`/quiz/${sessionId}/result`);
  }

  const [initialQuestions, answeredCount] = await Promise.all([
    prepareSessionQuestions(sessionId),
    countSessionAnswers(sessionId),
  ]);

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
