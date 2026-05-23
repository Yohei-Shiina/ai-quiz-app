'use client';

import { useState, useTransition } from 'react';

import Link from 'next/link';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createQuizFromTopicAction } from '@/features/quiz/actions';
import { checkEntity } from '@/features/quiz/ai';
import { QUIZ, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function NewQuizPage() {
  const [topic, setTopic] = useState('');
  const [disambigOptions, setDisambigOptions] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = topic.trim().length > 0 && !isPending && !disambigOptions;

  const updateTopic = (v: string) => {
    setTopic(v);
    if (disambigOptions) setDisambigOptions(null);
  };

  const handleMake = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await checkEntity(topic);
      if (result.entityAmbiguous) {
        setDisambigOptions(result.entityCandidates);
        return;
      }
      await createQuizFromTopicAction(topic);
    });
  };

  const handleChip = (label: string) => {
    startTransition(async () => {
      await createQuizFromTopicAction(`${topic.trim()} · ${label}`);
    });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-4">
        <header className="flex min-h-12 items-center py-2.5">
          <Link
            href={ROUTES.home}
            className="flex items-center gap-1 px-0.5 py-1.5 text-sm font-normal text-muted-foreground transition-opacity hover:opacity-70"
          >
            <span className="text-base leading-none">‹</span> Back
          </Link>
        </header>

        <main className="flex flex-col gap-5 pt-4">
          <div
            className="flex flex-col gap-1.5"
            style={{ animation: 'fade-up 0.4s ease-out both' }}
          >
            <h1 className="font-display text-3xl leading-tight font-normal tracking-tight text-foreground italic">
              What&apos;s on your mind?
            </h1>
            <p className="text-sm leading-relaxed font-normal text-muted-foreground">
              One sentence is enough. We&apos;ll turn it into a quiz.
            </p>
          </div>

          <div
            className="flex flex-col gap-2.5"
            style={{ animation: 'fade-up 0.4s ease-out 0.08s both' }}
          >
            <Textarea
              value={topic}
              onChange={(e) => updateTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  handleMake();
                }
              }}
              readOnly={isPending}
              placeholder={QUIZ.new.topic.placeholder}
              rows={3}
              className={cn(
                'min-h-[88px] resize-none rounded-xl border-border bg-card px-4 py-3.5 text-base leading-relaxed shadow-sm transition-all duration-200 md:text-base',
                'focus-visible:border-primary focus-visible:ring-primary/20',
                isPending && 'opacity-70',
              )}
            />

            {disambigOptions && !isPending && (
              <div
                className="flex flex-col gap-2.5 rounded-xl border border-dashed border-primary bg-card px-3.5 py-3"
                style={{ animation: 'fade-up 0.35s ease-out both' }}
              >
                <p className="text-xs leading-snug font-normal text-muted-foreground">
                  Which one do you mean?
                </p>
                <div className="flex flex-wrap gap-2">
                  {disambigOptions.map((label) => (
                    <Button
                      key={label}
                      type="button"
                      variant="outline"
                      className="h-auto rounded-full px-3.5 py-2 text-sm font-medium"
                      disabled={isPending}
                      onClick={() => handleChip(label)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="button"
              className="mt-0.5 h-12 w-full rounded-xl text-base font-medium shadow-md"
              disabled={!canSubmit}
              onClick={handleMake}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span className="opacity-90">Checking…</span>
                </>
              ) : (
                'Make'
              )}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
