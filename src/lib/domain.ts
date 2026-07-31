// ---------------------------------------------------------------------------
// ALR domain configuration — the Learning Record Framework, encoded.
//
// This is the single source of truth for: which record types each of the twelve
// subject configurations requires, each record type's subject-level weight, the
// per-entry scoring scale, and the normalization formula that converts an average
// per-entry score into the Framework's subject-level percentage (findings a & e).
// Keeping it here (not implicit in code) is exactly what recommendation (e) asks.
// ---------------------------------------------------------------------------

export type CombinationCode =
  | 'THEORY'
  | 'MOOC'
  | 'PRACTICE'
  | 'WORKSHOP'
  | 'PROJECT'
  | 'THESIS'
  | 'INTERNSHIP'
  | 'THEORY_PRACTICE'
  | 'THEORY_PROJECT'
  | 'THEORY_PRACTICE_PROJECT'
  | 'PRACTICE_PROJECT'
  | 'THEORY_MOOC';

export type RecordType =
  | 'CLASSROOM_LEARNING'
  | 'APPLIED_ACTION_LEARNING'
  | 'ACTION_LEARNING'
  | 'PROJECT_REPORT'
  | 'THESIS_REPORT'
  | 'INTERNSHIP_REPORT';

export interface RecordTypeSpec {
  key: RecordType;
  label: string;
  /** Subject-level weight per Framework "During Program" table. */
  weightPct: number;
  /** Scale of a single entry on the paper booklet (marks per experiment/task). */
  perEntryMax: number;
  /** Human-readable normalization formula actually applied. */
  normalization: string;
  /** Rubric criteria that make up one entry's score. */
  rubric: { criterion: string; max: number }[];
  /** Does this record type accumulate per-entry rows (experiments/tasks/sessions)? */
  entryBased: boolean;
  /** Log hours per entry (Workshop / Production Unit — finding o). */
  hoursBased?: boolean;
}

export const RECORD_TYPES: Record<RecordType, RecordTypeSpec> = {
  CLASSROOM_LEARNING: {
    key: 'CLASSROOM_LEARNING',
    label: 'Record of Classroom Learning',
    weightPct: 10,
    perEntryMax: 100,
    normalization: 'Composite of Assignment + Presentation + Mid-Sem + Record, scaled to 10%.',
    rubric: [
      { criterion: 'Assignment', max: 25 },
      { criterion: 'Presentation', max: 25 },
      { criterion: 'Mid-Sem Exam', max: 25 },
      { criterion: 'Record', max: 25 },
    ],
    entryBased: false,
  },
  APPLIED_ACTION_LEARNING: {
    key: 'APPLIED_ACTION_LEARNING',
    label: 'Record of Applied and Action Learning',
    weightPct: 20,
    perEntryMax: 50,
    normalization: 'Average of all experiments (each /50), then scaled: avg / 50 × 20.',
    rubric: [
      { criterion: 'Concept', max: 10 },
      { criterion: 'Planning & Execution', max: 10 },
      { criterion: 'Result & Interpretation', max: 10 },
      { criterion: 'Record', max: 10 },
      { criterion: 'Viva', max: 10 },
    ],
    entryBased: true,
  },
  ACTION_LEARNING: {
    key: 'ACTION_LEARNING',
    label: 'Record of Action Learning',
    weightPct: 30,
    perEntryMax: 100,
    normalization: 'Average of all tasks (each /100), then scaled: avg / 100 × 30.',
    rubric: [
      { criterion: 'Critical Thinking / Fieldwork / Report', max: 50 },
      { criterion: 'Presentation & Viva', max: 50 },
    ],
    entryBased: true,
    hoursBased: true,
  },
  PROJECT_REPORT: {
    key: 'PROJECT_REPORT',
    label: 'Project Report',
    weightPct: 30,
    perEntryMax: 30,
    normalization: 'Single deliverable scored /30; maps directly to the 30% weight.',
    rubric: [
      { criterion: 'Problem & Objectives', max: 6 },
      { criterion: 'Methodology', max: 6 },
      { criterion: 'Implementation', max: 6 },
      { criterion: 'Results', max: 6 },
      { criterion: 'Report & Viva', max: 6 },
    ],
    entryBased: false,
  },
  THESIS_REPORT: {
    key: 'THESIS_REPORT',
    label: 'Thesis Report',
    weightPct: 30,
    perEntryMax: 30,
    normalization: 'Single deliverable scored /30; maps directly to the 30% weight.',
    rubric: [
      { criterion: 'Literature & Gap', max: 6 },
      { criterion: 'Methodology', max: 6 },
      { criterion: 'Contribution', max: 6 },
      { criterion: 'Publication', max: 6 },
      { criterion: 'Defense', max: 6 },
    ],
    entryBased: false,
  },
  INTERNSHIP_REPORT: {
    key: 'INTERNSHIP_REPORT',
    label: 'Internship Report',
    weightPct: 30,
    perEntryMax: 30,
    normalization: 'Internal (50%) + External (50%) combined, scaled to the 30% weight.',
    rubric: [
      { criterion: 'Attendance & Conduct', max: 6 },
      { criterion: 'Task Completion', max: 6 },
      { criterion: 'Learning Outcomes', max: 6 },
      { criterion: 'Industry Feedback', max: 6 },
      { criterion: 'Report & Viva', max: 6 },
    ],
    entryBased: false,
  },
};

// The twelve subject configurations → the record type(s) each requires.
export interface CombinationSpec {
  code: CombinationCode;
  label: string;
  records: RecordType[];
}

export const COMBINATIONS: Record<CombinationCode, CombinationSpec> = {
  THEORY: { code: 'THEORY', label: 'Theory', records: ['CLASSROOM_LEARNING'] },
  MOOC: { code: 'MOOC', label: 'MOOC', records: ['CLASSROOM_LEARNING'] },
  THEORY_MOOC: {
    code: 'THEORY_MOOC',
    label: 'Theory + MOOC',
    records: ['CLASSROOM_LEARNING'],
  },
  PRACTICE: { code: 'PRACTICE', label: 'Practice', records: ['APPLIED_ACTION_LEARNING'] },
  WORKSHOP: {
    code: 'WORKSHOP',
    label: 'Workshop / Production Unit',
    records: ['ACTION_LEARNING'],
  },
  PROJECT: { code: 'PROJECT', label: 'Project', records: ['PROJECT_REPORT'] },
  THESIS: { code: 'THESIS', label: 'Thesis', records: ['THESIS_REPORT'] },
  INTERNSHIP: { code: 'INTERNSHIP', label: 'Internship', records: ['INTERNSHIP_REPORT'] },
  THEORY_PRACTICE: {
    code: 'THEORY_PRACTICE',
    label: 'Theory + Practice',
    records: ['CLASSROOM_LEARNING', 'APPLIED_ACTION_LEARNING'],
  },
  THEORY_PROJECT: {
    code: 'THEORY_PROJECT',
    label: 'Theory + Project',
    records: ['CLASSROOM_LEARNING', 'PROJECT_REPORT'],
  },
  THEORY_PRACTICE_PROJECT: {
    code: 'THEORY_PRACTICE_PROJECT',
    label: 'Theory + Practice + Project',
    records: ['CLASSROOM_LEARNING', 'APPLIED_ACTION_LEARNING', 'PROJECT_REPORT'],
  },
  PRACTICE_PROJECT: {
    code: 'PRACTICE_PROJECT',
    label: 'Practice + Project',
    records: ['APPLIED_ACTION_LEARNING', 'PROJECT_REPORT'],
  },
};

export function requiredRecordTypes(code: CombinationCode): RecordType[] {
  return COMBINATIONS[code]?.records ?? [];
}

/**
 * Normalize an average per-entry score into the subject-level weighted mark.
 * Returns marks out of `weightPct` (e.g. 20 → the record contributes /20 to the subject).
 * This is recommendation (e): the formula is explicit and configurable, not implicit.
 */
export function normalizeToWeight(
  recordType: RecordType,
  average: number,
  overridePerEntryMax?: number,
  overrideWeightPct?: number
): { normalized: number; note: string } {
  const spec = RECORD_TYPES[recordType];
  const perEntryMax = overridePerEntryMax ?? spec.perEntryMax;
  const weightPct = overrideWeightPct ?? spec.weightPct;
  const normalized = perEntryMax > 0 ? (average / perEntryMax) * weightPct : 0;
  const note = `avg ${average.toFixed(1)} / ${perEntryMax} × ${weightPct} = ${normalized.toFixed(2)} (of ${weightPct}%)`;
  return { normalized: Number(normalized.toFixed(2)), note };
}

// Plagiarism thresholds are configurable per document type (findings j).
// Thesis carries the mandatory 20% Turnitin cap; others default to 30%.
export const PLAGIARISM_THRESHOLDS: Record<string, number> = {
  PG_THESIS: 20,
  MAJOR_PROJECT: 30,
  MINOR_PROJECT: 30,
  INTERNSHIP: 30,
  DEFAULT: 30,
};

// The Annual Record 5-criterion, 100-mark rubric (findings c / 2.5).
export const ANNUAL_RUBRIC = [
  { key: 'coverageCourses', label: 'Coverage of Courses', max: 20 },
  { key: 'coverageComponents', label: 'Coverage of Components', max: 20 },
  { key: 'qualityContent', label: 'Quality of Content', max: 20 },
  { key: 'aesthetics', label: 'Aesthetics', max: 20 },
  { key: 'presentation', label: 'Presentation & Discussion', max: 20 },
] as const;

// The university's six campuses (finding p).
export const CAMPUSES = [
  { name: 'Paralakhemundi', code: 'PKD' },
  { name: 'Bhubaneswar', code: 'BBS' },
  { name: 'Balangir', code: 'BLG' },
  { name: 'Rayagada', code: 'RYG' },
  { name: 'Balasore', code: 'BLS' },
  { name: 'Chatrapur', code: 'CTP' },
];

export const ALR_CREDITS_PER_YEAR = 1; // 1 credit/year, Compulsory Basket (finding f)

export const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  MENTOR: 'Mentor',
  HOD: 'Head of Department',
  DEAN: 'Dean',
  ADMIN: 'Administrator',
  INDUSTRY_SUPERVISOR: 'Industry Supervisor',
};

export const RECORD_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  REVISION: 'Needs revision',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  FLAGGED: 'Flagged',
};
