'use client';
import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, deleteUser, clearCreateError } from '@/redux/slices/usersSlice';
import Swal from 'sweetalert2';
import Link from 'next/link';
import Pagination from '@/components/common/Pagination';
import { Can } from '@/lib/ability';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AdminUsers() {
  const dispatch = useDispatch();
  const { items: users, pagination, loading, error } = useSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(fetchUsers({ page: currentPage, limit, search: debouncedSearch }));
  }, [dispatch, debouncedSearch, currentPage, limit]);

  const handleDeleteClick = async (id) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      text: 'Are you sure you want to delete this user? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Yes, Delete',
      background: '#18181b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteUser(id)).unwrap();
        Swal.fire({
          title: 'Deleted!',
          text: 'User has been deleted.',
          icon: 'success',
          background: '#18181b',
          color: '#fff'
        });
        dispatch(fetchUsers({ page: currentPage, limit, search: debouncedSearch }));
      } catch (err) {
        Swal.fire({
          title: 'Error!',
          text: err.message || 'Failed to delete user.',
          icon: 'error',
          background: '#18181b',
          color: '#fff'
        });
      }
    }
  };

  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'user' }}>
      <div className="p-4 md:p-8 flex flex-col h-full overflow-y-auto relative w-full font-sans text-slate-300">
        {/* Subtle background pattern (from plot manage theme) */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1 flex flex-col relative z-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Users
            </h1>
            <p className="text-xs sm:text-sm text-[#8ba0b8] font-medium mt-1">
              Manage user accounts and roles.
            </p>
          </div>
          <div className="flex sm:gap-4 w-full sm:w-auto">
            <Can I="create" a="user">
              <Link 
                href="/admin/users/add"
                onClick={() => dispatch(clearCreateError())}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#00c8ff] hover:bg-[#00b0e6] text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <UserPlus size={18} strokeWidth={2.5} />
                <span>Add New User</span>
              </Link>
            </Can>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center bg-[#1d2440]/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
          <div className="relative flex-1 w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ba0b8] group-focus-within:text-[#00c8ff] transition-colors" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by email..."
              className="w-full pl-11 pr-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all text-white placeholder-[#8ba0b8] font-medium"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#1d2440]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col transition-all">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1d2440] border-b border-white/10 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px]">Name</th>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px]">Email</th>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px]">Role</th>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#8ba0b8]">
                      Loading users...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#8ba0b8]">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-all duration-200 group">
                      <td className="px-6 py-5 font-semibold text-white">{user.name || '-'}</td>
                      <td className="px-6 py-5 text-[#8ba0b8] font-medium">{user.email}</td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm inline-flex items-center justify-center min-w-[80px] bg-[#0f111a] border border-[#00c8ff]/30 text-[#00c8ff]">
                          {user.role?.name || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Can I="edit" a="user">
                            <Link 
                              href={`/admin/users/edit/${user.id}`}
                              className="p-2 text-[#8ba0b8] hover:text-[#00c8ff] bg-white/5 border border-white/10 hover:border-[#00c8ff]/50 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(0,200,255,0.1)]"
                              title="Edit User"
                            >
                              <Edit2 size={15} />
                            </Link>
                          </Can>
                          <Can I="delete" a="user">
                            <button 
                              onClick={() => handleDeleteClick(user.id)}
                              className="p-2 text-[#8ba0b8] hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/50 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                              title="Delete User"
                            >
                              <Trash2 size={15} />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {!loading && !error && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalRecords={pagination.total}
              limit={limit}
              onPageChange={setCurrentPage}
              itemName="users"
              theme="dark"
            />
          )}
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}
