'use client';

import { useEffect, useEffectEvent, useState } from 'react';

import type { AnswerOption, Question, QuizSession } from '@/app/generated/prisma/client';

export type QuestionWithOptions = Question & { answerOptions: AnswerOption[] };

type Params = {
  sessionId: QuizSession['id'];
  initialCount: number;
  totalCount: number;
  onQuestionReceived: (question: QuestionWithOptions) => void;
};

export const useQuestionStream = ({
  sessionId,
  initialCount,
  totalCount,
  onQuestionReceived,
}: Params) => {
  const [streamError, setStreamError] = useState<string | null>(null);
  const emitQuestion = useEffectEvent(onQuestionReceived);

  useEffect(() => {
    if (initialCount >= totalCount) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/quiz/${sessionId}/generate`, {
          method: 'POST',
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          setStreamError(`Generation failed (${res.status})`);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // e.g. bytes [E3,81] arrive, [82] later → stream:true holds [E3,81] until [82] joins → "あ"
          buffer += decoder.decode(value, { stream: true });
          let sepIndex: number;
          // e.g. buffer='data:{a}\n\ndata:{b-half...' → sepIndex = index of the first \n\n
          while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
            // → rawEvent='data:{a}' (the part before \n\n = one complete event)
            const rawEvent = buffer.slice(0, sepIndex);
            // → buffer='data:{b-half...' (carry the rest; may contain an unfinished event)
            buffer = buffer.slice(sepIndex + 2);
            // e.g. 'data: {"position":0,"question":{…}}' → { event:'message', data:{position:0, question:{…}} }
            // e.g. 'event: done\ndata: {}'              → { event:'done',    data:{} }
            const parsed = parseSseEvent(rawEvent);
            if (!parsed) continue;
            if (parsed.event === 'error') {
              const msg =
                typeof parsed.data?.message === 'string'
                  ? parsed.data.message
                  : 'Something went wrong while generating the quiz.';
              setStreamError(msg);
              return;
            }
            if (parsed.event === 'done') return;
            if (parsed.data?.question) {
              emitQuestion(parsed.data.question as QuestionWithOptions);
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setStreamError(err instanceof Error ? err.message : 'Something went wrong while generating the quiz.');
      }
    })();

    return () => controller.abort();
  }, [sessionId, initialCount, totalCount]);

  return { streamError };
};

type ParsedSse = { event: string; data: Record<string, unknown> | null };

const parseSseEvent = (raw: string): ParsedSse | null => {
  let event = 'message';
  let dataLine = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLine = line.slice(5).trim();
  }
  if (!dataLine) return null;
  try {
    const data = JSON.parse(dataLine);
    return { event, data: data ?? null };
  } catch {
    return null;
  }
};
