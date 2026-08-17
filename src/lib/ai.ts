import 'server-only';

import { z } from 'zod';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { env, aiEnabled } from './env';

export { aiEnabled };

export interface ScoreResult {
  score: number;
  summary: string;
  model: string;
}

const EvidenceSchema = z.object({
  bullets: z.array(z.string()).max(8),
  gaps: z.array(z.string()).max(4),
});

const ScoreSchema = z.object({
  criteria: z.array(
    z.object({
      criterion: z.string(),
      score: z.number(),
      note: z.string(),
    })
  ),
  total: z.number(),
  summary: z.string(),
});

const CritiqueSchema = z.object({
  adjustedTotal: z.number(),
  summary: z.string(),
  changed: z.boolean(),
  reason: z.string(),
});

type ScoreInput = {
  recordTypeLabel: string;
  title: string;
  description: string;
  entries: { title: string; content: string; rawScore?: number | null }[];
  maxScore: number;
  rubric: { criterion: string; max: number }[];
  normalization: string;
};

const GraphState = Annotation.Root({
  input: Annotation<ScoreInput>,
  evidence: Annotation<z.infer<typeof EvidenceSchema> | null>,
  scored: Annotation<z.infer<typeof ScoreSchema> | null>,
  result: Annotation<ScoreResult | null>,
});

function clip(text: string, max = 420) {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function modelId() {
  return env.aiProvider === 'anthropic' ? env.anthropicModel : env.openaiModel;
}

function chat(maxTokens: number) {
  if (env.aiProvider === 'anthropic') {
    return new ChatAnthropic({
      apiKey: env.anthropicApiKey,
      model: env.anthropicModel,
      temperature: 0,
      maxTokens,
    });
  }
  return new ChatOpenAI({
    apiKey: env.openaiApiKey,
    model: env.openaiModel,
    temperature: 0,
    maxTokens,
  });
}

function recordBrief(input: ScoreInput) {
  const entries = input.entries.slice(0, 6).map((e, i) => {
    const marks = e.rawScore != null ? ` (student self-score ${e.rawScore})` : '';
    return `${i + 1}. ${e.title}${marks}: ${clip(e.content || 'No notes.')}`;
  });
  const rubric = input.rubric.map((c) => `${c.criterion} /${c.max}`).join('; ');
  return [
    `Type: ${input.recordTypeLabel}`,
    `Title: ${clip(input.title, 160)}`,
    `Description: ${clip(input.description || 'None', 280)}`,
    `Scale: 0–${input.maxScore}. ${input.normalization}`,
    `Rubric: ${rubric}`,
    `Entries (${Math.min(input.entries.length, 6)}):`,
    entries.join('\n') || 'No entries.',
  ].join('\n');
}

async function extractNode(state: typeof GraphState.State) {
  const extractor = chat(220).withStructuredOutput(EvidenceSchema);
  const evidence = await extractor.invoke([
    [
      'system',
      'You extract assessment evidence only. No scores. Be terse. CUTM Annual Learning Record.',
    ],
    [
      'human',
      `List concrete evidence and missing evidence.\n\n${recordBrief(state.input)}`,
    ],
  ]);
  return { evidence };
}

async function scoreNode(state: typeof GraphState.State) {
  const scorer = chat(380).withStructuredOutput(ScoreSchema);
  const ev = state.evidence;
  const scored = await scorer.invoke([
    [
      'system',
      'You are a faculty assessor. Score each rubric criterion from the evidence only. ' +
        'Do not invent work that is not described. Prefer mid-range scores when evidence is thin. ' +
        `Total must be 0–${state.input.maxScore} and equal the sum of criterion scores (or a justified average if entry-based).`,
    ],
    [
      'human',
      `${recordBrief(state.input)}\n\nEvidence:\n${(ev?.bullets ?? []).join('\n')}\nGaps:\n${(ev?.gaps ?? []).join('\n')}`,
    ],
  ]);
  return { scored };
}

async function critiqueNode(state: typeof GraphState.State) {
  const critic = chat(200).withStructuredOutput(CritiqueSchema);
  const scored = state.scored;
  const max = state.input.maxScore;
  const critique = await critic.invoke([
    [
      'system',
      'You are a second marker. Only change the total if it is inflated, deflated, or ignores a gap. ' +
        `Adjustment must stay within ±8% of ${max} from the first total, and between 0 and ${max}. ` +
        'Keep the summary to 2–3 sentences for the faculty reviewer.',
    ],
    [
      'human',
      `First total: ${scored?.total}\nBreakdown: ${JSON.stringify(scored?.criteria ?? [])}\nSummary: ${scored?.summary}\nGaps: ${(state.evidence?.gaps ?? []).join('; ')}`,
    ],
  ]);

  const first = Math.max(0, Math.min(max, Number(scored?.total) || 0));
  const band = max * 0.08;
  let final = first;
  if (critique.changed) {
    const proposed = Math.max(0, Math.min(max, Number(critique.adjustedTotal) || first));
    final = Math.max(first - band, Math.min(first + band, proposed));
  }
  final = Math.round(final * 10) / 10;

  const summary = clip(critique.summary || scored?.summary || 'Advisory score generated.', 520);
  return {
    result: {
      score: final,
      summary,
      model: `${modelId()}:extract+score+critique`,
    },
  };
}

function buildGraph() {
  return new StateGraph(GraphState)
    .addNode('extract', extractNode)
    .addNode('score', scoreNode)
    .addNode('critique', critiqueNode)
    .addEdge(START, 'extract')
    .addEdge('extract', 'score')
    .addEdge('score', 'critique')
    .addEdge('critique', END)
    .compile();
}

let compiled: ReturnType<typeof buildGraph> | null = null;

function graph() {
  if (!compiled) compiled = buildGraph();
  return compiled;
}

/**
 * Cost-aware 3-agent graph: extract evidence → rubric score → critic.
 * Cheap models, short tokens, structured output. Advisory only.
 */
export async function aiScoreRecord(input: ScoreInput): Promise<ScoreResult> {
  if (!aiEnabled) {
    throw new Error('AI scoring is not configured.');
  }
  if (input.entries.length === 0) {
    throw new Error('Add at least one entry before requesting an AI score.');
  }

  const out = await graph().invoke({
    input,
    evidence: null,
    scored: null,
    result: null,
  });

  if (!out.result) {
    throw new Error('AI scoring did not return a result.');
  }
  return out.result;
}
