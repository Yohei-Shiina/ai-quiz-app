'use client';

import { useEffect, useEffectEvent, useState } from 'react';

import type { AnswerOption, Question, QuizSession } from '@/app/generated/prisma/client';
import { QUIZ_QUESTION_COUNT } from '@/features/quiz/schemas';

export type QuestionWithOptions = Question & { answerOptions: AnswerOption[] };

type Params = {
  sessionId: QuizSession['id'];
  initialCount: number;
  onQuestionReceived: (question: QuestionWithOptions) => void;
};

// Open the SSE stream once on mount when the session is short of questions.
// `onQuestionReceived` is wrapped in an Effect Event so a fresh closure each render
// doesn't re-run the effect; the stream depends only on the session and its
// starting count. In dev StrictMode the cleanup briefly aborts the first
// attempt; the re-mount starts fresh.
export const useQuestionStream = ({ sessionId, initialCount, onQuestionReceived }: Params) => {
  const [streamError, setStreamError] = useState<string | null>(null);
  const emitQuestion = useEffectEvent(onQuestionReceived);

  useEffect(() => {
    if (initialCount >= QUIZ_QUESTION_COUNT) return;

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

        // SSE はバイト列で届き、イベント境界 (\n\n) はチャンクをまたいで割れる。
        // 1 回の read() が返す value(Uint8Array)は任意の位置で切れるため、
        // 「未完成な断片」が普通に発生する:
        //
        //   read①: 'data: {"position":0,"question":{"id":"q1","bo'       ← JSON 途中で切断（未完成）
        //   read②: 'dy":"…"}}\n\ndata: {"position":1,"question":{"i'     ← ①の続き＋次イベントの頭（未完成）
        //
        // → buffer に貯め、\n\n が揃った分だけ切り出す。未完成な末尾は buffer に残し次回へ繰り越す。
        //
        // 切り出した 1 イベント(rawEvent)としてあり得る形:
        //   問題  : 'data: {"position":0,"question":{…}}'   ← event 行なし → 既定 'message'
        //   完了  : 'event: done\ndata: {}'
        //   エラー: 'event: error\ndata: {"message":"…"}'
        //
        // parseSseEvent 後(ParsedSse):
        //   { event:'message', data:{ position:0, question:{ id, body, answerOptions:[…] } } }
        //   { event:'done',    data:{} }
        //   { event:'error',   data:{ message:'…' } }
        //
        // emitQuestion に渡る最終形(QuestionWithOptions):
        //   { id, topicId, body, createdAt, answerOptions:[{ id, body, position, isCorrect }, …] }
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // decoder.decode(bytes, { stream:true }): Uint8Array(バイト列) → 文字列。
          // stream:true は、マルチバイト文字がチャンク境界で割れたとき、末尾の半端バイトを
          // 内部に保持し、次回 decode の先頭へ繋いで正しい文字に復元する（文字化け防止）。
          //   bytes: […, E3, 81]   ← 「あ」(UTF-8: E3 81 82) が途中で切れた
          //     → decode#1 → "…"    （E3 81 は内部保持。まだ文字にしない）
          //   bytes: [82, …]        ← 次チャンク
          //     → decode#2 → "あ…"  （保持していた E3 81 に 82 を繋ぎ「あ」を復元）
          // ＝ decoder はバイト単位、buffer は SSE イベント単位で「割れた断片を繋ぐ」2段構え。
          buffer += decoder.decode(value, { stream: true }); // 末尾は未完成イベントの途中かもしれない
          let sepIndex: number;
          // \n\n まで揃った「完成イベント」だけ処理。未完成な残りは buffer に残す
          while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2); // 繰り越し（未完成な続き）
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
  }, [sessionId, initialCount]);

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
