import CadConversionStudio from '@/components/cad-conversion/CadConversionStudio';

export const metadata = {
  title: 'Techomax Solution',
};

export default async function ProjectDashboardPage({ params }) {
  const { projectId } = await params;
  return <CadConversionStudio projectId={projectId} />;
}
