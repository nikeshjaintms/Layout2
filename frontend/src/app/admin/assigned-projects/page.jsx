'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { Folder } from 'lucide-react';

export default function AdminAssignedProjects() {
  const projects = [
    { id: 1, name: 'Techomax HQ Layout', status: 'In Progress', plots: 145 },
    { id: 2, name: 'Phase 2 Expansion', status: 'Planning', plots: 80 },
  ];

  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'project' }}>
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-wide uppercase drop-shadow-md">
          Assigned Projects
        </h1>
        <p className="text-[#8ba0b8] mt-2 font-medium">
          View all projects assigned to your administration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#131828]/90 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00c8ff] group-hover:bg-[#00c8ff]/10 group-hover:border-[#00c8ff]/30 transition-colors">
                <Folder size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{project.name}</h3>
                <p className="text-xs text-[#8ba0b8] uppercase tracking-wider font-bold mt-1">ID: {project.id}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#8ba0b8] uppercase tracking-widest">Status</span>
                <span className="text-sm font-bold text-white mt-1">{project.status}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-[#8ba0b8] uppercase tracking-widest">Plots</span>
                <span className="text-sm font-bold text-[#00c8ff] mt-1">{project.plots}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
      </AuthGuard>
  );
}
