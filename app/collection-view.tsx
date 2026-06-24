'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';

import { formatDistanceToNow } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import { Check, Trash2 } from 'lucide-react';

import { TopicForm } from '@/app/topic-form';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { resumeOrRestartQuizAction } from '@/features/quiz/actions';
import { startOrResumeReviewSessionAction } from '@/features/review-session/actions';
import { deleteTopicsAction } from '@/features/topic/actions';
import { useI18n } from '@/lib/i18n/context';

// Inlined to keep @prisma/client out of the client bundle.
type TopicListItem = {
  id: string;
  title: string;
  createdAt: Date;
  latestQuizSession: { id: string; status: 'in_progress' | 'completed' };
};

type Props = {
  topics: TopicListItem[];
  reviewDueCount: number;
};

// Problem: rapid 2nd delete leaves the previous batch in limbo (still hidden,
//          never committed, blocks the new undo toast).
// Solution: one pending batch at a time; a new delete commits the previous one immediately.
const UNDO_WINDOW_MS = 4000;

export const CollectionView = ({ topics, reviewDueCount }: Props) => {
  const { t, locale } = useI18n();
  const dateLocale = locale === 'ja' ? ja : enUS;

  // --- state ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // hide rows now; commit (server delete) or restore (Undo) within UNDO_WINDOW_MS.
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  // snapshot for the Undo toast + the commit-timer payload.
  const [pendingDelete, setPendingDelete] = useState<{ topics: TopicListItem[] } | null>(null);

  // --- refs ---
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // mirror of pendingDelete so the setTimeout closure can read the latest value.
  const pendingDeleteRef = useRef<{ topics: TopicListItem[] } | null>(null);

  // --- derived ---
  const visibleTopics = useMemo(
    () => topics.filter((topic) => !hiddenIds.has(topic.id)),
    [topics, hiddenIds],
  );

  // --- handlers ---
  const commitPendingDelete = async () => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setPendingDelete(null);
    await deleteTopicsAction(pending.topics.map((t) => t.id));
  };

  const handleToggleEdit = () => {
    setIsEditMode((prev) => {
      const next = !prev;
      if (!next) setSelected(new Set());
      return next;
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    const idsToRemove = Array.from(selected);
    const removed = visibleTopics.filter((t) => selected.has(t.id));

    if (pendingDeleteRef.current) await commitPendingDelete();

    setHiddenIds((prev) => {
      const next = new Set(prev);
      for (const id of idsToRemove) next.add(id);
      return next;
    });
    setSelected(new Set());
    setIsEditMode(false);

    setPendingDelete({ topics: removed });
    pendingTimerRef.current = setTimeout(() => {
      commitPendingDelete();
    }, UNDO_WINDOW_MS);
  };

  const handleUndo = () => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setHiddenIds((prev) => {
      const next = new Set(prev);
      for (const topic of pending.topics) next.delete(topic.id);
      return next;
    });
    setPendingDelete(null);
  };

  // --- effects ---
  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  // --- render ---
  return (
    <>
      {visibleTopics.length === 0 ? (
        <div className="flex flex-col justify-center gap-3 text-center min-h-[calc(100svh-10rem)]">
          <h1 className="font-display text-3xl leading-tight text-foreground">
            {t.home.emptyTitlePre}
            <span className="text-primary">{t.home.emptyTitleEm}</span>
            {t.home.emptyTitlePost}
          </h1>
          <p className="text-sm font-normal text-muted-foreground leading-relaxed">
            {t.home.emptyDesc}
          </p>
        </div>
      ) : (
        <div className="flex items-baseline justify-between">
          <h1 className="font-display italic text-2xl text-foreground">{t.home.collectionTitle}</h1>
          <div className="flex items-baseline gap-3">
            {!isEditMode && (
              <span className="text-xs text-muted-foreground">
                {t.home.topicsCount(visibleTopics.length)}
              </span>
            )}
            <button
              type="button"
              onClick={handleToggleEdit}
              className="text-sm text-primary font-medium hover:opacity-80 transition-opacity"
            >
              {isEditMode ? t.home.done : t.home.edit}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {!isEditMode && reviewDueCount > 0 && (
          <form action={startOrResumeReviewSessionAction}>
            <button type="submit" className="block w-full text-left">
              <Card
                className="group shadow-sm bg-primary/8 border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                style={{ animation: 'fade-up 0.4s ease-out 0.05s both' }}
              >
                <CardContent className="flex items-start gap-3 px-4">
                  <div className="mt-1 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-display italic text-lg leading-snug text-card-foreground">
                      {t.home.reviewCardTitle(reviewDueCount)}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {t.home.reviewCardSubtitle}
                    </CardDescription>
                  </div>
                  <span className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0 mt-0.5">
                    ›
                  </span>
                </CardContent>
              </Card>
            </button>
          </form>
        )}
        {visibleTopics.map((topic, i) => {
          const isInProgress = topic.latestQuizSession.status === 'in_progress';
          const isSelected = selected.has(topic.id);
          const card = (
            <Card
              className={`group shadow-sm transition-all duration-200 ${
                isEditMode
                  ? isSelected
                    ? 'bg-primary/5 border-primary/30'
                    : 'hover:bg-muted/40'
                  : 'hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <CardContent className="flex items-start gap-3 px-4">
                {isEditMode ? (
                  <div
                    className={`mt-0.5 shrink-0 size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-background'
                    }`}
                    aria-hidden
                  >
                    {isSelected && <Check className="size-3" strokeWidth={3} />}
                  </div>
                ) : (
                  <div className="mt-1 shrink-0">
                    {isInProgress ? (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    ) : (
                      <div className="w-2 h-2 rounded-full border-2 border-border" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="font-display italic text-lg leading-snug text-card-foreground truncate">
                    {topic.title}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1" suppressHydrationWarning>
                    {formatDistanceToNow(topic.createdAt, {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </CardDescription>
                </div>
                {!isEditMode && (
                  <span className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0 mt-0.5">
                    ›
                  </span>
                )}
              </CardContent>
            </Card>
          );

          // Stable `div` wrapper so fade-up doesn't re-fire when the inner wrapper swaps.
          return (
            <div
              key={topic.id}
              style={{ animation: `fade-up 0.4s ease-out ${0.1 + i * 0.06}s both` }}
            >
              {isEditMode ? (
                <button
                  type="button"
                  onClick={() => handleToggleSelect(topic.id)}
                  aria-pressed={isSelected}
                  aria-label={t.home.selectTopicAriaLabel(topic.title)}
                  className="block w-full text-left"
                >
                  {card}
                </button>
              ) : isInProgress ? (
                <Link href={`/quiz/${topic.latestQuizSession.id}`}>{card}</Link>
              ) : (
                <form action={resumeOrRestartQuizAction}>
                  <input type="hidden" name="topicId" value={topic.id} />
                  <button type="submit" className="block w-full text-left">
                    {card}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom action bar — shown only with 1+ selection. */}
      {isEditMode && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-6 pt-3 bg-linear-to-t from-background via-background/95 to-transparent">
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive text-destructive-foreground h-12 text-[15px] font-medium shadow-lg hover:bg-destructive/90 transition-colors"
            >
              <Trash2 className="size-4" />
              {t.home.deleteCountTopics(selected.size)}
            </button>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {pendingDelete && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 px-4 pb-6 pt-3"
          style={{ animation: 'fade-up 0.25s ease-out both' }}
        >
          <div className="max-w-md mx-auto flex items-center justify-between gap-3 rounded-xl bg-foreground text-background px-4 py-3 shadow-lg">
            <span className="text-sm">{t.home.topicsDeleted(pendingDelete.topics.length)}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              {t.home.undo}
            </button>
          </div>
        </div>
      )}

      {/* Hide while editing to avoid accidental creation during deletion. */}
      {!isEditMode && <TopicForm />}
    </>
  );
};
