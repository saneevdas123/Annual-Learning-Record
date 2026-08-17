import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { createRecord } from '../actions';
import { RECORD_TYPES, requiredRecordTypes, COMBINATIONS, type RecordType } from '@/lib/domain';
import { PageHead } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; type?: string }>;
}) {
  const user = await requireRole('STUDENT');
  const sp = await searchParams;
  const courseId = sp.courseId;
  const type = sp.type as RecordType | undefined;

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
      <Link href="/dashboard" className="text-sm font-semibold text-ink/55 hover:text-ink">
        ← Back
      </Link>
      <PageHead
        eyebrow="New entry"
        title="File a learning record"
        subtitle="Each course requires the record type(s) mapped to its Framework configuration."
      />

      {!user.eDeclarationAt && (
        <div className="ui-callout-warn p-4 text-sm">
          Accept the academic integrity declaration on your{' '}
          <Link href="/profile" className="font-semibold underline">
            profile
          </Link>{' '}
          before creating a record.
        </div>
      )}

      <form action={createRecord} className="card p-5 sm:p-6 space-y-5">
        <div>
          <label className="label">Course</label>
          <select name="courseId" defaultValue={courseId ?? ''} required className="input">
            <option value="" disabled>
              Select a course
            </option>
            {enrollments.map((e) => (
              <option key={e.course.id} value={e.course.id}>
                {e.course.code} — {e.course.title} (
                {COMBINATIONS[e.course.combinationCode as keyof typeof COMBINATIONS]?.label})
              </option>
            ))}
          </select>
          {!courseId && (
            <p className="ui-field-hint">Tip: start from your dashboard to pre-select the exact record you need.</p>
          )}
        </div>

        <div>
          <label className="label">Record type</label>
          {selectedCourse ? (
            <select name="recordType" defaultValue={type ?? ''} required className="input">
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
            <select name="recordType" defaultValue={type ?? ''} required className="input">
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
          {spec && <p className="ui-callout-soft mt-2 px-3 py-2 text-xs">Normalization: {spec.normalization}</p>}
        </div>

        <div>
          <label className="label">Title</label>
          <input name="title" required className="input" placeholder="e.g. Data Structures — Lab Record" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea name="description" className="input" placeholder="Summarize what this record covers." />
        </div>

        <div>
          <label className="label">
            Books / manuals referred <span className="ui-field-optional">optional</span>
          </label>
          <input name="booksReferred" className="input" placeholder="Matches the booklet outcome sheet" />
        </div>

        <div className="flex justify-end">
          <button className="btn-primary" disabled={!user.eDeclarationAt}>
            Create record
          </button>
        </div>
      </form>
    </div>
  );
}
