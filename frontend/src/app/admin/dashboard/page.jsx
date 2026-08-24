'use client';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AdminDashboard() {
  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'dashboard' }}>
      <div className="p-8 h-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-wide uppercase drop-shadow-md">
            Dashboard
          </h1>
          <p className="text-[#8ba0b8] mt-2 font-medium">
            Welcome to the Techomax Admin Panel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder Stat Cards */}
          {[
            { label: 'Total Users', value: '14' },
            { label: 'Active Projects', value: '3' },
            { label: 'Pending Reviews', value: '7' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#131828]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-[#8ba0b8] uppercase tracking-wider mb-2">{stat.label}</h3>
              <p className="text-4xl font-black text-[#00c8ff]">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
