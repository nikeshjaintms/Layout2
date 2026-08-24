import React from 'react';
import UserProjectMap from '@/components/user/UserProjectMap';

export const metadata = {
  title: 'Techomax Solution',
  description: 'View the project location and boundaries on the map.',
};

export default async function ProjectMapRoute({ params }) {
  const resolvedParams = await params;
  return <UserProjectMap projectId={resolvedParams.projectId} />;
}
