import { notFound, redirect } from 'next/navigation';

import { QuizSessionStatus, type QuizSession } from '@/app/generated/prisma/client';
import { ResultView } from '@/app/quiz/[sessionId]/result/result-view';
import { getSessionResult } from '@/features/quiz/data';

// FIXME: Next.js 15+ delivers params as Promise<{...}>; align type to Promise<Props>
// across all dynamic routes (the answering page has the same pattern).
type Props = { sessionId: QuizSession['id'] };
export default async function ResultPage({ params }: { params: Props }) {
  const { sessionId } = await params;
  const result = await getSessionResult(sessionId);
  if (!result) notFound();

  if (result.status !== QuizSessionStatus.completed) {
    redirect(`/quiz/${sessionId}`);
  }

  return <ResultView result={result} />;
}
