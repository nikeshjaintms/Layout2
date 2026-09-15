'use client';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AdminDashboard() {
  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'dashboard' }}>
      <div className="p-8 h-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-wide uppercase drop-shadow-md">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
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
            <div key={i} className="bg-white backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">{stat.label}</h3>
              <p className="text-4xl font-black text-[#ABD2FA]">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
