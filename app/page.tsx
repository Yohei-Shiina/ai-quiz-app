import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Logo } from "@/components/shared/logo";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopicForm } from "@/app/topic-form";

import { getQuizTopics } from "@/features/quiz/actions";

export default async function Home() {
  const topics = await getQuizTopics();
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
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Past Quizzes</h2>
            <Badge className="tabular-nums" variant={"secondary"}>
              {topics.length}
            </Badge>
          </div>
          {topics.length > 0 && (
            <ItemGroup>
              {topics.map((quiz) => {
                return (
                  <Item size={"sm"} variant={"outline"} asChild key={quiz.id}>
                    <Link href="">
                      <ItemContent>
                        <ItemTitle>{quiz.title}</ItemTitle>
                      </ItemContent>
                      {/* 
                        suppressHydrationWarning is intentional.
                        new Date() runs a few milliseconds later on the client than on the server,
                        but formatDistanceToNow outputs coarse units (minutes, hours, days),
                        so the mismatch has no visible impact.
                      */}
                      <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {formatDistanceToNow(quiz.createdAt, { addSuffix: true })}
                      </span>
                    </Link>
                  </Item>
                );
              })}
            </ItemGroup>
          )}
        </div>
      </main>
    </>
  );
}
