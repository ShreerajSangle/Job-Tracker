// Minimal Groq chat-completions client with model fallback and tolerant JSON parsing.
export type GroqMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface GroqJsonOptions {
  models?: string[];
  timeoutMs?: number;
  temperature?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  includeReasoning?: boolean;
  maxCompletionTokens?: number;
  responseFormat?: Record<string, unknown>;
}

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const RETRYABLE = new Set([400, 404, 408, 422, 429, 500, 502, 503, 504]);

export const uniqueModels = (...names: (string | undefined)[]) =>
  [...new Set(names.map((n) => n?.trim()).filter((n): n is string => !!n))];

export function parseJsonContent<T>(content: string): T | null {
  try { return JSON.parse(content) as T; } catch { /* fall through */ }
  const s = content.indexOf('{');
  const e = content.lastIndexOf('}');
  if (s < 0 || e <= s) return null;
  try { return JSON.parse(content.slice(s, e + 1)) as T; } catch { return null; }
}

export async function groqJson<T>(messages: GroqMessage[], opts: GroqJsonOptions = {}): Promise<{ data: T; model: string } | null> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return null;
  const models = opts.models?.length ? opts.models : uniqueModels(process.env.GROQ_MODEL, 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile');
  for (const model of models) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 12_000),
        body: JSON.stringify({
          model,
          temperature: opts.temperature ?? 0,
          response_format: opts.responseFormat ?? { type: 'json_object' },
          messages,
          ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
          ...(typeof opts.includeReasoning === 'boolean' ? { include_reasoning: opts.includeReasoning } : {}),
          ...(opts.maxCompletionTokens ? { max_completion_tokens: opts.maxCompletionTokens } : {}),
        }),
      });
      if (!res.ok) {
        console.warn('Groq request failed', { model, status: res.status });
        if (RETRYABLE.has(res.status)) continue;
        return null;
      }
      const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = payload.choices?.[0]?.message?.content?.trim();
      const data = content ? parseJsonContent<T>(content) : null;
      if (data) return { data, model };
    } catch { /* try next model */ }
  }
  return null;
}

/** Groq Compound (web_search + visit_website). Output is untrusted. */
export async function groqWebJson<T>(messages: GroqMessage[], model = 'groq/compound-mini', timeoutMs = 20_000): Promise<T | null> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Groq-Model-Version': 'latest' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model, temperature: 0, response_format: { type: 'json_object' }, messages,
        compound_custom: { tools: { enabled_tools: ['web_search', 'visit_website'] } },
      }),
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content?.trim();
    return content ? parseJsonContent<T>(content) : null;
  } catch { return null; }
}
