import Link from 'next/link';

import { formatDistanceToNow } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';

import { QuizSessionStatus } from '@/app/generated/prisma/client';
import { TopicForm } from '@/app/topic-form';
import { UserMenu } from '@/components/shared/user-menu';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { resumeOrRestartQuizAction } from '@/features/quiz/actions';
import { getTopicsWithLatestSession } from '@/features/topic/data';
import { getDict, getLocale } from '@/lib/i18n/server';

export default async function Home() {
  const [topics, t, locale] = await Promise.all([
    getTopicsWithLatestSession(),
    getDict(),
    getLocale(),
  ]);
  const dateLocale = locale === 'ja' ? ja : enUS;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background py-5">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">Q</span>
            </div>
            <span className="text-sm font-medium text-foreground">{t.appName}</span>
          </div>
          <UserMenu />
        </div>
      </header>
      <div className="max-w-md mx-auto px-4">
        <main className="flex flex-col gap-4 pb-24">
          {topics.length === 0 ? (
            <div className="flex flex-col gap-3">
              <h1 className="font-display italic text-4xl leading-tight text-foreground">
                {t.home.emptyTitlePre}
                <em className="not-italic text-primary">{t.home.emptyTitleEm}</em>
                {t.home.emptyTitlePost}
              </h1>
              <p className="text-sm font-normal text-muted-foreground leading-relaxed">
                {t.home.emptyDesc}
              </p>
            </div>
          ) : (
            <div className="flex items-baseline justify-between">
              <h1 className="font-display italic text-2xl text-foreground">
                {t.home.collectionTitle}
              </h1>
              <span className="text-xs text-muted-foreground">
                {t.home.topicsCount(topics.length)}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {topics.map((topic, i) => {
              const isInProgress = topic.latestQuizSession.status === QuizSessionStatus.in_progress;
              const card = (
                <Card
                  className="group shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  style={{ animation: `fade-up 0.4s ease-out ${0.1 + i * 0.06}s both` }}
                >
                  <CardContent className="flex items-start gap-3 px-4">
                    <div className="mt-1 shrink-0">
                      {isInProgress ? (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      ) : (
                        <div className="w-2 h-2 rounded-full border-2 border-border" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="font-display italic text-lg leading-snug text-card-foreground truncate">
                        {topic.title}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1" suppressHydrationWarning>
                        {formatDistanceToNow(topic.createdAt, {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </CardDescription>
                    </div>
                    <span className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0 mt-0.5">
                      ›
                    </span>
                  </CardContent>
                </Card>
              );

              return isInProgress ? (
                <Link href={`/quiz/${topic.latestQuizSession.id}`} key={topic.id}>
                  {card}
                </Link>
              ) : (
                <form action={resumeOrRestartQuizAction} key={topic.id}>
                  <input type="hidden" name="topicId" value={topic.id} />
                  <button type="submit" className="block w-full text-left">
                    {card}
                  </button>
                </form>
              );
            })}
          </div>
        </main>
        <TopicForm />
      </div>
    </div>
  );
}
