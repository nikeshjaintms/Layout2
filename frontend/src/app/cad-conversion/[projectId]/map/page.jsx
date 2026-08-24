import ProjectBoundaryWorkspace from '@/components/cad-conversion/ProjectBoundaryWorkspace';

export const metadata = {
  title: 'Techomax Solutions',
};

export default async function ProjectMapPage({ params }) {
  const { projectId } = await params;
  return <ProjectBoundaryWorkspace projectId={projectId} />;
}

