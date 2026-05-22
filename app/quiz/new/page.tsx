'use client';

import { useState } from 'react';

import Link from 'next/link';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { QUIZ, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

// TODO: replace with server-side topic classification (see features/quiz/ai)
const AMBIGUOUS_SAMPLE: Record<string, string[]> = {
  python: ['Programming language', 'Snake (animal)', 'Monty Python'],
  mercury: ['The planet', 'The element', 'The Roman god', 'Freddie Mercury'],
  java: ['Programming language', 'The island', 'Coffee'],
  apple: ['The fruit', 'The company'],
};

async function classifyTopic(raw: string): Promise<string[] | null> {
  // TODO: replace with real sense-check API call
  await new Promise((r) => setTimeout(r, 500));
  const t = raw.trim().toLowerCase();
  return AMBIGUOUS_SAMPLE[t] ?? null;
}

export default function NewQuizPage() {
  const [topic, setTopic] = useState('');
  const [disambigOptions, setDisambigOptions] = useState<string[] | null>(null);
  const [checking, setChecking] = useState(false);

  const canSubmit = topic.trim().length > 0 && !checking && !disambigOptions;

  const updateTopic = (topic: string) => {
    setTopic(topic);
    if (disambigOptions) setDisambigOptions(null);
  };

  const handleMake = async () => {
    if (!canSubmit) return;
    setChecking(true);
    const opts = await classifyTopic(topic);
    if (opts) {
      setDisambigOptions(opts);
      setChecking(false);
      return;
    }
    // TODO: navigate to /quiz/[sessionId] with the topic for generation.
    // Keep `checking=true` until navigation lands the user on the next screen.
  };

  const handleChip = (label: string) => {
    const composed = `${topic.trim()} · ${label}`;
    // TODO: navigate to /quiz/[sessionId] with `composed` for generation.
    void composed;
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
                  void handleMake();
                }
              }}
              readOnly={checking}
              placeholder={QUIZ.new.topic.placeholder}
              rows={3}
              className={cn(
                'min-h-[88px] resize-none rounded-xl border-border bg-card px-4 py-3.5 text-base leading-relaxed shadow-sm transition-all duration-200 md:text-base',
                'focus-visible:border-primary focus-visible:ring-primary/20',
                checking && 'opacity-70',
              )}
            />

            {disambigOptions && !checking && (
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
              onClick={() => void handleMake()}
            >
              {checking ? (
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
