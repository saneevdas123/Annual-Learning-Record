import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { createRecord } from '../actions';
import { RECORD_TYPES, requiredRecordTypes, COMBINATIONS, type RecordType } from '@/lib/domain';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: { courseId?: string; type?: string };
}) {
  const user = await requireRole('STUDENT');
  const courseId = searchParams.courseId;
  const type = searchParams.type as RecordType | undefined;

  // The set of courses the student can file against.
  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id },
    include: { course: true },
  });

  const selectedCourse = courseId
    ? enrollments.find((e) => e.course.id === courseId)?.course
    : undefined;

  const availableTypes = selectedCourse
    ? requiredRecordTypes(selectedCourse.combinationCode as never)
    : [];
  const spec = type ? RECORD_TYPES[type] : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink">
        ← Back
      </Link>
      <PageHeader
        eyebrow="New entry"
        title="File a learning record"
        subtitle="Each course requires the record type(s) mapped to its Framework configuration."
      />

      <form action={createRecord} className="card space-y-5 p-6">
        <div>
          <label className="label">Course</label>
          <select name="courseId" defaultValue={courseId ?? ''} required className="field">
            <option value="" disabled>
              Select a course
            </option>
            {enrollments.map((e) => (
              <option key={e.course.id} value={e.course.id}>
                {e.course.code} — {e.course.title} ({COMBINATIONS[e.course.combinationCode as keyof typeof COMBINATIONS]?.label})
              </option>
            ))}
          </select>
          {!courseId && (
            <p className="mt-1.5 text-xs text-ink-muted">
              Tip: start from your dashboard to pre-select the exact record you need.
            </p>
          )}
        </div>

        <div>
          <label className="label">Record type</label>
          {selectedCourse ? (
            <select name="recordType" defaultValue={type ?? ''} required className="field">
              <option value="" disabled>
                Select a record type
              </option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {RECORD_TYPES[t].label} — weight {RECORD_TYPES[t].weightPct}%
                </option>
              ))}
            </select>
          ) : (
            <select name="recordType" defaultValue={type ?? ''} required className="field">
              {type && spec ? (
                <option value={type}>
                  {spec.label} — weight {spec.weightPct}%
                </option>
              ) : (
                <option value="" disabled>
                  Select a course first
                </option>
              )}
            </select>
          )}
          {spec && (
            <p className="mt-1.5 rounded-lg border border-brass-100 bg-brass-50 px-3 py-2 text-xs text-brass-600">
              Normalization: {spec.normalization}
            </p>
          )}
        </div>

        <div>
          <label className="label">Title</label>
          <input name="title" required className="field" placeholder="e.g. Data Structures — Lab Record" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            className="field min-h-[110px] resize-y"
            placeholder="Summarize what this record covers."
          />
        </div>

        <div>
          <label className="label">Books / manuals referred</label>
          <input name="booksReferred" className="field" placeholder="Optional — matches the booklet outcome sheet" />
        </div>

        <div className="flex justify-end">
          <button className="btn-primary">Create record</button>
        </div>
      </form>
    </div>
  );
}
