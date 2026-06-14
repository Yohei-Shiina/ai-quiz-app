import { CollectionView } from '@/app/collection-view';
import { SiteHeader } from '@/components/shared/site-header';
import { getTopicsWithLatestSession } from '@/features/topic/data';

export default async function Home() {
  const topics = await getTopicsWithLatestSession();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="max-w-md mx-auto px-4">
        <main className="flex flex-col gap-4 pb-24">
          <CollectionView topics={topics} />
        </main>
      </div>
    </div>
  );
}
