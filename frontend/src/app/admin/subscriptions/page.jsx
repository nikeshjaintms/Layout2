'use client';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  fetchSubscriptions,
  fetchSubscriptionById,
  fetchSubscriptionUsers,
  fetchSubscriptionPackages,
  createSubscription,
  assignOfflineSubscription,
  updateSubscription,
  deleteSubscription,
  modifySubscriptionStatus,
  prolongSubscription,
  clearSelectedSubscription,
} from '@/redux/slices/subscriptionsSlice';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  Search,
  Loader2,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Edit2,
  Trash2,
  CalendarPlus,
  History,
  X,
  AlertCircle,
  ShieldCheck,
  Activity,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CreditCard,
  Banknote,
  Layers,
  UserCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminSubscriptions() {
  return (
    <Suspense fallback={null}>
      <AdminSubscriptionsContent />
    </Suspense>
  );
}

function AdminSubscriptionsContent() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const {
    items: subscriptions,
    selectedSubscription,
    users,
    packages,
    loading,
    actionLoading,
  } = useSelector((state) => state.subscriptions);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);

  // Form states
  const [activeSubForAction, setActiveSubForAction] = useState(null);

  // Add form
  const [addForm, setAddForm] = useState({
    userId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    durationPreset: '365', // days
    status: 'ACTIVE',
  });

  // Offline Payment Assignment form
  const [offlineForm, setOfflineForm] = useState({
    userId: '',
    paymentMethod: 'Cash',
    paymentReference: '',
    amount: '39999',
    notes: '',
    durationPreset: '365',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    renewalMode: 'EXTEND',
    status: 'ACTIVE',
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    id: null,
    clientName: '',
    clientEmail: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });

  // Extend form
  const [extendForm, setExtendForm] = useState({
    id: null,
    clientName: '',
    currentEndDate: '',
    durationType: 'MONTHS',
    durationValue: 1,
  });

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchSubscriptions());
    dispatch(fetchSubscriptionUsers());
    dispatch(fetchSubscriptionPackages());
  }, [dispatch]);

  // Handle URL query parameters from packages page (e.g. ?assignPackageId=...)
  useEffect(() => {
    const pkgId = searchParams.get('assignPackageId');
    const pkgName = searchParams.get('packageName');
    const pkgPrice = searchParams.get('price');
    const pkgDays = searchParams.get('durationDays');
    if (pkgId && users && users.length > 0) {
      handleOpenOffline(null, {
        notes: `Assigned Package: ${pkgName || 'Selected Plan'} (ID: ${pkgId})`,
        amount: pkgPrice || '39999',
        durationPreset: pkgDays || '365',
      });
    }
  }, [searchParams, users]);

  // Compute end date when start date or duration preset changes in Add form
  useEffect(() => {
    if (addForm.startDate && addForm.durationPreset !== 'CUSTOM') {
      const start = new Date(addForm.startDate);
      const days = parseInt(addForm.durationPreset, 10);
      if (!isNaN(days)) {
        start.setDate(start.getDate() + days);
        setAddForm((prev) => ({
          ...prev,
          endDate: start.toISOString().split('T')[0],
        }));
      }
    }
  }, [addForm.startDate, addForm.durationPreset]);

  // Compute end date for Offline form
  useEffect(() => {
    if (offlineForm.startDate && offlineForm.durationPreset !== 'CUSTOM') {
      const selectedUserObj = users.find((u) => String(u.id) === String(offlineForm.userId));
      const existingSub = selectedUserObj?.subscription;
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
  }, [offlineForm.startDate, offlineForm.durationPreset, offlineForm.userId, offlineForm.renewalMode, users]);

  // Helper date functions
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toInputDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const getProgress = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    if (end <= start) return 100;
    const total = end - start;
    const elapsed = now - start;
    const percent = Math.round((elapsed / total) * 100);
    return Math.max(0, Math.min(100, percent));
  };

  // Stats calculation
  const stats = useMemo(() => {
    if (!subscriptions) return { total: 0, active: 0, expiringSoon: 0, expired: 0 };
    let total = subscriptions.length;
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;

    subscriptions.forEach((s) => {
      const days = getDaysLeft(s.endDate);
      const isExp = days < 0;
      if (s.status === 'ACTIVE' && !isExp) {
        active++;
        if (days <= 30) {
          expiringSoon++;
        }
      } else {
        expired++;
      }
    });

    return { total, active, expiringSoon, expired };
  }, [subscriptions]);

  // Filtered subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return [];
    return subscriptions.filter((s) => {
      const matchesSearch =
        s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.name?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      const days = getDaysLeft(s.endDate);
      const isExp = days < 0;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ACTIVE') return s.status === 'ACTIVE' && !isExp;
      if (statusFilter === 'EXPIRING_SOON') return s.status === 'ACTIVE' && !isExp && days <= 30;
      if (statusFilter === 'EXPIRED') return isExp;
      if (statusFilter === 'INACTIVE') return s.status === 'INACTIVE';

      return true;
    });
  }, [subscriptions, search, statusFilter]);

  // ============================================================
  // HANDLERS
  // ============================================================

  // SHOW DETAILS
  const handleOpenShow = async (sub) => {
    setActiveSubForAction(sub);
    setShowModalOpen(true);
    await dispatch(fetchSubscriptionById(sub.id));
  };

  const handleCloseShow = () => {
    setShowModalOpen(false);
    setActiveSubForAction(null);
    dispatch(clearSelectedSubscription());
  };

  // CREATE
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    // Pick first user without an existing subscription if possible
    const availableUser = users.find((u) => !u.subscription);

    setAddForm({
      userId: availableUser ? availableUser.id : (users[0]?.id || ''),
      startDate: today,
      endDate: nextYear.toISOString().split('T')[0],
      durationPreset: '365',
      status: 'ACTIVE',
    });
    setAddModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.userId) {
      Swal.fire({ icon: 'warning', title: 'Missing User', text: 'Please select a user.', background: '#18181b', color: '#fff' });
      return;
    }

    try {
      await dispatch(
        createSubscription({
          userId: parseInt(addForm.userId, 10),
          startDate: addForm.startDate,
          endDate: addForm.endDate,
          status: addForm.status,
        })
      ).unwrap();

      Swal.fire({
        icon: 'success',
        title: 'Subscription Created!',
        text: 'The subscription has been successfully assigned to the client.',
        timer: 2000,
        showConfirmButton: false,
        background: '#18181b',
        color: '#fff',
      });
      setAddModalOpen(false);
      dispatch(fetchSubscriptions());
      dispatch(fetchSubscriptionUsers());
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err || 'Failed to create subscription.',
        background: '#18181b',
        color: '#fff',
      });
    }
  };

  // ASSIGN OFFLINE PAYMENT
  const handleOpenOffline = (preselectedUserId = null, customDefaults = null) => {
    const today = new Date().toISOString().split('T')[0];
    const defaultUser = preselectedUserId
      ? users.find((u) => String(u.id) === String(preselectedUserId))
      : users[0];

    const targetUserId = defaultUser ? String(defaultUser.id) : '';
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    setOfflineForm({
      userId: targetUserId,
      paymentMethod: 'Cash',
      paymentReference: '',
      amount: customDefaults?.amount || '39999',
      notes: customDefaults?.notes || '',
      durationPreset: customDefaults?.durationPreset || '365',
      startDate: today,
      endDate: nextYear.toISOString().split('T')[0],
      renewalMode: 'EXTEND',
      status: 'ACTIVE',
    });
    setOfflineModalOpen(true);
  };

  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    if (!offlineForm.userId) {
      Swal.fire({ icon: 'warning', title: 'Missing User', text: 'Please select a client.', background: '#18181b', color: '#fff' });
      return;
    }

    try {
      await dispatch(
        assignOfflineSubscription({
          userId: parseInt(offlineForm.userId, 10),
          paymentMethod: offlineForm.paymentMethod,
          paymentReference: offlineForm.paymentReference,
          amount: offlineForm.amount,
          notes: offlineForm.notes,
          startDate: offlineForm.startDate,
          endDate: offlineForm.endDate,
          renewalMode: offlineForm.renewalMode,
          status: offlineForm.status,
        })
      ).unwrap();

      Swal.fire({
        icon: 'success',
        title: 'Offline Subscription Assigned!',
        html: `Subscription successfully assigned & activated!<br/><br/><span style="color: #ABD2FA; font-size: 13px;">Mode: <b>${offlineForm.paymentMethod}</b> | Amount: <b>₹${offlineForm.amount || '0'}</b> ${offlineForm.paymentReference ? `| Ref: <b>${offlineForm.paymentReference}</b>` : ''}</span>`,
        background: '#18181b',
        color: '#fff',
      });
      setOfflineModalOpen(false);
      dispatch(fetchSubscriptions());
      dispatch(fetchSubscriptionUsers());
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: err || 'Could not assign offline subscription.',
        background: '#18181b',
        color: '#fff',
      });
    }
  };

  // EDIT
  const handleOpenEdit = (sub) => {
    setEditForm({
      id: sub.id,
      clientName: sub.user?.name || 'Client',
      clientEmail: sub.user?.email || '',
      startDate: toInputDate(sub.startDate),
      endDate: toInputDate(sub.endDate),
      status: sub.status,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        updateSubscription({
          id: editForm.id,
          data: {
            startDate: editForm.startDate,
            endDate: editForm.endDate,
            status: editForm.status,
          },
        })
      ).unwrap();

      Swal.fire({
        icon: 'success',
        title: 'Subscription Updated!',
        text: 'The subscription details have been updated.',
        timer: 1500,
        showConfirmButton: false,
        background: '#18181b',
        color: '#fff',
      });
      setEditModalOpen(false);
      dispatch(fetchSubscriptions());
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err || 'Failed to update subscription.',
        background: '#18181b',
        color: '#fff',
      });
    }
  };

  // EXTEND
  const handleOpenExtend = (sub) => {
    setExtendForm({
      id: sub.id,
      clientName: sub.user?.name || 'Client',
      currentEndDate: sub.endDate,
      durationType: 'MONTHS',
      durationValue: 1,
    });
    setExtendModalOpen(true);
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        prolongSubscription({
          id: extendForm.id,
          durationType: extendForm.durationType,
          durationValue: parseInt(extendForm.durationValue, 10),
        })
      ).unwrap();

      Swal.fire({
        icon: 'success',
        title: 'Duration Adjusted!',
        text: 'Subscription duration successfully updated.',
        timer: 1500,
        showConfirmButton: false,
        background: '#18181b',
        color: '#fff',
      });
      setExtendModalOpen(false);
      dispatch(fetchSubscriptions());
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: err || 'Could not extend subscription.',
        background: '#18181b',
        color: '#fff',
      });
    }
  };

  // STATUS TOGGLE
  const handleStatusToggle = async (sub) => {
    const isExpired = new Date(sub.endDate).getTime() < new Date().getTime();

    if (sub.status === 'INACTIVE' && isExpired) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Activate',
        text: 'This subscription is expired. Please extend the duration before activating.',
        background: '#18181b',
        color: '#fff',
      });
      return;
    }

    const newStatus = sub.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate';

    const result = await Swal.fire({
      title: `${actionText} Subscription?`,
      text: `Are you sure you want to ${actionText.toLowerCase()} subscription for ${sub.user?.name || 'this client'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'ACTIVE' ? '#22c55e' : '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: `Yes, ${actionText}`,
      background: '#18181b',
      color: '#fff',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(modifySubscriptionStatus({ id: sub.id, status: newStatus })).unwrap();
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `Subscription is now ${newStatus}.`,
          timer: 1500,
          showConfirmButton: false,
          background: '#18181b',
          color: '#fff',
        });
        dispatch(fetchSubscriptions());
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Failed', text: err, background: '#18181b', color: '#fff' });
      }
    }
  };

  // DELETE
  const handleDelete = async (sub) => {
    const result = await Swal.fire({
      title: 'Delete Subscription?',
      text: `Are you sure you want to delete the subscription for "${sub.user?.name || sub.user?.email}"? This will permanently erase the validity and audit logs.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Yes, Delete',
      background: '#18181b',
      color: '#fff',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteSubscription(sub.id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Subscription was deleted.',
          timer: 1500,
          showConfirmButton: false,
          background: '#18181b',
          color: '#fff',
        });
        dispatch(fetchSubscriptions());
        dispatch(fetchSubscriptionUsers());
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err || 'Could not delete subscription.',
          background: '#18181b',
          color: '#fff',
        });
      }
    }
  };

  return (
    <AuthGuard requireRole="ADMIN">
      <div className="p-4 md:p-8 h-full flex flex-col font-sans max-w-7xl mx-auto w-full space-y-6">
        {/* TWO-OPTION TAB SWITCHER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="inline-flex items-center p-1.5 bg-gray-100 rounded-2xl border border-gray-200 shadow-inner">
            <Link
              href="/admin/subscriptions/packages"
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-gray-600 hover:text-gray-900 hover:bg-white/60"
            >
              <Layers className="w-4 h-4 text-gray-500" />
              <span>Subscription Packages</span>
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700 font-semibold">
                {packages?.length || 0}
              </span>
            </Link>

            <button
              type="button"
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-white text-gray-900 shadow-sm border border-gray-200/80"
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Assign Subscriptions</span>
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold">
                {subscriptions?.length || 0}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                dispatch(fetchSubscriptions());
                dispatch(fetchSubscriptionUsers());
                dispatch(fetchSubscriptionPackages());
              }}
              className="p-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenOffline()}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              title="Assign subscription when payment is taken offline (Cash, Bank Transfer, UPI, Cheque)"
            >
              <CreditCard className="w-4 h-4" />
              <span>Offline Payment</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#ABD2FA] hover:bg-[#8bbefa] text-gray-900 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-[#FDF6ED] text-[#0f111a] rounded-2xl border border-[#ABD2FA]">
              <Activity className="w-7 h-7 text-[#0f111a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Subscriptions Assignment & Client Validity
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Option 2: Assigning
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Manage client assignments, offline payment recordings, plan renewals, and historical audit trail.
              </p>
            </div>
          </div>
        </div>

        {/* METRICS / STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Subscriptions</p>
              <h3 className="text-2xl font-black text-gray-900">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</p>
              <h3 className="text-2xl font-black text-green-600">{stats.active}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiring in ≤30d</p>
              <h3 className="text-2xl font-black text-amber-600">{stats.expiringSoon}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expired / Inactive</p>
              <h3 className="text-2xl font-black text-red-600">{stats.expired}</h3>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'EXPIRING_SOON', label: 'Expiring Soon' },
              { id: 'EXPIRED', label: 'Expired' },
              { id: 'INACTIVE', label: 'Inactive' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === tab.id
                    ? 'bg-[#ABD2FA] text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA] focus:bg-white transition-all"
              placeholder="Search by client or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE SECTION */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center justify-center gap-3 shadow-sm">
            <Loader2 className="w-10 h-10 text-[#ABD2FA] animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Loading subscriptions...</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FDF6ED] border-b border-gray-200 text-gray-600 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Client</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Start Date</th>
                    <th className="py-4 px-6">End Date</th>
                    <th className="py-4 px-6">Validity</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredSubs.map((sub) => {
                    const daysLeft = getDaysLeft(sub.endDate);
                    const isExpired = daysLeft < 0;
                    const isActive = sub.status === 'ACTIVE' && !isExpired;

                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Client info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#FDF6ED] border border-[#ABD2FA] flex items-center justify-center font-bold text-gray-900 text-xs">
                              {sub.user?.name ? sub.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{sub.user?.name || 'Unnamed Client'}</p>
                              <p className="text-xs text-gray-500">{sub.user?.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              <XCircle className="w-3.5 h-3.5" /> Expired
                            </span>
                          ) : sub.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                              <XCircle className="w-3.5 h-3.5" /> Inactive
                            </span>
                          )}
                        </td>

                        {/* Start Date */}
                        <td className="py-4 px-6 text-gray-600 font-medium">
                          {formatDate(sub.startDate)}
                        </td>

                        {/* End Date */}
                        <td className="py-4 px-6 text-gray-600 font-medium">
                          {formatDate(sub.endDate)}
                        </td>

                        {/* Validity / Days Left */}
                        <td className="py-4 px-6">
                          {isExpired ? (
                            <span className="text-xs font-bold text-red-600">Expired {Math.abs(daysLeft)}d ago</span>
                          ) : (
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-lg ${
                                daysLeft <= 30
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {daysLeft} days left
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* SHOW BUTTON */}
                            <button
                              onClick={() => handleOpenShow(sub)}
                              title="Show Details & History"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* EDIT BUTTON */}
                            <button
                              onClick={() => handleOpenEdit(sub)}
                              title="Edit Subscription"
                              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* EXTEND BUTTON */}
                            <button
                              onClick={() => handleOpenExtend(sub)}
                              title="Extend / Reduce Validity"
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </button>

                            {/* STATUS TOGGLE */}
                            <button
                              onClick={() => handleStatusToggle(sub)}
                              title={sub.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                                sub.status === 'ACTIVE'
                                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                  : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                              }`}
                            >
                              {sub.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              onClick={() => handleDelete(sub)}
                              title="Delete Subscription"
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSubs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-500">
                        <Activity className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="font-semibold text-gray-700">No subscriptions match your criteria.</p>
                        <p className="text-xs text-gray-400 mt-1">Try clearing search filters or click "Add Subscription" above.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 1: SHOW SUBSCRIPTION DETAILS & HISTORY */}
        {/* ============================================================ */}
        {showModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-[#FDF6ED] rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ABD2FA] text-gray-900 rounded-xl">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Subscription Overview</h3>
                    <p className="text-xs text-gray-500">Detailed subscription metrics and change history</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseShow}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {actionLoading && !selectedSubscription ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 text-[#ABD2FA] animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Client info card */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#ABD2FA] flex items-center justify-center font-bold text-gray-900 text-lg">
                          {(selectedSubscription?.user?.name || activeSubForAction?.user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">
                            {selectedSubscription?.user?.name || activeSubForAction?.user?.name || 'Client'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {selectedSubscription?.user?.email || activeSubForAction?.user?.email}
                          </p>
                          <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                            Role: {selectedSubscription?.user?.role?.name || 'CLIENT'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {(() => {
                          const sub = selectedSubscription || activeSubForAction;
                          const days = getDaysLeft(sub?.endDate);
                          const isExp = days < 0;
                          return isExp ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                              Expired
                            </span>
                          ) : sub?.status === 'ACTIVE' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                              Inactive
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {(() => {
                      const sub = selectedSubscription || activeSubForAction;
                      const progress = getProgress(sub?.startDate, sub?.endDate);
                      const days = getDaysLeft(sub?.endDate);
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold text-gray-600">
                            <span>Subscription Period Elapsed</span>
                            <span>{progress}% used ({days > 0 ? `${days} days remaining` : 'Expired'})</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                days <= 0
                                  ? 'bg-red-500'
                                  : days <= 30
                                  ? 'bg-amber-400'
                                  : 'bg-[#ABD2FA]'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Key metrics grid */}
                    {(() => {
                      const sub = selectedSubscription || activeSubForAction;
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-[11px] font-bold text-gray-400 uppercase">Start Date</p>
                            <p className="font-bold text-gray-900 text-sm mt-1">{formatDate(sub?.startDate)}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-[11px] font-bold text-gray-400 uppercase">End Date</p>
                            <p className="font-bold text-gray-900 text-sm mt-1">{formatDate(sub?.endDate)}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-[11px] font-bold text-gray-400 uppercase">Total Days</p>
                            <p className="font-bold text-gray-900 text-sm mt-1">{sub?.durationDays || '-'} days</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-[11px] font-bold text-gray-400 uppercase">Subscription ID</p>
                            <p className="font-bold text-gray-900 text-sm mt-1">#{sub?.id}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Subscription History Table */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <History className="w-4 h-4 text-gray-700" />
                        <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                          Audit Trail & Change History
                        </h4>
                      </div>

                      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Action</th>
                              <th className="py-2.5 px-3">Changed By</th>
                              <th className="py-2.5 px-3">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedSubscription?.history?.map((h) => (
                              <tr key={h.id} className="hover:bg-gray-50">
                                <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                                  {formatDateTime(h.createdAt)}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      h.action === 'CREATED'
                                        ? 'bg-blue-100 text-blue-700'
                                        : h.action === 'ACTIVATED'
                                        ? 'bg-green-100 text-green-700'
                                        : h.action === 'DEACTIVATED'
                                        ? 'bg-red-100 text-red-700'
                                        : h.action === 'EXTENDED'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : h.action === 'OFFLINE_PAYMENT'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold'
                                        : h.action === 'OFFLINE_RENEWAL'
                                        ? 'bg-teal-100 text-teal-800 border border-teal-300 font-extrabold'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}
                                  >
                                    {h.action}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                                  {h.changedBy || 'SYSTEM'}
                                </td>
                                <td className="py-2 px-3 text-gray-500">
                                  {h.previousStatus && h.newStatus && h.previousStatus !== h.newStatus && (
                                    <span>Status: {h.previousStatus} → {h.newStatus} </span>
                                  )}
                                  {h.previousEndDate && h.newEndDate && (
                                    <span>End Date: {formatDate(h.previousEndDate)} → {formatDate(h.newEndDate)}</span>
                                  )}
                                  {!h.previousStatus && !h.previousEndDate && (
                                    <span>Initial assignment</span>
                                  )}
                                </td>
                              </tr>
                            ))}

                            {(!selectedSubscription?.history || selectedSubscription.history.length === 0) && (
                              <tr>
                                <td colSpan="4" className="py-6 text-center text-gray-400">
                                  No historical events logged yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-2xl">
                <button
                  onClick={handleCloseShow}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 2: ADD / CREATE SUBSCRIPTION */}
        {/* ============================================================ */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-[#FDF6ED]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#ABD2FA] text-gray-900 rounded-xl">
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Create Subscription</h3>
                    <p className="text-xs text-gray-500">Assign a new subscription package to a client</p>
                  </div>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                {/* User select */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Select Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA]"
                    value={addForm.userId}
                    onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose a Client --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || 'Unnamed'} ({u.email}) {u.subscription ? '⚠️ Has existing sub' : '✅ No subscription'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Select the client account that should receive this validity period.
                  </p>
                </div>

                {/* Choose from predefined package */}
                {packages && packages.length > 0 && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select Defined Package (Optional)</span>
                      </label>
                      <Link
                        href="/admin/subscriptions/packages"
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Packages Catalog ↗
                      </Link>
                    </div>
                    <select
                      className="w-full bg-white border border-blue-200 rounded-xl p-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA]"
                      onChange={(e) => {
                        const pkg = packages.find((p) => String(p.id) === e.target.value);
                        if (pkg) {
                          setAddForm((prev) => ({
                            ...prev,
                            durationPreset: String(pkg.durationDays),
                          }));
                        }
                      }}
                    >
                      <option value="">-- Choose Package Preset --</option>
                      {packages.filter((p) => p.isActive).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{Number(p.price).toLocaleString('en-IN')} ({p.durationDays} days)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Duration Presets */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Duration Preset
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
                        onClick={() => setAddForm({ ...addForm, durationPreset: p.days })}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          addForm.durationPreset === p.days
                            ? 'bg-[#ABD2FA] text-gray-900 border-[#ABD2FA] shadow-sm'
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA]"
                      value={addForm.startDate}
                      onChange={(e) => setAddForm({ ...addForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA]"
                      value={addForm.endDate}
                      onChange={(e) => setAddForm({ ...addForm, endDate: e.target.value, durationPreset: 'CUSTOM' })}
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Initial Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="ACTIVE"
                        checked={addForm.status === 'ACTIVE'}
                        onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                        className="text-[#ABD2FA]"
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="INACTIVE"
                        checked={addForm.status === 'INACTIVE'}
                        onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                        className="text-[#ABD2FA]"
                      />
                      Inactive
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#ABD2FA] hover:bg-[#8bbefa] text-gray-900 text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Create Subscription</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 3: EDIT SUBSCRIPTION */}
        {/* ============================================================ */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gray-200 text-gray-800 rounded-xl">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Edit Subscription</h3>
                    <p className="text-xs text-gray-500">Update dates and active status</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                {/* Client info */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Client</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{editForm.clientName}</p>
                  <p className="text-xs text-gray-500">{editForm.clientEmail}</p>
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA]"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA]"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Status
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA]"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#ABD2FA] hover:bg-[#8bbefa] text-gray-900 text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 4: EXTEND / PROLONG SUBSCRIPTION */}
        {/* ============================================================ */}
        {extendModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-indigo-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-200 text-indigo-900 rounded-xl">
                    <CalendarPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Extend / Adjust Validity</h3>
                    <p className="text-xs text-gray-500">Add or reduce subscription duration</p>
                  </div>
                </div>
                <button
                  onClick={() => setExtendModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExtendSubmit} className="p-6 space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Client</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{extendForm.clientName}</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">
                    Current Expiration: {formatDate(extendForm.currentEndDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Duration Unit
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={extendForm.durationType}
                    onChange={(e) => setExtendForm({ ...extendForm, durationType: e.target.value })}
                  >
                    <option value="DAYS">Days</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Value (Positive to extend, Negative to reduce)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={extendForm.durationValue}
                    onChange={(e) => setExtendForm({ ...extendForm, durationValue: e.target.value })}
                    required
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setExtendForm({ ...extendForm, durationType: 'MONTHS', durationValue: 1 })}
                      className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold"
                    >
                      +1 Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtendForm({ ...extendForm, durationType: 'MONTHS', durationValue: 3 })}
                      className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold"
                    >
                      +3 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtendForm({ ...extendForm, durationType: 'YEARS', durationValue: 1 })}
                      className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold"
                    >
                      +1 Year
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExtendModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Confirm Extension</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ============================================================ */}
        {/* MODAL 5: OFFLINE PAYMENT ASSIGNMENT */}
        {/* ============================================================ */}
        {offlineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-emerald-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Offline Payment Assignment</h3>
                    <p className="text-xs text-gray-600">Assign or renew subscription when payment is taken offline</p>
                  </div>
                </div>
                <button
                  onClick={() => setOfflineModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleOfflineSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* User selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Select Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={offlineForm.userId}
                    onChange={(e) => setOfflineForm({ ...offlineForm, userId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose a Client --</option>
                    {users.map((u) => {
                      const hasSub = Boolean(u.subscription);
                      const isExpired = hasSub && new Date(u.subscription.endDate).getTime() < Date.now();
                      const statusText = !hasSub
                        ? 'No active subscription'
                        : isExpired
                        ? `Expired on ${formatDate(u.subscription.endDate)}`
                        : `Active until ${formatDate(u.subscription.endDate)}`;
                      return (
                        <option key={u.id} value={u.id}>
                          {u.name || 'Unnamed'} ({u.email}) — [{statusText}]
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Choose from predefined package */}
                {packages && packages.length > 0 && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Select Defined Package (Auto-Fills Price & Days)</span>
                      </label>
                      <Link
                        href="/admin/subscriptions/packages"
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        Packages Catalog ↗
                      </Link>
                    </div>
                    <select
                      className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      onChange={(e) => {
                        const pkg = packages.find((p) => String(p.id) === e.target.value);
                        if (pkg) {
                          setOfflineForm((prev) => ({
                            ...prev,
                            amount: String(pkg.price),
                            durationPreset: String(pkg.durationDays),
                            notes: `Package: ${pkg.name}`,
                          }));
                        }
                      }}
                    >
                      <option value="">-- Choose Package Preset (Optional) --</option>
                      {packages.filter((p) => p.isActive).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{Number(p.price).toLocaleString('en-IN')} ({p.durationDays} days)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* If selected user already has a subscription, show existing details and renewal mode */}
                {(() => {
                  const selectedUserObj = users.find((u) => String(u.id) === String(offlineForm.userId));
                  if (!selectedUserObj?.subscription) return null;
                  const existingSub = selectedUserObj.subscription;
                  const isExistingExpired = new Date(existingSub.endDate).getTime() < Date.now();

                  return (
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle size={15} className="text-amber-600 shrink-0" />
                        <span>Client Already Has an Existing Subscription Record</span>
                      </div>
                      <p className="text-gray-600">
                        Current Status: <b className={isExistingExpired ? 'text-red-600' : 'text-green-600'}>{isExistingExpired ? 'EXPIRED' : existingSub.status}</b> | Expiration Date: <b>{formatDate(existingSub.endDate)}</b>
                      </p>
                      <div className="pt-1 border-t border-amber-200">
                        <label className="block font-bold text-gray-800 mb-1">Renewal Strategy:</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="renewalMode"
                              value="EXTEND"
                              checked={offlineForm.renewalMode === 'EXTEND'}
                              onChange={(e) => setOfflineForm({ ...offlineForm, renewalMode: e.target.value })}
                              className="text-emerald-600"
                            />
                            <span>Extend from current expiry date</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="renewalMode"
                              value="OVERWRITE"
                              checked={offlineForm.renewalMode === 'OVERWRITE'}
                              onChange={(e) => setOfflineForm({ ...offlineForm, renewalMode: e.target.value })}
                              className="text-emerald-600"
                            />
                            <span>Start fresh from selected start date</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Offline Payment Details */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote size={14} className="text-emerald-600" /> Offline Payment Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Payment Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={offlineForm.paymentMethod}
                        onChange={(e) => setOfflineForm({ ...offlineForm, paymentMethod: e.target.value })}
                        required
                      >
                        <option value="Cash">Cash (Hand-to-Hand)</option>
                        <option value="Bank Transfer / NEFT">Bank Transfer (NEFT / RTGS / IMPS)</option>
                        <option value="UPI / QR Code">UPI / QR Code (PhonePe, GPay, Paytm)</option>
                        <option value="Cheque / DD">Cheque / Demand Draft</option>
                        <option value="Corporate Invoice">Corporate Invoice / Purchase Order</option>
                        <option value="Other Offline">Other Offline Arrangement</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Amount Paid (₹)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 39999"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={offlineForm.amount}
                        onChange={(e) => setOfflineForm({ ...offlineForm, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Receipt / Transaction Reference No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RCPT-2026-081, UPI/39102910, CHQ#49102"
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={offlineForm.paymentReference}
                      onChange={(e) => setOfflineForm({ ...offlineForm, paymentReference: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Admin Notes / Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Received in cash at office, verified by Admin"
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={offlineForm.notes}
                      onChange={(e) => setOfflineForm({ ...offlineForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                {/* Duration Presets */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Plan Duration Preset
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={offlineForm.startDate}
                      onChange={(e) => setOfflineForm({ ...offlineForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    onClick={() => setOfflineModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Assign & Activate Subscription</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
