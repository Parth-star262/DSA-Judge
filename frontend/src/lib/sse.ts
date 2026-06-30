const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  const url = `${API_URL}/api/submissions/${submissionId}/stream`;

  // EventSource doesn't support custom headers — use fetch + ReadableStream instead
  const controller = new AbortController();

  const connect = async () => {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
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
                controller.abort();
                return;
              }
            } catch {
              // Malformed JSON, skip
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onEvent({ type: 'error', error: err.message || 'Stream connection error' });
      }
    }
  };

  connect();

  return () => controller.abort();
}
