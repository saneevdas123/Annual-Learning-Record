'use client';

import { useMemo, useState } from 'react';
import { ROLE_LABELS } from '@/lib/domain';
import { initials } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { ActionForm } from '@/components/ActionForm';
import { assignMentor, resendCredentials, setUserActive, updateUserRole } from './actions';

type Opt = { id: string; name: string; campusId?: string; departmentId?: string };

export type AdminPerson = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  registrationNumber: string | null;
  campusId: string | null;
  departmentId: string | null;
  programId: string | null;
  mentorId: string | null;
  campus?: { name: string } | null;
  department?: { name: string } | null;
};

export function PersonEditor({
  person,
  campuses,
  departments,
  programs,
  mentors,
}: {
  person: AdminPerson;
  campuses: Opt[];
  departments: Opt[];
  programs: Opt[];
  mentors: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [campusId, setCampusId] = useState(person.campusId ?? '');
  const [departmentId, setDepartmentId] = useState(person.departmentId ?? '');
  const [role, setRole] = useState(person.role);

  const depts = useMemo(
    () => departments.filter((d) => !campusId || d.campusId === campusId),
    [departments, campusId]
  );
  const progs = useMemo(
    () => programs.filter((p) => !departmentId || p.departmentId === departmentId),
    [programs, departmentId]
  );

  const place = [person.campus?.name, person.department?.name].filter(Boolean).join(' · ');

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="shell-avatar !h-9 !w-9 text-xs">{initials(person.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {person.name}
            {person.registrationNumber ? (
              <span className="ml-2 text-[11px] font-bold text-ink/40">{person.registrationNumber}</span>
            ) : null}
          </p>
          <p className="truncate text-[11px] text-ink/45">{person.email}</p>
          {place ? <p className="mt-0.5 text-[11px] text-ink/50">{place}</p> : null}
        </div>
        <Badge tone={person.isActive ? 'blue' : 'red'}>{ROLE_LABELS[person.role]}</Badge>
        {!person.isActive ? <Badge tone="red">Inactive</Badge> : null}
        <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Edit'}
        </button>
      </div>

      {open ? (
        <div className="mt-3 space-y-3 rounded-neo border border-ink/10 bg-cream/50 p-3">
          <ActionForm action={updateUserRole} success="Placement saved." className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="userId" value={person.id} />
            <label className="block">
              <span className="label">Role</span>
              <select
                name="role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {Object.entries(ROLE_LABELS)
                  .filter(([k]) => k !== 'INDUSTRY_SUPERVISOR')
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Campus</span>
              <select
                name="campusId"
                className="input"
                value={campusId}
                onChange={(e) => {
                  setCampusId(e.target.value);
                  setDepartmentId('');
                }}
              >
                <option value="">Not placed</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Department</span>
              <select
                name="departmentId"
                className="input"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">{campusId ? 'Not placed' : 'Choose campus first'}</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            {role === 'STUDENT' ? (
              <label className="block">
                <span className="label">Program</span>
                <select name="programId" className="input" defaultValue={person.programId ?? ''}>
                  <option value="">{departmentId ? 'Not placed' : 'Choose department first'}</option>
                  {progs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="sm:col-span-2 flex justify-end">
              <button className="btn-primary !py-2 !px-4 text-sm">Save placement</button>
            </div>
          </ActionForm>

          {role === 'STUDENT' ? (
            <ActionForm action={assignMentor} success="Mentor assigned." className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="studentId" value={person.id} />
              <label className="min-w-[12rem] flex-1">
                <span className="label">Mentor</span>
                <select name="mentorId" className="input" defaultValue={person.mentorId ?? ''}>
                  <option value="">No mentor</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn-ghost !py-2">Assign</button>
            </ActionForm>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-3">
            <ActionForm action={resendCredentials} success="New password emailed.">
              <input type="hidden" name="userId" value={person.id} />
              <button className="btn-ghost !py-2 !px-3 text-xs">Email new password</button>
            </ActionForm>
            <ActionForm action={setUserActive} success={person.isActive ? 'Deactivated.' : 'Activated.'}>
              <input type="hidden" name="userId" value={person.id} />
              <input type="hidden" name="active" value={(!person.isActive).toString()} />
              <button className={person.isActive ? 'btn-ghost !py-2 !px-3 text-xs' : 'btn-primary !py-2 !px-3 text-xs'}>
                {person.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </ActionForm>
          </div>
        </div>
      ) : null}
    </li>
  );
}
