'use client';

import { useMemo, useState } from 'react';
import { ActionForm } from '@/components/ActionForm';
import { RECORD_TYPES, requiredRecordTypes, COMBINATIONS, type RecordType } from '@/lib/domain';
import { createRecord } from './actions';

type CourseOpt = {
  id: string;
  code: string;
  title: string;
  combinationCode: string;
};

export function NewRecordForm({
  courses,
  initialCourseId,
  initialType,
  canSubmit,
}: {
  courses: CourseOpt[];
  initialCourseId?: string;
  initialType?: RecordType;
  canSubmit: boolean;
}) {
  const [courseId, setCourseId] = useState(initialCourseId ?? '');
  const [recordType, setRecordType] = useState(initialType ?? '');

  const selected = courses.find((c) => c.id === courseId);
  const types = useMemo(
    () => (selected ? requiredRecordTypes(selected.combinationCode as never) : []),
    [selected]
  );
  const spec = recordType ? RECORD_TYPES[recordType as RecordType] : undefined;

  return (
    <ActionForm action={createRecord} success="Record created." className="card p-5 sm:p-6 space-y-5">
      <div>
        <label className="label" htmlFor="new-course">
          Course
        </label>
        <select
          id="new-course"
          name="courseId"
          required
          className="input"
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setRecordType('');
          }}
        >
          <option value="" disabled>
            Select a course
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title} ({COMBINATIONS[c.combinationCode as keyof typeof COMBINATIONS]?.label})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="new-type">
          Record type
        </label>
        <select
          id="new-type"
          name="recordType"
          required
          className="input"
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
          disabled={!selected}
        >
          <option value="" disabled>
            {selected ? 'Select a record type' : 'Select a course first'}
          </option>
          {types.map((t) => (
            <option key={t} value={t}>
              {RECORD_TYPES[t].label} — weight {RECORD_TYPES[t].weightPct}%
            </option>
          ))}
        </select>
        {spec ? <p className="ui-callout-soft mt-2 px-3 py-2 text-xs">Normalization: {spec.normalization}</p> : null}
      </div>

      <div>
        <label className="label" htmlFor="new-title">
          Title
        </label>
        <input id="new-title" name="title" required className="input" placeholder="e.g. Data Structures — Lab Record" />
      </div>

      <div>
        <label className="label" htmlFor="new-desc">
          Description
        </label>
        <textarea id="new-desc" name="description" className="input" placeholder="Summarize what this record covers." />
      </div>

      <div>
        <label className="label" htmlFor="new-books">
          Books / manuals referred <span className="ui-field-optional">optional</span>
        </label>
        <input id="new-books" name="booksReferred" className="input" placeholder="Matches the booklet outcome sheet" />
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" disabled={!canSubmit}>
          Create record
        </button>
      </div>
    </ActionForm>
  );
}
