import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopicForm } from "@/app/topic-form";

export default function Home() {
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
      {/* Hero */}
      <main className="flex flex-col px-4 gap-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-bold">What do you want to learn today?</h1>
          <p className="text-sm">Type any topic and get an AI-generated quiz in seconds.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Quiz topic</CardTitle>
            <CardDescription>
              Enter any subject and we&apos;ll generate a quiz for you.
            </CardDescription>
            <TopicForm />
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </main>
    </>
  );
}
