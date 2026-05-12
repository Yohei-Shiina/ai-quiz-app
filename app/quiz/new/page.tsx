'use client';
import { useState } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { QUIZ, ROUTES } from '@/lib/constants';

export default function CreateQuiz() {
  const [showInputInput, setShowSenseInput] = useState(false);
  const [showAngleInput, setShowAngleInput] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-10 bg-background py-5">
        <div className="grid grid-cols-3 items-center max-w-md mx-auto px-4">
          <Link href={ROUTES.home} className="text-sm text-foreground">
            ‹ Back
          </Link>
          <span className="text-sm font-medium text-center">{QUIZ.title}</span>
          <div />
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 pb-28">
        <form id="create-quiz-form" action="" className="flex flex-col gap-6">
          <FieldSet>
            <FieldGroup className="gap-6">
              {/* Topic */}
              <Field>
                <FieldLabel className="text-xs text-muted-foreground">
                  {QUIZ.new.topic.label}
                </FieldLabel>
                <Input
                  name={QUIZ.new.topic.name}
                  className="placeholder:text-sm placeholder:text-muted-foreground"
                  placeholder={QUIZ.new.topic.placeholder}
                  required
                />
              </Field>
              {/* Word sense */}
              <Field>
                <FieldLabel className="text-xs text-muted-foreground">
                  {QUIZ.new.sense.label}
                </FieldLabel>
                <ToggleGroup
                  type="single"
                  onValueChange={(v) => setShowSenseInput(v === 'other')}
                  variant="outline"
                  spacing={2}
                  className="w-full flex-wrap"
                >
                  {['top', 'bottom', 'right', 'left', 'other'].map((i) => (
                    <ToggleGroupItem
                      key={i}
                      name={QUIZ.new.sense.name}
                      value={i}
                      aria-label={i}
                      className="font-normal rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-transparent"
                    >
                      {i}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Input
                  hidden={!showInputInput}
                  className="placeholder:text-sm placeholder:text-muted-foreground"
                  placeholder={QUIZ.new.sense.placeholder}
                />
              </Field>
              {/* Angle */}
              <Field>
                <FieldLabel className="text-xs text-muted-foreground">
                  {QUIZ.new.angle.label}
                </FieldLabel>
                <ToggleGroup
                  type="multiple"
                  onValueChange={(v) => setShowAngleInput(v.includes('other'))}
                  variant="outline"
                  spacing={2}
                  className="w-full flex-wrap"
                >
                  {['top', 'bottom', 'right', 'left', 'other'].map((i) => (
                    <ToggleGroupItem
                      key={i}
                      name={QUIZ.new.angle.name}
                      value={i}
                      aria-label={i}
                      className="font-normal rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-transparent"
                    >
                      {i}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Input
                  hidden={!showAngleInput}
                  className="placeholder:text-sm placeholder:text-muted-foreground"
                  placeholder={QUIZ.new.angle.placeholder}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          {/* Question count */}
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel className="text-xs text-muted-foreground">
                  {QUIZ.new.questionCount.label}
                </FieldLabel>
                <ToggleGroup type="single" variant="outline" spacing={2} className="w-full">
                  {QUIZ.new.questionCount.choices.map((i) => {
                    const count = String(i);
                    return (
                      <ToggleGroupItem
                        key={count}
                        name={QUIZ.new.questionCount.name}
                        value={count}
                        aria-label={count}
                        className="flex-1 h-14 rounded-xl font-normal text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-transparent"
                      >
                        {count}
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              </Field>
            </FieldGroup>
          </FieldSet>
          <div className="fixed left-0 right-0 bottom-0 max-w-md mx-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <Button type="submit" className="w-full rounded-md" size={'lg'}>
              <span className="text-xs">+ Create new quiz</span>
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
