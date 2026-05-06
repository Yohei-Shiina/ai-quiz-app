import type { QuizSession } from '@/app/generated/prisma/client';
import { LoadingView } from '@/app/quiz/[sessionId]/loading-view';
import { getQuizSessionWithTopic } from '@/features/quiz/services';

type Props = { sessionId: QuizSession['id'] };
export default async function QuizPage({ params }: { params: Props }) {
  const { sessionId } = await params;
  const session = await getQuizSessionWithTopic(sessionId);
  const topic = session.topic;

  return <LoadingView topic={topic.title} />;
}
