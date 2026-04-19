'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { createQuizTopic } from '@/features/quiz/actions';

export function TopicForm() {
  const [state, action, isPending] = useActionState(createQuizTopic, { error: null });

  return (
    <form action={action}>
      <Field orientation="horizontal">
        <Input
          type="text"
          name="title"
          className="placeholder:text-xs"
          placeholder="e.g. World War II, Quantum Physics, 90s Hip Hop..."
          aria-invalid={!!state.error}
        ></Input>
        <Button size={'lg'} type="submit" className="font-bold" disabled={isPending}>
          {isPending ? 'Generating' : 'Start Quiz'}
        </Button>
      </Field>
      {state.error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
