'use client';

import { enrollStudent } from './actions';
import { SelectField } from './AdminForms';
import { AddButton, CreateModal, useCreateModal } from './CreateModal';

export function EnrollCreateForm({
  students,
  courses,
}: {
  students: { id: string; name: string; registrationNumber: string | null }[];
  courses: { id: string; code: string; title: string }[];
}) {
  const modal = useCreateModal();
  const blocked = students.length === 0 || courses.length === 0;

  return (
    <>
      <AddButton label="Enroll student" disabled={blocked} onClick={modal.openModal} />
      <CreateModal
        open={modal.open}
        onClose={modal.closeModal}
        title="Enroll a student"
        description="Required records appear on their dashboard as soon as they are enrolled."
        action={enrollStudent}
        success="Student enrolled."
        submitLabel="Enroll"
      >
        {blocked ? (
          <p className="ui-callout-warn px-3 py-2 text-sm">
            {students.length === 0 ? 'Add students on the People tab first.' : 'Create a course first.'}
          </p>
        ) : null}
        <SelectField
          label="Student"
          name="studentId"
          required
          options={students.map((s) => ({
            value: s.id,
            label: `${s.name}${s.registrationNumber ? ` (${s.registrationNumber})` : ''}`,
          }))}
        />
        <SelectField
          label="Course"
          name="courseId"
          required
          options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.title}` }))}
        />
      </CreateModal>
    </>
  );
}
