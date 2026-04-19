"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createQuizTopic } from "@/features/quiz/actions";

export function HomeHero() {
  const [topic, setTopic] = useState("");
  const [state, action, isPending] = useActionState(createQuizTopic, { error: null });

  const display = topic.trim().slice(0, 16).toUpperCase() || "ANYTHING";

  return (
    <section className="pt-10 pb-8">
      <div style={{ animation: "slide-left 0.3s ease-out 0.05s both" }}>
        <p className="font-display leading-[0.88] text-foreground" style={{ fontSize: "clamp(3.2rem, 17vw, 5.5rem)" }}>
          QUIZ
        </p>
      </div>
      <div style={{ animation: "slide-left 0.3s ease-out 0.12s both" }}>
        <p className="font-display leading-[0.88] text-foreground" style={{ fontSize: "clamp(3.2rem, 17vw, 5.5rem)" }}>
          YOURSELF
        </p>
      </div>
      <div style={{ animation: "slide-left 0.3s ease-out 0.19s both" }}>
        <p className="font-display leading-[0.88] text-primary mb-6" style={{ fontSize: "clamp(3.2rem, 17vw, 5.5rem)" }}>
          ON {display}
        </p>
      </div>

      <div
        className="h-px bg-primary origin-left mb-8"
        style={{ animation: "line-draw 0.45s ease-out 0.3s both" }}
      />

      <form action={action}>
        <div className="flex items-center gap-4">
          <input
            type="text"
            name="title"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 min-w-0 bg-transparent border-b border-border px-0 py-3
                       font-mono text-sm text-foreground outline-none
                       placeholder:text-muted-foreground
                       focus:border-primary transition-colors duration-150"
            placeholder="type a topic_"
            aria-invalid={!!state.error}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 font-mono text-xs tracking-widest
                       border border-primary text-primary px-5 py-3
                       hover:bg-primary hover:text-primary-foreground
                       transition-colors duration-200
                       disabled:opacity-40"
            style={{
              opacity: topic.trim() ? 1 : 0,
              pointerEvents: topic.trim() ? "auto" : "none",
              transition: "opacity 0.2s ease, background-color 0.2s, color 0.2s",
            }}
          >
            {isPending ? "···" : "GO →"}
          </button>
        </div>
        {state.error && (
          <p className="mt-2 font-mono text-xs text-destructive" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </section>
  );
}
