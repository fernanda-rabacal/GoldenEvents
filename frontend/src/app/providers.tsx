'use client';

import type { ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import { AuthContextProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthContextProvider>
      {children}
      <ToastContainer />
    </AuthContextProvider>
  );
}
