'use client';

import { useMemo, useState } from 'react';
import { ROLE_LABELS } from '@/lib/domain';
import { createUser } from './actions';
import { SelectField, TextField } from './AdminForms';
import { AddButton, CreateModal, useCreateModal } from './CreateModal';

const ROLES = Object.entries(ROLE_LABELS).filter(([k]) => k !== 'INDUSTRY_SUPERVISOR');

type Opt = { id: string; name: string; campusId?: string; departmentId?: string };

export function PersonCreateForm({
  campuses,
  departments,
  programs,
  mentors,
}: {
  campuses: Opt[];
  departments: Opt[];
  programs: Opt[];
  mentors: { id: string; name: string }[];
}) {
  const modal = useCreateModal();
  const [role, setRole] = useState('STUDENT');
  const [campusId, setCampusId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const student = role === 'STUDENT';

  const depts = useMemo(
    () => departments.filter((d) => !campusId || d.campusId === campusId),
    [departments, campusId]
  );
  const progs = useMemo(
    () => programs.filter((p) => !departmentId || p.departmentId === departmentId),
    [programs, departmentId]
  );

  return (
    <>
      <AddButton label="Add person" onClick={modal.openModal} />
      <CreateModal
        open={modal.open}
        onClose={() => {
          modal.closeModal();
          setRole('STUDENT');
          setCampusId('');
          setDepartmentId('');
        }}
        title="Add person"
        description="A temporary password is emailed. They choose their own on first sign-in."
        action={createUser}
        success="Account created and credentials emailed."
        submitLabel="Create account"
        wide
      >
        <TextField label="Full name" name="name" required />
        <TextField label="Email" name="email" type="email" required placeholder="name@cutm.ac.in" />
        <SelectField
          label="Role"
          name="role"
          required
          value={role}
          onChange={setRole}
          options={ROLES.map(([k, v]) => ({ value: k, label: v }))}
        />
        {student ? (
          <TextField label="Registration number" name="registrationNumber" placeholder="Used on the booklet" />
        ) : null}
        <SelectField
          label="Campus"
          name="campusId"
          value={campusId}
          onChange={(v) => {
            setCampusId(v);
            setDepartmentId('');
          }}
          options={campuses.map((c) => ({ value: c.id, label: c.name }))}
          empty="Not placed yet"
        />
        <SelectField
          label="Department"
          name="departmentId"
          value={departmentId}
          onChange={setDepartmentId}
          disabled={!campusId}
          empty={campusId ? 'Not placed yet' : 'Choose a campus first'}
          options={depts.map((d) => ({ value: d.id, label: d.name }))}
        />
        {student ? (
          <>
            <SelectField
              label="Program"
              name="programId"
              disabled={!departmentId}
              empty={departmentId ? 'Not placed yet' : 'Choose a department first'}
              options={progs.map((p) => ({ value: p.id, label: p.name }))}
            />
            <SelectField
              label="Mentor"
              name="mentorId"
              options={mentors.map((m) => ({ value: m.id, label: m.name }))}
              empty="Assign later"
              hint={mentors.length === 0 ? 'Add a mentor role first, then come back.' : undefined}
            />
          </>
        ) : null}
        <TextField
          label="Temporary password"
          name="password"
          placeholder="Leave blank to generate and email"
          hint="They must change this on first sign-in."
        />
      </CreateModal>
    </>
  );
}
