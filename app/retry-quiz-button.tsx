"use client";

import { ReactNode, ComponentProps } from "react";

import { retryQuizWithNewSession } from "@/features/quiz/actions";
import { Topic } from "./generated/prisma/client";

export function RetryQuizButton({
  topicId,
  children,
  ...props
}: { topicId: Topic["id"]; children: ReactNode } & Omit<ComponentProps<"form">, "action">) {
  return (
    <form action={retryQuizWithNewSession} {...props}>
      <input type="hidden" name="topicId" value={topicId} />
      {children}
    </form>
  );
}
