'use client';
import { use } from 'react';
import PlotStatusForm from '@/components/cad-conversion/plot-statuses/PlotStatusForm';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AddPlotStatusPage({ params }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId;
  
  return (
    <AuthGuard requirePermission={{ action: 'create', subject: 'status' }}>
      <PlotStatusForm projectId={projectId} />
    </AuthGuard>
  );
}
