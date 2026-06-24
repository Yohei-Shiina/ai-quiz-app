import { notFound, redirect } from 'next/navigation';

import { ReviewSessionStatus, type ReviewSession } from '@/app/generated/prisma/client';
import { ReviewAnsweringView } from '@/app/review/[reviewSessionId]/review-answering-view';
import {
  countReviewSessionAnswers,
  getReviewSessionWithQuestions,
} from '@/features/review-session/data';
import { shuffleArray } from '@/lib/shuffle';

type Props = { reviewSessionId: ReviewSession['id'] };
export default async function ReviewPage({ params }: { params: Promise<Props> }) {
  const { reviewSessionId } = await params;

  const session = await getReviewSessionWithQuestions(reviewSessionId);
  if (!session) notFound();

  if (session.status === ReviewSessionStatus.completed) {
    redirect(`/review/${reviewSessionId}/result`);
  }

  const answeredCount = await countReviewSessionAnswers(reviewSessionId);

  const questions = session.reviewSessionQuestions.map((sq) => ({
    id: sq.question.id,
    body: sq.question.body,
    explanation: sq.question.explanation,
    topicTitle: sq.question.topic.title,
    // Shuffle server-side (RSC) to avoid a client hydration mismatch; safe because grading
    // keys off the isCorrect flag + answerOptionId, not the array index.
    answerOptions: shuffleArray(sq.question.answerOptions).map((o) => ({
      id: o.id,
      body: o.body,
      isCorrect: o.isCorrect,
    })),
  }));

  return (
    <ReviewAnsweringView
      reviewSessionId={reviewSessionId}
      questions={questions}
      initialIdx={answeredCount}
    />
  );
}
