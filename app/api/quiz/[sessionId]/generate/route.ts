import type { NextRequest } from 'next/server';

import { requireAuth } from '@/features/auth/services';
import { generateQuizForSession } from '@/features/quiz/services';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  await requireAuth();
  const { sessionId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // request.signal aborts on client disconnect (reload, tab close). Passing
        // it to the generator lets the LLM call cancel and the lock revert to
        // pending so the next caller can resume from the committed-so-far position.
        for await (const chunk of generateQuizForSession(sessionId, request.signal)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
      } catch (error) {
        console.error('Quiz generation failed', { sessionId, error });
        controller.enqueue(encoder.encode(`event: error\ndata: {}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
