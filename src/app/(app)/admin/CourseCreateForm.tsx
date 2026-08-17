'use client';

import { useMemo, useState } from 'react';
import { COMBINATIONS } from '@/lib/domain';
import { academicYearOptions } from '@/lib/utils';
import { createCourse } from './actions';
import { SelectField, TextField } from './AdminForms';
import { AddButton, CreateModal, useCreateModal } from './CreateModal';

type Opt = { id: string; name: string; campusId?: string; departmentId?: string };

export function CourseCreateForm({
  campuses,
  departments,
  programs,
  faculty,
}: {
  campuses: Opt[];
  departments: Opt[];
  programs: Opt[];
  faculty: { id: string; name: string }[];
}) {
  const modal = useCreateModal();
  const [campusId, setCampusId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const depts = useMemo(
    () => departments.filter((d) => !campusId || d.campusId === campusId),
    [departments, campusId]
  );
  const progs = useMemo(
    () => programs.filter((p) => !departmentId || p.departmentId === departmentId),
    [programs, departmentId]
  );

  const blocked = campuses.length === 0 || faculty.length === 0;

  return (
    <>
      <AddButton label="Add course" disabled={blocked} onClick={modal.openModal} />
      <CreateModal
        open={modal.open}
        onClose={() => {
          modal.closeModal();
          setCampusId('');
          setDepartmentId('');
        }}
        title="Create course"
        description="Campus, department, and program stay in the same tree. Faculty owns the first sign-off."
        action={createCourse}
        success="Course created."
        submitLabel="Create course"
        wide
      >
        {blocked ? (
          <p className="ui-callout-warn px-3 py-2 text-sm">
            {campuses.length === 0
              ? 'Add a campus, department, and program first.'
              : 'Add a faculty member on the People tab before you create a course.'}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Code" name="code" placeholder="CS201" required />
          <TextField label="Credits" name="credits" type="number" defaultValue="4" required />
        </div>
        <TextField label="Title" name="title" placeholder="Data Structures" required />
        <SelectField
          label="Subject configuration"
          name="combinationCode"
          required
          hint="This decides which learning records students must file."
          options={Object.values(COMBINATIONS).map((c) => ({ value: c.code, label: c.label }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Academic year"
            name="academicYear"
            required
            options={academicYearOptions().map((y) => ({ value: y, label: y }))}
          />
          <TextField label="Term" name="term" placeholder="Sem 3" required />
        </div>
        <SelectField
          label="Campus"
          name="campusId"
          required
          value={campusId}
          onChange={(v) => {
            setCampusId(v);
            setDepartmentId('');
          }}
          options={campuses.map((c) => ({ value: c.id, label: c.name }))}
        />
        <SelectField
          label="Department"
          name="departmentId"
          required
          value={departmentId}
          onChange={setDepartmentId}
          disabled={!campusId}
          empty={campusId ? 'Select…' : 'Choose a campus first'}
          options={depts.map((d) => ({ value: d.id, label: d.name }))}
        />
        <SelectField
          label="Program"
          name="programId"
          required
          disabled={!departmentId}
          empty={departmentId ? 'Select…' : 'Choose a department first'}
          options={progs.map((p) => ({ value: p.id, label: p.name }))}
        />
        <SelectField
          label="Faculty"
          name="facultyId"
          required
          options={faculty.map((f) => ({ value: f.id, label: f.name }))}
        />
      </CreateModal>
    </>
  );
}
