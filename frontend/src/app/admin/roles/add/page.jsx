'use client';
import AuthGuard from '@/components/auth/AuthGuard';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';
import * as api from '@/lib/api';
import Swal from 'sweetalert2';

export default function AdminAddRole() {
  const router = useRouter();
  
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPerms, setIsLoadingPerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: []
  });

  useEffect(() => {
    api.apiCall('/admin/roles/permissions')
      .then(res => {
        setPermissions(res);
        setIsLoadingPerms(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingPerms(false);
      });
  }, []);

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.subject]) acc[perm.subject] = [];
    acc[perm.subject].push(perm);
    return acc;
  }, {});

  const allPermIds = permissions.map(p => p.id);
  const isAllSelected = allPermIds.length > 0 && formData.permissionIds.length === allPermIds.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setFormData({ ...formData, permissionIds: [] });
    } else {
      setFormData({ ...formData, permissionIds: allPermIds });
    }
  };

  const handleTogglePermission = (permId) => {
    setFormData(prev => {
      const isSelected = prev.permissionIds.includes(permId);
      if (isSelected) {
        return { ...prev, permissionIds: prev.permissionIds.filter(id => id !== permId) };
      } else {
        return { ...prev, permissionIds: [...prev.permissionIds, permId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.apiCall('/admin/roles', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      Swal.fire({
        icon: 'success',
        title: 'Role Created',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#00c8ff'
      });
      router.push('/admin/roles');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err.message || 'An error occurred while creating the role.',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#00c8ff'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard requirePermission={{ action: 'create', subject: 'role' }}>
    <div className="p-4 md:p-8 flex flex-col h-full overflow-y-auto relative w-full font-sans text-slate-300">
      <div className="max-w-6xl mx-auto space-y-8 w-full flex-1 flex flex-col relative z-10">
        
        {/* Header Section */}
        <div className="flex items-center gap-5 mb-2">
          <Link 
            href="/admin/roles"
            className="p-2.5 bg-[#FDF6ED] border border-gray-200 hover:border-[#ABD2FA] rounded-xl transition-all duration-300 text-gray-600 hover:text-[#ABD2FA] shadow-lg group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Create Role</h1>
            <p className="text-gray-600 font-medium mt-1">Assign permissions to this role</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Role Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Role Name *</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-[#8ba0b8] focus:outline-none focus:border-[#ABD2FA] focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" 
                placeholder="e.g. MANAGER" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</label>
              <input 
                type="text" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-[#8ba0b8] focus:outline-none focus:border-[#ABD2FA] focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" 
                placeholder="Brief description of this role" 
              />
            </div>
          </div>

          {/* Permissions Assignment */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold text-gray-900">Permissions Assignment</h2>
              <button
                type="button"
                onClick={handleToggleAll}
                className="px-4 py-2 bg-white/5 hover:bg-gray-100 border border-[#ABD2FA] text-[#ABD2FA] text-sm font-bold rounded-full shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {isLoadingPerms ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-[#ABD2FA]" size={40} />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(groupedPermissions).map(([subject, perms]) => (
                  <div key={subject} className="relative border border-gray-200 p-6 rounded-2xl bg-white backdrop-blur-md shadow-xl transition-all hover:border-[#ABD2FA]">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-white/5 rounded-lg border border-gray-200">
                        <Shield className="w-5 h-5 text-gray-600" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{subject} PERMISSIONS</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                      {perms.map(perm => {
                        const isChecked = formData.permissionIds.includes(perm.id);
                        return (
                          <div key={perm.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-gray-200 hover:border-gray-200 transition-colors">
                            <span className="text-sm font-medium text-gray-700">{perm.action}-{perm.subject}</span>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.id)}
                              />
                              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ABD2FA] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-gray-200 mt-8">
            <Link href="/admin/roles" className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors bg-[#FDF6ED] border border-gray-200 hover:border-[#ABD2FA] rounded-xl shadow-lg">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.name}
              className="px-6 py-2.5 bg-[#ABD2FA] hover:bg-[#00b0e6] disabled:opacity-50 text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
      </AuthGuard>
  );
}
