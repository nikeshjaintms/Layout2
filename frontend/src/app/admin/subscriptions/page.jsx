'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptions, modifySubscriptionStatus, prolongSubscription } from '@/redux/slices/subscriptionsSlice';
import AuthGuard from '@/components/auth/AuthGuard';
import { Search, Loader2, Edit, Calendar, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminSubscriptions() {
  const dispatch = useDispatch();
  const { items: subscriptions, loading } = useSelector((state) => state.subscriptions);
  const [search, setSearch] = useState('');
  const [filteredSubs, setFilteredSubs] = useState([]);

  useEffect(() => {
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  useEffect(() => {
    if (subscriptions) {
      setFilteredSubs(
        subscriptions.filter(s => 
          s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          s.user?.name?.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, subscriptions]);

  const handleStatusToggle = async (sub) => {
    const isExpired = new Date(sub.endDate).getTime() < new Date().getTime();
    
    if (sub.status === 'INACTIVE' && isExpired) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Activate',
        text: 'Subscription has expired. Please extend the subscription before activating.',
        background: '#18181b',
        color: '#fff'
      });
      return;
    }

    const newStatus = sub.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate';

    const result = await Swal.fire({
      title: `${actionText} Subscription?`,
      text: `Are you sure you want to ${actionText.toLowerCase()} this subscription?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'ACTIVE' ? '#22c55e' : '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: `Yes, ${actionText}`,
      background: '#18181b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(modifySubscriptionStatus({ id: sub.id, status: newStatus })).unwrap();
        Swal.fire({ icon: 'success', title: 'Success', text: 'Status updated.', timer: 1500, showConfirmButton: false, background: '#18181b', color: '#fff' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Failed', text: err, background: '#18181b', color: '#fff' });
      }
    }
  };

  const handleExtend = async (sub) => {
    const { value: formValues } = await Swal.fire({
      title: 'Extend/Reduce Subscription',
      html: `
        <div class="flex flex-col gap-4 text-left">
          <p class="text-sm text-gray-400">Current End Date: ${new Date(sub.endDate).toLocaleDateString()}</p>
          <div>
            <label class="block text-sm font-bold text-white mb-1">Duration Type</label>
            <select id="durationType" class="w-full bg-[#131828] border border-white/10 rounded-xl text-white px-3 py-2">
              <option value="DAYS">Days</option>
              <option value="MONTHS">Months</option>
              <option value="YEARS">Years</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-white mb-1">Value (Use negative to reduce)</label>
            <input type="number" id="durationValue" class="w-full bg-[#131828] border border-white/10 rounded-xl text-white px-3 py-2" value="30">
          </div>
        </div>
      `,
      focusConfirm: false,
      background: '#18181b',
      color: '#fff',
      showCancelButton: true,
      preConfirm: () => {
        return {
          durationType: document.getElementById('durationType').value,
          durationValue: parseInt(document.getElementById('durationValue').value)
        }
      }
    });

    if (formValues && !isNaN(formValues.durationValue)) {
      try {
        await dispatch(prolongSubscription({ id: sub.id, durationType: formValues.durationType, durationValue: formValues.durationValue })).unwrap();
        Swal.fire({ icon: 'success', title: 'Success', text: 'Subscription updated.', timer: 1500, showConfirmButton: false, background: '#18181b', color: '#fff' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Failed', text: err, background: '#18181b', color: '#fff' });
      }
    }
  };

  const getDaysLeft = (endDate) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <AuthGuard requireRole="ADMIN">
      <div className="p-8 h-full flex flex-col">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-wide uppercase drop-shadow-md">
              Subscriptions
            </h1>
            <p className="text-[#8ba0b8] mt-2 font-medium">
              Manage client subscriptions and validity periods.
            </p>
          </div>
          
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#8ba0b8]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2.5 bg-[#131828]/90 border border-white/10 rounded-xl text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 transition-all text-sm"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-[#00c8ff] animate-spin" />
          </div>
        ) : (
          <div className="bg-[#131828]/90 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0b0f19] border-b border-white/5">
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-[#8ba0b8]">Client</th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-[#8ba0b8]">Email</th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-[#8ba0b8]">Status</th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-[#8ba0b8]">Start Date</th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-[#8ba0b8]">End Date</th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-[#8ba0b8]">Days Left</th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-[#8ba0b8]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSubs.map((sub) => {
                    const daysLeft = getDaysLeft(sub.endDate);
                    const isExpired = daysLeft < 0;
                    
                    return (
                      <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-medium text-white flex items-center gap-2">
                          <User size={16} className="text-[#00c8ff]"/> {sub.user?.name || 'Unknown'}
                        </td>
                        <td className="py-4 px-6 text-[#8ba0b8] text-sm">{sub.user?.email}</td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-black px-2 py-1 rounded border flex items-center gap-1 w-max ${sub.status === 'ACTIVE' && !isExpired ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {sub.status === 'ACTIVE' && !isExpired ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                            {isExpired ? 'EXPIRED' : sub.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[#8ba0b8] text-sm">{new Date(sub.startDate).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-[#8ba0b8] text-sm">{new Date(sub.endDate).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-sm font-bold">
                          {isExpired ? (
                            <span className="text-red-400">Expired</span>
                          ) : (
                            <span className={daysLeft < 30 ? 'text-orange-400' : 'text-green-400'}>{daysLeft}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleStatusToggle(sub)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${sub.status === 'ACTIVE' ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'}`}
                            >
                              {sub.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => handleExtend(sub)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            >
                              Extend
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSubs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-[#8ba0b8]">
                        No subscriptions found. Note: Clients without a first login do not have a subscription yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
