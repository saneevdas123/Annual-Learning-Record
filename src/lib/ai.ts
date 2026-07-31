import { env, aiEnabled } from './env';

// Provider-agnostic AI helper for subject-wise scoring assistance and summaries.
// If no key is configured, callers should skip AI — the platform works fully
// without it (all scoring can be done by faculty). Findings r keeps a human
// override path, so AI output here is always advisory.

export { aiEnabled };

interface ScoreResult {
  score: number; // 0..max
  summary: string;
}

async function callModel(system: string, user: string): Promise<string> {
  if (env.aiProvider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.anthropicModel,
        max_tokens: 700,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
    const data = await res.json();
    return (data.content ?? []).map((b: { text?: string }) => b.text ?? '').join('\n');
  }

  // openai
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      max_tokens: 700,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// Suggest a subject-wise score (advisory) with a short justification.
export async function aiScoreRecord(input: {
  recordTypeLabel: string;
  title: string;
  description: string;
  entries: { title: string; content: string }[];
  maxScore: number;
}): Promise<ScoreResult | null> {
  if (!aiEnabled) return null;
  const system =
    'You are an academic assessor for a university learning-record system. ' +
    'Assess the submitted learning record against typical rubric expectations for its type. ' +
    'Respond ONLY as compact JSON: {"score": <number>, "summary": "<2-3 sentence justification>"}. ' +
    `Score must be between 0 and ${input.maxScore}.`;
  const entriesText = input.entries
    .map((e, i) => `Entry ${i + 1}: ${e.title}\n${e.content}`)
    .join('\n\n');
  const user =
    `Record type: ${input.recordTypeLabel}\nTitle: ${input.title}\n` +
    `Description: ${input.description}\n\n${entriesText}`;

  try {
    const raw = await callModel(system, user);
    const json = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const score = Math.max(0, Math.min(input.maxScore, Number(json.score) || 0));
    return { score, summary: String(json.summary ?? '') };
  } catch {
    return null;
  }
}
