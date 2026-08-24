'use client';
import { use } from 'react';
import PlotForm from '@/components/cad-conversion/plots/PlotForm';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AddPlotPage({ params }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId;
  
  return (
    <AuthGuard requirePermission={{ action: 'create', subject: 'plot' }}>
      <PlotForm projectId={projectId} />
    </AuthGuard>
  );
}
