"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createQuizTopic } from "@/app/actions";

export function TopicForm() {
  const [state, action, isPending] = useActionState(createQuizTopic, { error: null });

  return (
    <form action={action}>
      <Field orientation="horizontal">
        <Input
          type="text"
          name="title"
          className="placeholder:text-xs"
          placeholder="e.g. 90s Hip Pop or Quantum Physics"
        ></Input>
        <Button
          type="submit"
          className="bg-primary font-bold text-primary-foreground"
          variant="outline"
        >
          Generate
        </Button>
      </Field>
      {isPending && <p className="mt-text-sm text-destructive">Loading mate</p>}
      {state.error && <p className="mt-text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
