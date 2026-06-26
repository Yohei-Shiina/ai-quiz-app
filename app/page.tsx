import { CollectionView } from '@/app/collection-view';
import { SiteHeader } from '@/components/shared/site-header';
import { countDueQuestionReviewStates } from '@/features/question-review-state/data';
import { getTopicsWithLatestSession } from '@/features/topic/data';

export default async function Home() {
  const [topics, reviewDueCount] = await Promise.all([
    getTopicsWithLatestSession(),
    countDueQuestionReviewStates(new Date()),
  ]);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="max-w-md sm:max-w-lg lg:max-w-4xl mx-auto px-4">
        <main className="flex flex-col gap-4 pb-24">
          <CollectionView topics={topics} reviewDueCount={reviewDueCount} />
        </main>
      </div>
    </div>
  );
}
