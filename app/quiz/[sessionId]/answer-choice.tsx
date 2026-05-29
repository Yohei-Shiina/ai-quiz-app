'use client';

import { cn } from '@/lib/utils';

type ChoiceState = 'default' | 'correct' | 'revealed' | 'wrong' | 'muted';

const stateFor = ({
  index,
  selectedOptionIdx,
  correctOptionIdx,
}: {
  index: number;
  selectedOptionIdx: number | null;
  correctOptionIdx: number;
}): ChoiceState => {
  if (selectedOptionIdx === null) return 'default';
  if (index === correctOptionIdx && selectedOptionIdx === index) return 'correct';
  if (index === correctOptionIdx) return 'revealed';
  if (index === selectedOptionIdx) return 'wrong';
  return 'muted';
};

type Props = {
  label: string;
  index: number;
  selectedOptionIdx: number | null;
  correctOptionIdx: number;
  onClick: () => void;
};

export const AnswerChoice = ({
  label,
  index,
  selectedOptionIdx,
  correctOptionIdx,
  onClick,
}: Props) => {
  const state = stateFor({ index, selectedOptionIdx, correctOptionIdx });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={selectedOptionIdx !== null}
      className={cn(
        'w-full text-left rounded-xl px-4 py-[14px] border font-sans text-[15px] leading-snug',
        'flex items-center gap-3 transition-all duration-200',
        'shadow-sm',
        state === 'default' &&
          'bg-card border-border text-foreground font-normal hover:shadow-md hover:-translate-y-px cursor-pointer',
        state === 'correct' &&
          'bg-card border-primary text-primary font-medium ring-[3px] ring-primary/20 cursor-default',
        state === 'wrong' &&
          'bg-card border-destructive text-destructive font-medium cursor-default',
        state === 'revealed' && 'bg-card border-primary text-primary font-normal cursor-default',
        state === 'muted' &&
          'bg-background border-border text-muted-foreground font-normal shadow-none cursor-default',
      )}
    >
      {state === 'correct' && (
        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-xs font-bold shrink-0">
          ✓
        </span>
      )}
      {state === 'wrong' && (
        <span className="w-5 h-5 rounded-full bg-destructive text-primary-foreground inline-flex items-center justify-center text-xs font-bold shrink-0">
          ✕
        </span>
      )}
      {state === 'revealed' && (
        <span className="w-5 h-5 rounded-full border-[1.5px] border-primary text-primary inline-flex items-center justify-center text-[11px] font-bold shrink-0">
          ✓
        </span>
      )}
      <span className="flex-1">{label}</span>
    </button>
  );
};
