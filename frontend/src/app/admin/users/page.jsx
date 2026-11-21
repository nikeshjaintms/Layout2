'use client';
import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, Loader2, CreditCard, Banknote, X, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, deleteUser, clearCreateError } from '@/redux/slices/usersSlice';
import { assignOfflineSubscription } from '@/redux/slices/subscriptionsSlice';
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

  // Offline Payment Assignment Modal state
  const [offlineModalUser, setOfflineModalUser] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [offlineForm, setOfflineForm] = useState({
    paymentMethod: 'Cash',
    paymentReference: '',
    amount: '39999',
    notes: '',
    durationPreset: '365',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    renewalMode: 'EXTEND',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Compute end date for offline form
  useEffect(() => {
    if (offlineForm.startDate && offlineForm.durationPreset !== 'CUSTOM') {
      const existingSub = offlineModalUser?.subscription;
      const isExistingActive = existingSub && new Date(existingSub.endDate).getTime() > Date.now();

      let baseDate;
      if (isExistingActive && offlineForm.renewalMode === 'EXTEND') {
        baseDate = new Date(existingSub.endDate);
      } else {
        baseDate = new Date(offlineForm.startDate);
      }

      const days = parseInt(offlineForm.durationPreset, 10);
      if (!isNaN(days)) {
        baseDate.setDate(baseDate.getDate() + days);
        setOfflineForm((prev) => ({
          ...prev,
          endDate: baseDate.toISOString().split('T')[0],
        }));
      }
    }
  }, [offlineForm.startDate, offlineForm.durationPreset, offlineModalUser, offlineForm.renewalMode]);

  const handleOpenOfflineModal = (user) => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    setOfflineModalUser(user);
    setOfflineForm({
      paymentMethod: 'Cash',
      paymentReference: '',
      amount: '39999',
      notes: '',
      durationPreset: '365',
      startDate: today,
      endDate: nextYear.toISOString().split('T')[0],
      renewalMode: 'EXTEND',
    });
  };

  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    if (!offlineModalUser) return;
    setAssignLoading(true);
    try {
      await dispatch(
        assignOfflineSubscription({
          userId: offlineModalUser.id,
          paymentMethod: offlineForm.paymentMethod,
          paymentReference: offlineForm.paymentReference,
          amount: offlineForm.amount,
          notes: offlineForm.notes,
          startDate: offlineForm.startDate,
          endDate: offlineForm.endDate,
          renewalMode: offlineForm.renewalMode,
          status: 'ACTIVE',
        })
      ).unwrap();

      Swal.fire({
        icon: 'success',
        title: 'Offline Subscription Assigned!',
        html: `Subscription successfully assigned to <b>${offlineModalUser.name || offlineModalUser.email}</b>.<br/><br/><span style="color: #ABD2FA; font-size: 13px;">Mode: <b>${offlineForm.paymentMethod}</b> | Amount: <b>₹${offlineForm.amount || '0'}</b></span>`,
        background: '#18181b',
        color: '#fff',
      });
      setOfflineModalUser(null);
      dispatch(fetchUsers({ page: currentPage, limit, search: debouncedSearch }));
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: err || 'Could not assign offline subscription.',
        background: '#18181b',
        color: '#fff',
      });
    } finally {
      setAssignLoading(false);
    }
  };

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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Users
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Manage user accounts and roles.
            </p>
          </div>
          <div className="flex sm:gap-4 w-full sm:w-auto">
            <Can I="create" a="user">
              <Link 
                href="/admin/users/add"
                onClick={() => dispatch(clearCreateError())}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#ABD2FA] hover:bg-[#00b0e6] text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <UserPlus size={18} strokeWidth={2.5} />
                <span>Add New User</span>
              </Link>
            </Can>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center bg-white backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-lg">
          <div className="relative flex-1 w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#ABD2FA] transition-colors" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by email..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ABD2FA] focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all text-gray-900 placeholder-[#8ba0b8] font-medium"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col transition-all">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#FDF6ED] border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px]">Name</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px]">Email</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px]">Role</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px]">Subscription</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px]">Days Left</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-600">
                      Loading users...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-600">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-all duration-200 group">
                      <td className="px-6 py-5 font-semibold text-gray-900">{user.name || '-'}</td>
                      <td className="px-6 py-5 text-gray-600 font-medium">{user.email}</td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm inline-flex items-center justify-center min-w-[80px] bg-white border border-[#ABD2FA] text-[#ABD2FA]">
                          {user.role?.name || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {user.role?.name === 'CLIENT' ? (
                          user.subscription ? (
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${user.subscription.status === 'ACTIVE' && new Date(user.subscription.endDate).getTime() >= new Date().getTime() ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {new Date(user.subscription.endDate).getTime() < new Date().getTime() ? 'EXPIRED' : user.subscription.status}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-[10px] font-bold uppercase rounded border bg-zinc-500/10 text-zinc-400 border-zinc-500/20">Not Started</span>
                          )
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {user.role?.name === 'CLIENT' && user.subscription ? (() => {
                          const diff = new Date(user.subscription.endDate).getTime() - new Date().getTime();
                          const days = Math.ceil(diff / (1000 * 3600 * 24));
                          return days < 0 ? (
                            <span className="text-red-400 text-xs font-bold">Expired</span>
                          ) : (
                            <span className={`text-xs font-bold ${days < 30 ? 'text-orange-400' : 'text-green-400'}`}>{days} days left</span>
                          );
                        })() : <span className="text-gray-600">-</span>}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          {user.role?.name === 'CLIENT' && (
                            <button
                              onClick={() => handleOpenOfflineModal(user)}
                              className="p-2 text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-300 rounded-lg transition-all"
                              title="Assign Offline Subscription (Cash, UPI, Bank Transfer)"
                            >
                              <CreditCard size={15} />
                            </button>
                          )}
                          <Can I="edit" a="user">
                            <Link 
                              href={`/admin/users/edit/${user.id}`}
                              className="p-2 text-gray-600 hover:text-[#ABD2FA] bg-white/5 border border-gray-200 hover:border-[#ABD2FA] rounded-lg transition-all hover:shadow-[0_0_10px_rgba(0,200,255,0.1)]"
                              title="Edit User"
                            >
                              <Edit2 size={15} />
                            </Link>
                          </Can>
                          <Can I="delete" a="user">
                            <button 
                              onClick={() => handleDeleteClick(user.id)}
                              className="p-2 text-gray-600 hover:text-red-400 bg-white/5 border border-gray-200 hover:border-red-500/50 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.1)]"
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

      {/* OFFLINE SUBSCRIPTION ASSIGNMENT MODAL */}
      {offlineModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Assign Offline Subscription</h3>
                  <p className="text-xs text-gray-600">Manual activation for offline payment (Cash, Bank Transfer, UPI)</p>
                </div>
              </div>
              <button
                onClick={() => setOfflineModalUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOfflineSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Selected User Display */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Client</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{offlineModalUser.name || 'Client'}</p>
                <p className="text-gray-500">{offlineModalUser.email}</p>
                {offlineModalUser.subscription && (
                  <p className="mt-1 text-emerald-700 font-semibold">
                    Current Expiration: {new Date(offlineModalUser.subscription.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Renewal Strategy if already has sub */}
              {offlineModalUser.subscription && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold">Renewal Option:</span>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="userRenewalMode"
                        value="EXTEND"
                        checked={offlineForm.renewalMode === 'EXTEND'}
                        onChange={(e) => setOfflineForm({ ...offlineForm, renewalMode: e.target.value })}
                        className="text-emerald-600"
                      />
                      <span>Extend current expiry</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="userRenewalMode"
                        value="OVERWRITE"
                        checked={offlineForm.renewalMode === 'OVERWRITE'}
                        onChange={(e) => setOfflineForm({ ...offlineForm, renewalMode: e.target.value })}
                        className="text-emerald-600"
                      />
                      <span>Start from selected date</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Offline Payment Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={offlineForm.paymentMethod}
                    onChange={(e) => setOfflineForm({ ...offlineForm, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer / NEFT">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI / QR Code">UPI / QR Code</option>
                    <option value="Cheque / DD">Cheque / Demand Draft</option>
                    <option value="Corporate Invoice">Corporate Invoice</option>
                    <option value="Other Offline">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="text"
                    placeholder="39999"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={offlineForm.amount}
                    onChange={(e) => setOfflineForm({ ...offlineForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Receipt / Transaction Ref No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. RCPT-1029, UPI/92839201"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={offlineForm.paymentReference}
                  onChange={(e) => setOfflineForm({ ...offlineForm, paymentReference: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Admin Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received in cash at office"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={offlineForm.notes}
                  onChange={(e) => setOfflineForm({ ...offlineForm, notes: e.target.value })}
                />
              </div>

              {/* Duration Presets */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Plan Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { days: '30', label: '1 Month' },
                    { days: '90', label: '3 Months' },
                    { days: '180', label: '6 Months' },
                    { days: '365', label: '1 Year' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.days}
                      onClick={() => setOfflineForm({ ...offlineForm, durationPreset: p.days })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        offlineForm.durationPreset === p.days
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={offlineForm.startDate}
                    onChange={(e) => setOfflineForm({ ...offlineForm, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={offlineForm.endDate}
                    onChange={(e) => setOfflineForm({ ...offlineForm, endDate: e.target.value, durationPreset: 'CUSTOM' })}
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOfflineModalUser(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {assignLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Assign & Activate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
