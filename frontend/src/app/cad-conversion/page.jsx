import CadProjectList from '@/components/cad-conversion/CadProjectList';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata = {
  title: 'Techomax Solutions',
};

export default function CadProjectsPage() {
  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'conversion' }}>
      <CadProjectList />
    </AuthGuard>
  );
}
