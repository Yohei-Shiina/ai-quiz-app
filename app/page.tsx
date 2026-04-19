import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { TopicForm } from "@/app/topic-form";
import { RetryQuizButton } from "@/app/retry-quiz-button";
import { getTopicsWithLatestSession } from "@/features/quiz/actions";

export default async function Home() {
  const topics = await getTopicsWithLatestSession();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-md mx-auto w-full px-4 flex flex-col flex-1">

        {/* Header */}
        <header
          className="flex items-center justify-between py-5"
          style={{ animation: "fade-in 0.4s ease-out both" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">Q</span>
            </div>
            <span className="text-sm font-medium text-foreground">AI Quiz</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground">Y</span>
          </div>
        </header>

        {topics.length > 0 ? (
          /* Has topics: list is the hero */
          <main className="flex flex-col flex-1 gap-6 pb-8">

            {/* Section label */}
            <div
              className="flex items-baseline justify-between"
              style={{ animation: "fade-up 0.4s ease-out 0.05s both" }}
            >
              <h1 className="font-display italic text-2xl text-foreground">
                Your collection
              </h1>
              <span className="text-xs text-muted-foreground">{topics.length} topics</span>
            </div>

            {/* Topic cards — the main event */}
            <div className="flex flex-col gap-3">
              {topics.map((topic, i) => {
                const isInProgress = topic.latestQuizSession.status === "in_progress";
                const cardContent = (
                  <div className="group bg-card border border-border rounded-xl px-4 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      {/* Status dot */}
                      <div className="mt-1 shrink-0">
                        {isInProgress ? (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        ) : (
                          <div className="w-2 h-2 rounded-full border-2 border-border" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-display italic text-lg leading-snug text-card-foreground truncate">
                          {topic.title}
                        </p>
                        <p
                          className="text-xs text-muted-foreground mt-1"
                          suppressHydrationWarning
                        >
                          {formatDistanceToNow(topic.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      {/* Arrow */}
                      <span className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0 mt-0.5">
                        ›
                      </span>
                    </div>
                  </div>
                );

                return (
                  <div
                    key={topic.id}
                    style={{ animation: `fade-up 0.4s ease-out ${0.1 + i * 0.06}s both` }}
                  >
                    {isInProgress ? (
                      <Link href={`quiz/${topic.latestQuizSession.id}`}>
                        {cardContent}
                      </Link>
                    ) : (
                      <RetryQuizButton topicId={topic.id} className="w-full text-left">
                        {cardContent}
                      </RetryQuizButton>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add topic — quiet, at the bottom */}
            <div
              className="mt-auto pt-4"
              style={{ animation: "fade-up 0.4s ease-out 0.4s both" }}
            >
              <TopicForm />
            </div>
          </main>
        ) : (
          /* Empty state: form is the focus */
          <main
            className="flex flex-col flex-1 justify-center gap-8 pb-16"
            style={{ animation: "fade-up 0.5s ease-out 0.1s both" }}
          >
            <div className="flex flex-col gap-3">
              <h1 className="font-display italic text-4xl leading-tight text-foreground">
                What are you{" "}
                <em className="not-italic text-primary">curious</em>{" "}
                about?
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Type a topic. We'll turn it into a quiz you'll actually want to revisit.
              </p>
            </div>
            <TopicForm />
          </main>
        )}

      </div>
    </div>
  );
}
