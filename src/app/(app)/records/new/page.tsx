import Link from 'next/link';
import { requireRole } from '@/lib/session';
import { db } from '@/lib/db';
import { type RecordType } from '@/lib/domain';
import { EmptyState, PageHead } from '@/components/ui';
import { NewRecordForm } from '../NewRecordForm';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMeta({
  title: 'File a learning record',
  description: 'Start a new Annual Learning Record for a course you are enrolled in.',
  path: '/records/new',
});

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; type?: string }>;
}) {
  const user = await requireRole('STUDENT');
  const sp = await searchParams;

  const enrollments = await db.enrollment.findMany({
    where: { studentId: user.id },
    include: { course: true },
  });

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

      {enrollments.length === 0 ? (
        <EmptyState
          title="No courses yet"
          message="Once you are enrolled, the required record types appear here automatically."
          action={
            <Link href="/courses" className="btn-primary">
              Browse courses
            </Link>
          }
        />
      ) : (
        <NewRecordForm
          courses={enrollments.map((e) => ({
            id: e.course.id,
            code: e.course.code,
            title: e.course.title,
            combinationCode: e.course.combinationCode,
          }))}
          initialCourseId={sp.courseId}
          initialType={sp.type as RecordType | undefined}
          canSubmit={!!user.eDeclarationAt}
        />
      )}
    </div>
  );
}
