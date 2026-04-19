"use client";

import { useActionState } from "react";
import { createQuizTopic } from "@/features/quiz/actions";

export function TopicForm() {
  const [state, action, isPending] = useActionState(createQuizTopic, { error: null });

  return (
    <form action={action}>
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
        <span className="text-primary text-lg select-none">+</span>
        <input
          type="text"
          name="title"
          className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Add a topic..."
          aria-invalid={!!state.error}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 text-xs font-medium text-primary hover:text-primary/70 transition-colors disabled:opacity-40"
        >
          {isPending ? "···" : "Go"}
        </button>
      </div>
      {state.error && (
        <p className="mt-2 text-xs text-destructive px-1" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
