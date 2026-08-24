'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { Suspense } from 'react';
import AmenityForm from '@/components/masters/amenities/AmenityForm';

export default function AddAmenityPage() {
  return (
    <AuthGuard requirePermission={{ action: 'create', subject: 'amenity' }}>
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading form...</div>}>
      <AmenityForm />
    </Suspense>
      </AuthGuard>
  );
}
