'use client';
import AuthGuard from '@/components/auth/AuthGuard';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';
import * as api from '@/lib/api';
import Swal from 'sweetalert2';

export default function AdminEditRole() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: []
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [roleRes, permsRes] = await Promise.all([
        api.apiCall(`/admin/roles/${id}`),
        api.apiCall('/admin/roles/permissions')
      ]);
      
      setPermissions(permsRes);
      setFormData({
        name: roleRes.name || '',
        description: roleRes.description || '',
        permissionIds: roleRes.permissions?.map(rp => rp.permissionId) || []
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Role',
        text: error.message || 'Failed to fetch role details.',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#00c8ff'
      });
      router.push('/admin/roles');
    } finally {
      setIsLoading(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.subject]) acc[perm.subject] = [];
    acc[perm.subject].push(perm);
    return acc;
  }, {});

  const allPermIds = permissions.map(p => p.id);
  const isAllSelected = allPermIds.length > 0 && formData.permissionIds.length === allPermIds.length;
  
  // Disable everything if it's the master ADMIN role
  const isAdminRole = formData.name === 'ADMIN';

  const handleToggleAll = () => {
    if (isAdminRole) return;
    if (isAllSelected) {
      setFormData({ ...formData, permissionIds: [] });
    } else {
      setFormData({ ...formData, permissionIds: allPermIds });
    }
  };

  const handleTogglePermission = (permId) => {
    if (isAdminRole) return;
    setFormData(prev => {
      const isSelected = prev.permissionIds.includes(permId);
      if (isSelected) {
        return { ...prev, permissionIds: prev.permissionIds.filter(pid => pid !== permId) };
      } else {
        return { ...prev, permissionIds: [...prev.permissionIds, permId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAdminRole) return; // Prevent submission explicitly for ADMIN
    
    setIsSubmitting(true);
    try {
      await api.apiCall(`/admin/roles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      Swal.fire({
        icon: 'success',
        title: 'Role Updated',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#00c8ff'
      });
      router.push('/admin/roles');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'An error occurred while updating the role.',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#00c8ff'
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <Loader2 className="animate-spin text-[#00c8ff]" size={40} />
      </div>
    );
  }

  return (
    <AuthGuard requirePermission={{ action: 'edit', subject: 'role' }}>
    <div className="p-4 md:p-8 flex flex-col h-full overflow-y-auto relative w-full font-sans text-slate-300">
      <div className="max-w-6xl mx-auto space-y-8 w-full flex-1 flex flex-col relative z-10">
        
        {/* Header Section */}
        <div className="flex items-center gap-5 mb-2">
          <Link 
            href="/admin/roles"
            className="p-2.5 bg-[#1d2440] border border-white/10 hover:border-[#00c8ff]/50 rounded-xl transition-all duration-300 text-slate-400 hover:text-[#00c8ff] shadow-lg group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Edit Role</h1>
            <p className="text-[#8ba0b8] font-medium mt-1">Assign permissions to this role</p>
          </div>
        </div>

        {isAdminRole && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl text-yellow-200 text-sm font-medium">
            The system ADMIN role cannot be edited to prevent accidental lockouts.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Role Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Role Name *</label>
              <input 
                type="text" 
                required
                disabled={isAdminRole}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all disabled:opacity-50" 
                placeholder="e.g. MANAGER" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Description</label>
              <input 
                type="text" 
                disabled={isAdminRole}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all disabled:opacity-50" 
                placeholder="Brief description of this role" 
              />
            </div>
          </div>

          {/* Permissions Assignment */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Permissions Assignment</h2>
              <button
                type="button"
                disabled={isAdminRole}
                onClick={handleToggleAll}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#00c8ff]/30 text-[#00c8ff] text-sm font-bold rounded-full shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {Object.entries(groupedPermissions).map(([subject, perms]) => (
                <div key={subject} className="relative border border-white/10 p-6 rounded-2xl bg-[#1d2440]/40 backdrop-blur-md shadow-xl transition-all hover:border-white/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                      <Shield className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{subject} PERMISSIONS</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                    {perms.map(perm => {
                      const isChecked = isAdminRole || formData.permissionIds.includes(perm.id);
                      return (
                        <div key={perm.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isChecked ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                          <span className={`text-sm font-medium ${isChecked ? 'text-white' : 'text-gray-400'}`}>
                            {perm.action}-{perm.subject}
                          </span>
                          
                          <label className={`relative inline-flex items-center ${isAdminRole ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              disabled={isAdminRole}
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.id)}
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00c8ff] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-white/10 mt-8">
            <Link href="/admin/roles" className="px-6 py-2.5 text-sm font-bold text-[#8ba0b8] hover:text-white transition-colors bg-[#1d2440] border border-white/10 hover:border-white/30 rounded-xl shadow-lg">
              Cancel
            </Link>
            {!isAdminRole && (
              <button 
                type="submit" 
                disabled={isSubmitting || !formData.name}
                className="px-6 py-2.5 bg-[#00c8ff] hover:bg-[#00b0e6] disabled:opacity-50 text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
      </AuthGuard>
  );
}
