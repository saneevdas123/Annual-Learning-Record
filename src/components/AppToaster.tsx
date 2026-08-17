'use client';

import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={4000}
      offset={16}
      toastOptions={{ className: 'sonner-cutm' }}
      style={{ zIndex: 200 }}
    />
  );
}
