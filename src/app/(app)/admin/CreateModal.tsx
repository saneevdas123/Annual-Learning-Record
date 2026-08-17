'use client';

import { useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui';
import { ActionForm } from '@/components/ActionForm';

export function CreateModal({
  open,
  onClose,
  title,
  description,
  action,
  success,
  submitLabel,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  action: (fd: FormData) => Promise<void>;
  success: string;
  submitLabel: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} wide={wide}>
      <ActionForm
        action={async (fd) => {
          await action(fd);
          onClose();
        }}
        success={success}
        className="space-y-3"
      >
        {children}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">{submitLabel}</button>
        </div>
      </ActionForm>
    </Modal>
  );
}

export function AddButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="btn-primary !py-2 !px-3 text-sm" disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}

export function useCreateModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}
