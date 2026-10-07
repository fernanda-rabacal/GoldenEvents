'use client';

import type { ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
