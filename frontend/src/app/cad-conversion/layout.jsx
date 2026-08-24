'use client';
import AuthGuard from '@/components/auth/AuthGuard';

export default function CadConversionLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
