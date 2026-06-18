import { requireAuth } from '@/features/auth/services';
import { generateQuizForSession } from '@/features/quiz/services';

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  await requireAuth();
  const { sessionId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    // Problem: when the SSE client disconnects, the next controller.enqueue throws.
    //          If that throw escapes the for-await body, JS calls the generator's
    //          .return() at the suspended yield, skipping the markGenerationSuccess
    //          cleanup and leaving the session half-saved with the event stuck at
    //          generating.
    // Solution: catch each enqueue locally so the body never re-throws. The outer
    //           try/catch only handles real generation errors (LLM / DB failures),
    //           while the inner catches let the generator run to completion and
    //           persist every question even after the client is gone.
    async start(controller) {
      try {
        for await (const chunk of generateQuizForSession(sessionId)) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          } catch {}
        }
        try {
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          controller.close();
        } catch {}
      } catch (error) {
        console.error('Quiz generation failed', { sessionId, error });
        try {
          controller.enqueue(encoder.encode(`event: error\ndata: {}\n\n`));
          controller.close();
        } catch {}
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
