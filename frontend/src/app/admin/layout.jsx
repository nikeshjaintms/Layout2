'use client';
import AdminSidebaar from '@/components/admin/AdminSidebaar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AdminLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex flex-col md:flex-row h-screen bg-[#FDF6ED] text-gray-900 overflow-hidden font-sans">
        <AdminSidebaar />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <AdminNavbar />
          <div className="flex-1 relative">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
