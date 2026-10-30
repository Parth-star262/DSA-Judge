const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

export type SSEEvent =
  | { type: 'queued'; submissionId: string }
  | { type: 'heartbeat' }
  | { type: 'complete'; result: JudgeResult }
  | { type: 'error'; error: string }
  | { type: 'timeout'; message: string };

export interface JudgeResult {
  submissionId: string;
  verdict: string;
  score: number;
  passedCases: number;
  totalCases: number;
  executionTime: number;
  complexityEstimate?: string;
  optimalComplexity?: string;
  complexityMatch?: boolean;
  spaceComplexityEstimate?: string;
  optimalSpaceComplexity?: string;
  spaceComplexityMatch?: boolean;
  firstFailedCase?: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    stderr?: string;
  };
  newBadges?: Array<{ type: string; name: string; description: string }>;
}

/**
 * Connects to the SSE stream for a given submission and calls onEvent for each update.
 * Returns a cleanup function that closes the connection.
 */
export function streamSubmission(
  submissionId: string,
  token: string,
  onEvent: (event: SSEEvent) => void
): () => void {
  const url = `${API_BASE}/submissions/${submissionId}/stream`;

  // EventSource doesn't support custom headers â€” use fetch + ReadableStream instead
  const controller = new AbortController();

  let terminal = false;
  const maxRetries = 2;

  const connect = async (attempt = 0): Promise<void> => {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        if (attempt < maxRetries && !controller.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
          return connect(attempt + 1);
        }
        onEvent({ type: 'error', error: 'Failed to connect to submission stream' });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent(data as SSEEvent);

              // Auto-close after terminal events
              if (data.type === 'complete' || data.type === 'error' || data.type === 'timeout') {
                terminal = true;
                controller.abort();
                return;
              }
            } catch {
              // Malformed JSON, skip
            }
          }
        }
      }
      if (!terminal && attempt < maxRetries && !controller.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        return connect(attempt + 1);
      }
      if (!terminal && !controller.signal.aborted) {
        onEvent({ type: 'error', error: 'Submission stream ended before a final result' });
      }
    } catch (err) {
      const error = err as Error;
      if (error?.name !== 'AbortError' && !terminal && attempt < maxRetries && !controller.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        return connect(attempt + 1);
      }
      if (error?.name !== 'AbortError' && !terminal && !controller.signal.aborted) {
        onEvent({ type: 'error', error: error?.message || 'Stream connection error' });
      }
    }
  };

  connect();

  return () => controller.abort();
}
