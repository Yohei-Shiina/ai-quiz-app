import Link from 'next/link';

import { formatDistanceToNow } from 'date-fns';

import { TopicForm } from '@/app/topic-form';
import { Logo } from '@/components/shared/logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item';
import { Separator } from '@/components/ui/separator';
import { getTopicsWithLatestSession, retryQuizWithNewSession } from '@/features/quiz/actions';

export default async function Home() {
  const topics = await getTopicsWithLatestSession();
  return (
    <>
      <header className="sticky top-0 z-50">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span>AI Quiz App</span>
          </div>
          <Avatar>
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
              Y
            </AvatarFallback>
          </Avatar>
        </div>
        <Separator />
      </header>
      <main className="flex flex-col gap-6 px-4 pt-8">
        {/* Hero */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Quiz yourself on anything</h1>
          <p className="text-sm text-muted-foreground">
            Type a topic. We&apos;ll build a quiz in seconds.
          </p>
        </div>
        {/* Topic Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm font-bold">What&apos;s your topic?</CardTitle>
          </CardHeader>
          <CardContent>
            <TopicForm />
          </CardContent>
        </Card>

        {/* Past Quizzes */}
        {topics.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Past Quizzes</h2>
              <Badge className="tabular-nums" variant={'secondary'}>
                {topics.length}
              </Badge>
            </div>
            <ItemGroup>
              {topics.map((topic) => {
                const content = (
                  <>
                    <ItemContent>
                      <ItemTitle>{topic.title}</ItemTitle>
                    </ItemContent>
                    {/* 
                        suppressHydrationWarning is intentional.
                        new Date() runs a few milliseconds later on the client than on the server,
                        but formatDistanceToNow outputs coarse units (minutes, hours, days),
                        so the mismatch has no visible impact.
                      */}
                    <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {formatDistanceToNow(topic.createdAt, { addSuffix: true })}
                    </span>
                  </>
                );
                return (
                  <Item size={'sm'} variant={'outline'} asChild key={topic.id}>
                    {topic.latestQuizSession.status === 'in_progress' ? (
                      <Link href={`/quiz/${topic.latestQuizSession.id}`}>{content}</Link>
                    ) : (
                      <form action={retryQuizWithNewSession}>
                        <input type="hidden" name="topicId" value={topic.id} />
                        {content}
                      </form>
                    )}
                  </Item>
                );
              })}
            </ItemGroup>
          </div>
        )}
      </main>
    </>
  );
}
