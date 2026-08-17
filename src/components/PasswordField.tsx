'use client';

import { useState, type ChangeEventHandler } from 'react';

export function PasswordField({
  id,
  name = 'password',
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder = '••••••••',
  disabled,
}: {
  id: string;
  name?: string;
  label: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          className="input pr-12"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 px-3 flex items-center text-ink/55 hover:text-ink"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10.6 10.7a2 2 0 002.8 2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M9.9 5.1A10.8 10.8 0 0112 5c5.2 0 9.2 3.4 10.5 7-.4 1.1-1 2.1-1.8 3M6.1 6.1C4 7.6 2.6 9.6 1.5 12c1.3 3.6 5.3 7 10.5 7 1.4 0 2.7-.2 3.9-.7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M1.5 12C2.8 8.4 6.8 5 12 5s9.2 3.4 10.5 7c-1.3 3.6-5.3 7-10.5 7S2.8 15.6 1.5 12z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
