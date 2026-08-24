'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createUser, clearCreateError } from '@/redux/slices/usersSlice';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminAddUser() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isCreating, createError } = useSelector((state) => state.users);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    import('@/lib/api').then(api => {
      api.apiCall('/admin/roles').then(setRoles).catch(console.error);
    });
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: ''
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    dispatch(clearCreateError());
    try {
      await dispatch(createUser(formData)).unwrap();
      Swal.fire({
        icon: 'success',
        title: 'User Created',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#00c8ff'
      });
      router.push('/admin/users');
    } catch (err) {
      // Error is handled in Redux state
    }
  };

  return (
    <AuthGuard requirePermission={{ action: 'create', subject: 'user' }}>
    <div className="p-4 md:p-8 flex flex-col h-full overflow-y-auto relative w-full font-sans text-slate-300">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-6 w-full flex-1 flex flex-col relative z-10">
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-5">
            <Link 
              href="/admin/users"
              className="p-2.5 bg-[#1d2440] border border-white/10 hover:border-[#00c8ff]/50 rounded-xl transition-all duration-300 text-slate-400 hover:text-[#00c8ff] shadow-lg group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Add User</h1>
              <p className="text-[#8ba0b8] font-medium mt-1">Create a new user account.</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="relative border border-white/10 p-6 rounded-2xl bg-[#1d2440]/60 backdrop-blur-md shadow-xl transition-all hover:border-white/20">
            {createError && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm font-medium">
                {createError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-6">
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" 
                  placeholder="John Doe" 
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" 
                  placeholder="john@example.com" 
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Password *</label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" 
                  placeholder="Password@123" 
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Role *</label>
                <select 
                  value={formData.roleId}
                  onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled className="bg-[#0f111a] text-gray-500">Select a Role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id} className="bg-[#0f111a] text-white">{r.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          <div className="pt-8 flex justify-end gap-4 border-t border-white/10 mt-8">
            <Link href="/admin/users" className="px-6 py-2.5 text-sm font-bold text-[#8ba0b8] hover:text-white transition-colors bg-[#1d2440] border border-white/10 hover:border-white/30 rounded-xl shadow-lg">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isCreating || !formData.email || !formData.password}
              className="px-6 py-2.5 bg-[#00c8ff] hover:bg-[#00b0e6] disabled:opacity-50 text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 flex justify-center items-center gap-2"
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : null}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
      </AuthGuard>
  );
}
