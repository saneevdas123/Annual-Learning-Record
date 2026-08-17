'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';
import { createCampus, createDepartment, createProgram } from './actions';
import { SelectField, TextField } from './AdminForms';
import { AddButton, CreateModal, useCreateModal } from './CreateModal';

type Campus = { id: string; name: string; code: string };
type Department = { id: string; name: string; campus: { name: string } };
type Program = { id: string; name: string; degree: string; durationYears: number; department: { name: string } };

export function OrgWorkspace({
  campuses,
  departments,
  programs,
}: {
  campuses: Campus[];
  departments: Department[];
  programs: Program[];
}) {
  const campus = useCreateModal();
  const dept = useCreateModal();
  const program = useCreateModal();

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <ListCard
          title={`Campuses (${campuses.length})`}
          empty="No campuses yet."
          action={<AddButton label="Add campus" onClick={campus.openModal} />}
        >
          {campuses.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="font-semibold text-ink">{c.name}</span>
              <Badge tone="muted">{c.code}</Badge>
            </li>
          ))}
        </ListCard>

        <ListCard
          title={`Departments (${departments.length})`}
          empty="No departments yet."
          action={
            <AddButton
              label="Add department"
              disabled={campuses.length === 0}
              onClick={dept.openModal}
            />
          }
        >
          {departments.map((d) => (
            <li key={d.id} className="px-4 py-2.5">
              <p className="font-semibold text-ink">{d.name}</p>
              <p className="text-[11px] text-ink/45">{d.campus.name}</p>
            </li>
          ))}
        </ListCard>

        <ListCard
          title={`Programs (${programs.length})`}
          empty="No programs yet."
          action={
            <AddButton
              label="Add program"
              disabled={departments.length === 0}
              onClick={program.openModal}
            />
          }
        >
          {programs.map((p) => (
            <li key={p.id} className="px-4 py-2.5">
              <p className="font-semibold text-ink">{p.name}</p>
              <p className="text-[11px] text-ink/45">
                {p.degree} · {p.durationYears} yr · {p.department.name}
              </p>
            </li>
          ))}
        </ListCard>
      </div>

      <CreateModal
        open={campus.open}
        onClose={campus.closeModal}
        title="Add campus"
        description="A short code like PKD or BBS."
        action={createCampus}
        success="Campus added."
        submitLabel="Create campus"
      >
        <TextField label="Campus name" name="name" placeholder="e.g. Paralakhemundi" required />
        <TextField label="Code" name="code" placeholder="PKD" required />
      </CreateModal>

      <CreateModal
        open={dept.open}
        onClose={dept.closeModal}
        title="Add department"
        description={campuses.length === 0 ? 'Create a campus first.' : 'Belongs to one campus.'}
        action={createDepartment}
        success="Department added."
        submitLabel="Create department"
      >
        <SelectField
          label="Campus"
          name="campusId"
          required
          options={campuses.map((c) => ({ value: c.id, label: c.name }))}
        />
        <TextField label="Department name" name="name" placeholder="e.g. Computer Science" required />
      </CreateModal>

      <CreateModal
        open={program.open}
        onClose={program.closeModal}
        title="Add program"
        description={departments.length === 0 ? 'Create a department first.' : 'Students attach to a program.'}
        action={createProgram}
        success="Program added."
        submitLabel="Create program"
      >
        <SelectField
          label="Department"
          name="departmentId"
          required
          options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.campus.name})` }))}
        />
        <TextField label="Program name" name="name" placeholder="e.g. B.Tech CSE" required />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Degree"
            name="degree"
            defaultValue="UG"
            options={[
              { value: 'UG', label: 'UG' },
              { value: 'PG', label: 'PG' },
              { value: 'Diploma', label: 'Diploma' },
            ]}
          />
          <TextField label="Years" name="durationYears" type="number" defaultValue="4" />
        </div>
      </CreateModal>
    </>
  );
}

function ListCard({
  title,
  empty,
  action,
  children,
}: {
  title: string;
  empty: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
        <h3 className="font-bold text-ink">{title}</h3>
        {action}
      </div>
      {items.filter(Boolean).length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-ink/45">{empty}</p>
      ) : (
        <ul className="divide-y divide-ink/10">{children}</ul>
      )}
    </div>
  );
}
