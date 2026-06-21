import { notFound, redirect } from 'next/navigation';

import { ReviewSessionStatus, type ReviewSession } from '@/app/generated/prisma/client';
import { ReviewResultView } from '@/app/review/[reviewSessionId]/result/review-result-view';
import { getReviewSessionResult } from '@/features/review-session/data';

type Props = { reviewSessionId: ReviewSession['id'] };
export default async function ReviewResultPage({ params }: { params: Promise<Props> }) {
  const { reviewSessionId } = await params;
  const result = await getReviewSessionResult(reviewSessionId);
  if (!result) notFound();

  if (result.status !== ReviewSessionStatus.completed) {
    redirect(`/review/${reviewSessionId}`);
  }

  return <ReviewResultView result={result} />;
}
