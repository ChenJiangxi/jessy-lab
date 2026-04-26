export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type VisitorCtx = {
  visitorId?: string;
  visitCount?: number;
  isReturning?: boolean;
  minutesSinceLastSeen?: number | null;
  localTimeISO?: string;
};

export type ChatRequest = {
  /** Required. Identifies the conversation in the server's chat_messages table. */
  sessionId: string;
  userMessage: string;
  /** Where the agent is standing — entry / map / room / thread. */
  scene?:
    | { kind: 'entry' }
    | { kind: 'map' }
    | { kind: 'room'; id: string }
    | { kind: 'thread'; id: string };
  localTimeISO?: string;
  /** @deprecated history is now loaded server-side from the DB by sessionId. */
  history?: ChatMessage[];
  /** @deprecated visitor identity is now sessionId. */
  visitor?: VisitorCtx;
};

export type ToolCall = { name: string; args: Record<string, unknown> };

export type StreamHandlers = {
  onDelta: (chunk: string) => void;
  onTool?: (call: ToolCall) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
};

export async function streamChat(req: ChatRequest, handlers: StreamHandlers): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal: handlers.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`chat failed: ${res.status} ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      let currentEvent = 'message';
      let data = '';
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) currentEvent = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        if (currentEvent === 'delta' && typeof parsed.content === 'string') {
          handlers.onDelta(parsed.content);
        } else if (currentEvent === 'tool') {
          handlers.onTool?.({ name: parsed.name, args: parsed.args ?? {} });
        } else if (currentEvent === 'done') {
          handlers.onDone?.();
          return;
        } else if (currentEvent === 'error') {
          handlers.onError?.(new Error(parsed.message || 'stream error'));
          return;
        }
      } catch {
        /* malformed frame */
      }
    }
  }

  handlers.onDone?.();
}
