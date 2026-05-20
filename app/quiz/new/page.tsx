'use client';

import { useState } from 'react';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { CheckResult } from '@/features/quiz/types';
import { QUIZ, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

type StepStatus = 'pending' | 'active' | 'done' | 'skipped';

// ---- Zod schema ----

const quizFormSchema = z.object({
  topic: z.string().min(1).max(50),
  sense: z.string().optional(),
  angles: z.array(z.string()).optional(),
  otherChecked: z.boolean(),
  otherAngle: z.string().max(50).optional(),
  count: z.string().min(1),
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

// ---- mock backend (replace with real API calls) ----

const PATTERN_A_EXACT = new Set(['bad']);
const PATTERN_C_KEYWORDS = ['good'];
const MOCK_CANDIDATES: Record<string, string[]> = {
  bad: ['Programming language', 'Snake species', 'Monty Python comedy'],
};
const MOCK_OUTLINE = [
  'Habitat & Behavior',
  'Anatomy & Biology',
  'Ecological Role',
  'Famous Species',
];

// LLM①: 語義・文脈判定
function mockCheck(topic: string): CheckResult {
  const t = topic.toLowerCase().trim();
  if (PATTERN_A_EXACT.has(t)) {
    return {
      senseAmbiguous: true,
      angleAmbiguous: true,
      senseCandidates: MOCK_CANDIDATES[t] ?? [],
    };
  }
  if (PATTERN_C_KEYWORDS.some((k) => t.includes(k))) {
    return { senseAmbiguous: false, angleAmbiguous: false, senseCandidates: [] };
  }
  return { senseAmbiguous: false, angleAmbiguous: true, senseCandidates: [] };
}

// LLM②: アウトライン生成
function mockFetchOutline(): string[] {
  return MOCK_OUTLINE;
}

// ---- sub-components ----

function StepNode({ status, n }: { status: StepStatus; n: number }) {
  return (
    <div
      className={cn(
        'flex-none w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
        status === 'pending' && 'border border-border text-muted-foreground',
        status === 'active' && 'border-2 border-primary text-foreground ring-4 ring-primary/15',
        status === 'done' && 'border-2 border-primary text-foreground',
        status === 'skipped' && 'border-2 border-dashed border-primary text-primary',
      )}
    >
      {n}
    </div>
  );
}

function StepRow({
  node,
  children,
  last = false,
}: {
  node: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        {node}
        {!last && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function RewardCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary leading-relaxed">
      {children}
    </div>
  );
}

function SkeletonLabel({ w }: { w: number }) {
  return <div className="h-3.5 rounded-full bg-muted animate-pulse mb-3" style={{ width: w }} />;
}

// ---- page ----

export default function QuizCreationPage() {
  const {
    control,
    formState: { isSubmitted },
    register,
    handleSubmit,
    getValues,
    watch,
  } = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      topic: '',
      sense: '',
      angles: [],
      otherChecked: false,
      otherAngle: '',
      count: '',
    },
  });

  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [outline, setOutline] = useState<string[]>([]);
  const [senseConfirmed, setSenseConfirmed] = useState(false);
  const [anglesConfirmed, setAnglesConfirmed] = useState(false);

  const watchedTopic = watch('topic');
  const watchedSense = watch('sense');
  const watchedAngles = watch('angles') ?? [];
  const watchedOtherChecked = watch('otherChecked') ?? false;
  const watchedOtherAngle = watch('otherAngle');
  const watchedCount = watch('count');

  const topicChecked = checkResult !== null;
  const senseClear = topicChecked && !checkResult.senseAmbiguous;
  const angleClear = topicChecked && !checkResult.angleAmbiguous;

  const senseResolved = senseClear || senseConfirmed;
  const angleResolved = angleClear || anglesConfirmed;

  const step3Unlocked = topicChecked && senseResolved;
  const step4Unlocked = step3Unlocked && angleResolved;

  const step1Status: StepStatus = topicChecked ? 'done' : 'active';

  const step2Status: StepStatus = !topicChecked
    ? 'pending'
    : senseClear
      ? 'skipped'
      : senseConfirmed
        ? 'done'
        : 'active';

  const step3Status: StepStatus = !step3Unlocked ? 'pending' : anglesConfirmed ? 'done' : 'active';

  const step4Status: StepStatus = !step4Unlocked ? 'pending' : 'active';

  // TODO: support re-check (reset back to step1) with a rate limit on Check API calls
  const handleCheck = async () => {
    const topic = getValues('topic');
    if (!topic.trim()) return;
    // TODO: replace with await checkTopic(topic) from @/features/quiz/ai
    const res = mockCheck(topic);
    setCheckResult(res);
    if (!res.senseAmbiguous && res.angleAmbiguous) {
      // TODO: replace with await fetchOutline(topic) from @/features/quiz/ai
      setOutline(mockFetchOutline());
    }
  };

  const angleConfirmDisabled =
    (watchedAngles.length === 0 && !watchedOtherChecked) ||
    (watchedOtherChecked && !watchedOtherAngle?.trim());

  const onSubmit = (data: QuizFormValues) => {
    // TODO: call Server Action from @/features/quiz/actions
    console.log(data);
  };

  return (
    <div className="max-w-md mx-auto px-4 bg-background min-h-screen text-foreground">
      <header className="grid grid-cols-3 items-center h-14 mb-6">
        <Link
          href={ROUTES.home}
          className="justify-self-start text-sm text-muted-foreground hover:opacity-70 transition-opacity"
        >
          ‹ Back
        </Link>
        <h1 className="justify-self-center text-sm font-medium">{QUIZ.title}</h1>
        <div />
      </header>

      <main>
        <form onSubmit={handleSubmit(onSubmit)} className="pb-12">
          {/* Step 1 — Topic */}
          <StepRow node={<StepNode status={step1Status} n={1} />}>
            <FieldSet className="pb-8 gap-0">
              <FieldLegend variant="label" className="mb-3">
                {QUIZ.new.topic.label}
              </FieldLegend>
              <ButtonGroup className="w-full">
                <Input
                  {...register('topic')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !topicChecked) {
                      e.preventDefault();
                      handleCheck();
                    }
                  }}
                  placeholder={QUIZ.new.topic.placeholder}
                  className="text-xs"
                  disabled={topicChecked}
                />
                {!topicChecked && (
                  <Button type="button" onClick={handleCheck} disabled={!watchedTopic.trim()}>
                    Check
                  </Button>
                )}
              </ButtonGroup>
            </FieldSet>
          </StepRow>

          {/* Step 2 — Sense (or merged skip when both sense and angle are clear) */}
          {senseClear && angleClear ? (
            <StepRow node={<StepNode status="skipped" n={2} />}>
              <div className="pb-8">
                <RewardCard>
                  ✨ Nice and specific — we&apos;ll go straight to picking how many questions.
                </RewardCard>
              </div>
            </StepRow>
          ) : (
            <StepRow node={<StepNode status={step2Status} n={2} />}>
              <div className="pb-8">
                {step2Status === 'pending' && (
                  <>
                    <SkeletonLabel w={136} />
                    <div className="flex flex-wrap gap-2">
                      {[80, 116, 96].map((w, i) => (
                        <div
                          key={i}
                          className="h-8 rounded-full bg-muted animate-pulse"
                          style={{ width: w }}
                        />
                      ))}
                    </div>
                  </>
                )}
                {step2Status === 'skipped' && (
                  <RewardCard>✨ Meaning was clear — skipping ahead.</RewardCard>
                )}
                {(step2Status === 'active' || step2Status === 'done') && (
                  <FieldSet className="gap-0">
                    <FieldLegend variant="label" className="mb-3">
                      {QUIZ.new.sense.label}
                    </FieldLegend>
                    <Controller
                      name="sense"
                      control={control}
                      render={({ field }) => (
                        <ToggleGroup
                          type="single"
                          variant="outline"
                          spacing={2}
                          value={field.value ?? ''}
                          onValueChange={(sense) => {
                            if (step2Status === 'active' && sense) field.onChange(sense);
                          }}
                          className="flex-wrap w-full mb-4"
                          disabled={step2Status === 'done'}
                        >
                          {checkResult?.senseCandidates.map((candidate) => (
                            <ToggleGroupItem
                              key={candidate}
                              value={candidate}
                              className="rounded-full px-4 bg-card data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                            >
                              {candidate}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      )}
                    />
                    {step2Status === 'active' && (
                      <Button
                        type="button"
                        size="sm"
                        // TODO: while LLM call is loading, disable this button to prevent double-fire
                        onClick={async () => {
                          setSenseConfirmed(true);
                          // TODO: replace with await fetchOutline(topic, sense) from @/features/quiz/ai
                          setOutline(mockFetchOutline());
                        }}
                        disabled={!watchedSense}
                      >
                        Confirm
                      </Button>
                    )}
                  </FieldSet>
                )}
              </div>
            </StepRow>
          )}

          {/* Step 3 — Angle (not rendered when both sense and angle are clear) */}
          {(!senseClear || !angleClear) && (
            <StepRow node={<StepNode status={step3Status} n={3} />}>
              <div className="pb-8">
                {step3Status === 'pending' && (
                  <>
                    <SkeletonLabel w={104} />
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
                      ))}
                    </div>
                  </>
                )}
                {(step3Status === 'active' || step3Status === 'done') && (
                  <FieldSet className="gap-0">
                    <FieldLegend variant="label" className="mb-3">
                      {QUIZ.new.angle.label}
                    </FieldLegend>
                    <div className="space-y-2 mb-4">
                      <Controller
                        name="angles"
                        control={control}
                        render={({ field }) => {
                          const toggle = (val: string, checked: boolean) => {
                            const next = checked
                              ? [...(field.value ?? []), val]
                              : (field.value ?? []).filter((v) => v !== val);
                            field.onChange(next);
                          };

                          return (
                            <>
                              {outline.map((angle) => (
                                <FieldLabel
                                  key={angle}
                                  htmlFor={`angle-${angle}`}
                                  className={cn(
                                    'w-full gap-3 px-3 py-3 bg-card border rounded-xl transition-colors font-normal',
                                    field.value?.includes(angle)
                                      ? 'border-primary'
                                      : 'border-border',
                                    step3Status === 'done'
                                      ? 'text-muted-foreground pointer-events-none'
                                      : 'cursor-pointer',
                                  )}
                                >
                                  <Checkbox
                                    id={`angle-${angle}`}
                                    checked={field.value?.includes(angle) ?? false}
                                    onCheckedChange={(checked) => toggle(angle, !!checked)}
                                    disabled={anglesConfirmed}
                                  />
                                  <span className="flex-1">{angle}</span>
                                </FieldLabel>
                              ))}
                            </>
                          );
                        }}
                      />

                      {/* Other */}
                      <Controller
                        name="otherChecked"
                        control={control}
                        render={({ field }) => (
                          <div
                            className={cn(
                              'bg-card border rounded-xl transition-colors',
                              field.value ? 'border-primary bg-primary/5' : 'border-border',
                              step3Status === 'done' && 'pointer-events-none',
                            )}
                          >
                            <FieldLabel
                              htmlFor="angle-other"
                              className={cn(
                                'w-full gap-3 px-3 py-3 text-muted-foreground font-normal rounded-xl has-data-[state=checked]:bg-transparent',
                                step3Status !== 'done' && 'cursor-pointer',
                              )}
                            >
                              <Checkbox
                                id="angle-other"
                                checked={field.value ?? false}
                                onCheckedChange={(checked) => field.onChange(!!checked)}
                                disabled={anglesConfirmed}
                              />
                              <span className="flex-1">Other</span>
                            </FieldLabel>
                            {field.value && (
                              <div className="px-3 pb-3">
                                <Input
                                  {...register('otherAngle')}
                                  autoFocus
                                  placeholder={QUIZ.new.angle.placeholder}
                                  disabled={anglesConfirmed}
                                  className={cn(
                                    'text-sm disabled:bg-transparent',
                                    step3Status === 'done' && 'border-primary/60',
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      />
                    </div>
                    {step3Status === 'active' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (!angleConfirmDisabled) setAnglesConfirmed(true);
                        }}
                        disabled={angleConfirmDisabled}
                      >
                        Confirm
                      </Button>
                    )}
                  </FieldSet>
                )}
              </div>
            </StepRow>
          )}

          {/* Step 4 — Count (shows as ③ when both sense and angle are clear) */}
          <StepRow
            node={<StepNode status={step4Status} n={senseClear && angleClear ? 3 : 4} />}
            last
          >
            <div className="pb-8">
              {step4Status === 'pending' && (
                <>
                  <SkeletonLabel w={144} />
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex-1 h-10 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                </>
              )}
              {step4Status === 'active' && (
                <FieldSet className="gap-0">
                  <FieldLegend variant="label" className="mb-3">
                    {QUIZ.new.questionCount.label}
                  </FieldLegend>
                  <Controller
                    name="count"
                    control={control}
                    render={({ field }) => (
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        spacing={2}
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        disabled={isSubmitted}
                        className="w-full"
                      >
                        {QUIZ.new.questionCount.choices.map((n) => (
                          <ToggleGroupItem
                            key={n}
                            value={String(n)}
                            className="flex-1 h-10 rounded-xl bg-card data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                          >
                            {n}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    )}
                  />
                </FieldSet>
              )}
            </div>
          </StepRow>

          <Button
            type="submit"
            disabled={!watchedCount}
            className="w-full mt-2 disabled:opacity-40"
          >
            Create Quiz
          </Button>
        </form>
      </main>
    </div>
  );
}
