'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserById, updateUser, clearCreateError } from '@/redux/slices/usersSlice';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function AdminEditUser() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { currentUser, loading, error, createError } = useSelector((state) => state.users);
  
  const [roles, setRoles] = useState([]);
  
  useEffect(() => {
    import('@/lib/api').then(api => {
      api.apiCall('/admin/roles').then(setRoles).catch(console.error);
    });
  }, []);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validatePasswordRules = (pwd) => ({
    capital: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    noWhitespace: pwd.length > 0 && !/\s/.test(pwd),
    minLength: pwd.length >= 8,
    notEmpty: pwd.length > 0
  });

  const pwdRules = validatePasswordRules(formData.password);

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email,
        password: '', // Blank password means do not update
        roleId: currentUser.role?.id || ''
      });
    }
  }, [currentUser]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    dispatch(clearCreateError());
    
    const newErrors = {};
    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    
    if (!cleanName) newErrors.name = 'Full Name cannot be empty.';
    
    if (!cleanEmail) {
      newErrors.email = 'Email cannot be empty.';
    } else if (/\s/.test(cleanEmail)) {
      newErrors.email = 'Whitespace is not allowed in Email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.roleId) newErrors.roleId = 'Please select a role.';

    if (formData.password) {
      if (!pwdRules.capital || !pwdRules.number || !pwdRules.special || !pwdRules.noWhitespace || !pwdRules.notEmpty || !pwdRules.minLength) {
        newErrors.password = 'Please ensure all password requirements are met.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsUpdating(true);
    try {
      await dispatch(updateUser({ 
        id: parseInt(id, 10), 
        data: {
          name: cleanName,
          email: cleanEmail,
          password: formData.password,
          roleId: formData.roleId
        }
      })).unwrap();
      Swal.fire({
        icon: 'success',
        title: 'User Updated',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#00c8ff'
      });
      router.push('/admin/users');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err || 'An error occurred while updating the user.',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#00c8ff'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <Loader2 className="animate-spin text-[#00c8ff]" size={40} />
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="text-red-500 mb-4 font-medium">{error}</div>
        <Link 
          href="/admin/users"
          className="text-[#00c8ff] hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Users
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard requirePermission={{ action: 'edit', subject: 'user' }}>
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
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Edit User</h1>
              <p className="text-[#8ba0b8] font-medium mt-1">Update user information and roles.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateUser} noValidate className="space-y-6">
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
                {errors.name && <div className="text-red-400 text-xs font-bold mt-2">{errors.name}</div>}
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Email Address *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value.replace(/\s/g, '')})}
                  onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                  className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" 
                  placeholder="john@example.com" 
                />
                {errors.email && <div className="text-red-400 text-xs font-bold mt-2">{errors.email}</div>}
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value.replace(/\s/g, '')})}
                    onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                    className="w-full pl-4 pr-12 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" 
                    placeholder="Leave blank to keep unchanged" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Only fill this if you want to change the user's password.</p>
                {formData.password && (
                  <div className="mt-3 text-xs font-medium space-y-1.5 p-3 rounded-lg bg-[#0f111a]/30 border border-white/5">
                    <div className={pwdRules.minLength ? "text-green-400" : "text-red-400"}>
                      {pwdRules.minLength ? "✓" : "✗"} At least 8 characters
                    </div>
                    <div className={pwdRules.capital ? "text-green-400" : "text-red-400"}>
                      {pwdRules.capital ? "✓" : "✗"} Contains a capital letter
                    </div>
                    <div className={pwdRules.number ? "text-green-400" : "text-red-400"}>
                      {pwdRules.number ? "✓" : "✗"} Contains a number
                    </div>
                    <div className={pwdRules.special ? "text-green-400" : "text-red-400"}>
                      {pwdRules.special ? "✓" : "✗"} Contains a special character
                    </div>
                    <div className={pwdRules.noWhitespace ? "text-green-400" : "text-red-400"}>
                      {pwdRules.noWhitespace ? "✓" : "✗"} No whitespace allowed
                    </div>
                  </div>
                )}
                {errors.password && <div className="text-red-400 text-xs font-bold mt-2">{errors.password}</div>}
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Role *</label>
                <select 
                  value={formData.roleId}
                  onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-[#0f111a] text-gray-500">Select a Role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id} className="bg-[#0f111a] text-white">{r.name}</option>
                  ))}
                </select>
                {errors.roleId && <div className="text-red-400 text-xs font-bold mt-2">{errors.roleId}</div>}
              </div>

            </div>
          </div>

          <div className="pt-8 flex justify-end gap-4 border-t border-white/10 mt-8">
            <Link href="/admin/users" className="px-6 py-2.5 text-sm font-bold text-[#8ba0b8] hover:text-white transition-colors bg-[#1d2440] border border-white/10 hover:border-white/30 rounded-xl shadow-lg">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isUpdating || !formData.email}
              className="px-6 py-2.5 bg-[#00c8ff] hover:bg-[#00b0e6] disabled:opacity-50 text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 flex justify-center items-center gap-2"
            >
              {isUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
      </AuthGuard>
  );
}
