'use client';

import { useActionState, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { startQuizAction } from '@/features/quiz/actions';
import { useI18n } from '@/lib/i18n/context';

export const TopicForm = () => {
  const { t } = useI18n();
  const [state, action, isPending] = useActionState(startQuizAction, null);
  const errorMessage = state && !state.success ? state.error : null;
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const kb = window.innerHeight - vv.height - vv.offsetTop;
      setBottomOffset(Math.max(0, kb));
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  return (
    <div
      className="fixed left-0 right-0 px-4 pb-[env(safe-area-inset-bottom)]"
      style={{ bottom: bottomOffset }}
    >
      <div className="max-w-md mx-auto">
        <FieldError className="mb-2 text-xs px-1">{errorMessage}</FieldError>
        <form action={action}>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
            <span className="text-primary text-lg select-none">+</span>
            <Input
              type="text"
              name="title"
              className="flex-1 min-w-0 border-none bg-transparent shadow-none focus-visible:ring-0 text-base p-0 h-auto placeholder:text-muted-foreground"
              placeholder={t.topicForm.placeholder}
              autoComplete="off"
              aria-invalid={!!errorMessage}
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="shrink-0 h-auto p-0 text-xs font-medium text-primary hover:text-primary/70 hover:bg-transparent disabled:opacity-40"
              disabled={isPending}
            >
              {isPending ? '...' : t.topicForm.submit}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
