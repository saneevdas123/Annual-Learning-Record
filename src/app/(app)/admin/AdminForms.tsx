export function TextField({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {!required ? <span className="ui-field-optional">optional</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="input"
      />
      {hint ? <p className="ui-field-hint">{hint}</p> : null}
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  required,
  value,
  defaultValue,
  onChange,
  disabled,
  empty = 'Select…',
  hint,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  empty?: string;
  hint?: string;
}) {
  const id = `s-${name}`;
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        disabled={disabled || options.length === 0}
        className="input"
        {...(value != null
          ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value) }
          : { defaultValue: defaultValue ?? '' })}
      >
        <option value="" disabled>
          {options.length === 0 ? 'Nothing to choose yet' : empty}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <p className="ui-field-hint">{hint}</p> : null}
    </div>
  );
}

export function Submit({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end pt-1">
      <button className="btn-primary">{children}</button>
    </div>
  );
}

export function AdminSearch({
  tab,
  q,
  role,
  placeholder,
}: {
  tab: string;
  q?: string;
  role?: string;
  placeholder: string;
}) {
  return (
    <form method="get" className="flex flex-wrap gap-2">
      <input type="hidden" name="tab" value={tab} />
      <input
        name="q"
        defaultValue={q}
        className="input min-w-[12rem] flex-1"
        placeholder={placeholder}
        aria-label="Search"
      />
      {role != null ? (
        <select name="role" defaultValue={role} className="input !w-auto">
          <option value="">All roles</option>
          <option value="STUDENT">Students</option>
          <option value="FACULTY">Faculty</option>
          <option value="MENTOR">Mentors</option>
          <option value="HOD">HoDs</option>
          <option value="DEAN">Deans</option>
          <option value="ADMIN">Admins</option>
        </select>
      ) : null}
      <button className="btn-ghost" type="submit">
        Search
      </button>
    </form>
  );
}
