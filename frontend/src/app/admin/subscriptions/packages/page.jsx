'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  fetchSubscriptionPackages,
  createPackage,
  updatePackage,
  deletePackage,
  fetchSubscriptions,
} from '@/redux/slices/subscriptionsSlice';
import {
  Layers,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  IndianRupee,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Tag,
  ListChecks,
  Sliders,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function SubscriptionPackagesPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { packages, packagesLoading, items: subscriptions } = useSelector(
    (state) => state.subscriptions
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    durationValue: 1,
    durationType: 'MONTHS',
    features: [''],
    isPopular: false,
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchSubscriptionPackages());
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  const handleOpenCreate = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      durationValue: 1,
      durationType: 'MONTHS',
      features: [
        'CAD Layout Projects Support',
        'DXF & DWG Vector Conversion',
        'Interactive Plot Mapping',
        'Public Portal Link Sharing',
      ],
      isPopular: false,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      slug: pkg.slug || '',
      description: pkg.description || '',
      price: pkg.price || '',
      durationValue: pkg.durationValue || 1,
      durationType: pkg.durationType || 'MONTHS',
      features: pkg.features && pkg.features.length > 0 ? [...pkg.features] : [''],
      isPopular: !!pkg.isPopular,
      isActive: pkg.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleFeatureChange = (index, value) => {
    const next = [...formData.features];
    next[index] = value;
    setFormData({ ...formData, features: next });
  };

  const handleAddFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const handleRemoveFeature = (index) => {
    const next = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: next.length > 0 ? next : [''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please enter a package name.',
        background: '#18181b',
        color: '#fff',
      });
      return;
    }

    if (formData.price === '' || isNaN(Number(formData.price))) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please enter a valid price amount.',
        background: '#18181b',
        color: '#fff',
      });
      return;
    }

    const cleanedFeatures = formData.features
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: formData.description.trim(),
      price: Number(formData.price),
      durationValue: Number(formData.durationValue) || 1,
      durationType: formData.durationType,
      features: cleanedFeatures,
      isPopular: Boolean(formData.isPopular),
      isActive: Boolean(formData.isActive),
    };

    setSubmitting(true);
    try {
      if (editingPackage) {
        await dispatch(
          updatePackage({ id: editingPackage.id, data: payload })
        ).unwrap();
        Swal.fire({
          icon: 'success',
          title: 'Package Updated!',
          text: `"${payload.name}" has been updated successfully.`,
          timer: 1800,
          showConfirmButton: false,
          background: '#18181b',
          color: '#fff',
        });
      } else {
        await dispatch(createPackage(payload)).unwrap();
        Swal.fire({
          icon: 'success',
          title: 'Package Created!',
          text: `"${payload.name}" has been created and is ready for assignment.`,
          timer: 1800,
          showConfirmButton: false,
          background: '#18181b',
          color: '#fff',
        });
      }
      setModalOpen(false);
      dispatch(fetchSubscriptionPackages());
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: err || 'Could not save subscription package.',
        background: '#18181b',
        color: '#fff',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pkg) => {
    const result = await Swal.fire({
      title: 'Delete Package?',
      text: `Are you sure you want to delete "${pkg.name}"? Existing active subscriptions will remain intact.`,
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
        await dispatch(deletePackage(pkg.id)).unwrap();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `"${pkg.name}" has been deleted.`,
          timer: 1500,
          showConfirmButton: false,
          background: '#18181b',
          color: '#fff',
        });
        dispatch(fetchSubscriptionPackages());
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err || 'Could not delete package.',
          background: '#18181b',
          color: '#fff',
        });
      }
    }
  };

  const handleAssignShortcut = (pkg) => {
    router.push(
      `/admin/subscriptions?assignPackageId=${pkg.id}&packageName=${encodeURIComponent(
        pkg.name
      )}&durationDays=${pkg.durationDays || 30}&price=${pkg.price}`
    );
  };

  return (
    <AuthGuard requireRole="ADMIN">
      <div className="p-4 md:p-8 h-full flex flex-col font-sans max-w-7xl mx-auto w-full space-y-6">
        {/* TWO-OPTION TAB SWITCHER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="inline-flex items-center p-1.5 bg-gray-100 rounded-2xl border border-gray-200 shadow-inner">
            <button
              type="button"
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all bg-white text-gray-900 shadow-sm border border-gray-200/80"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Subscription Packages</span>
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold">
                {packages?.length || 0}
              </span>
            </button>

            <Link
              href="/admin/subscriptions"
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-gray-600 hover:text-gray-900 hover:bg-white/60"
            >
              <UserCheck className="w-4 h-4 text-gray-500" />
              <span>Assign Subscriptions</span>
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700 font-semibold">
                {subscriptions?.length || 0}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => dispatch(fetchSubscriptionPackages())}
              className="p-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition-all"
              title="Refresh Packages"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#ABD2FA] hover:bg-[#8bbefa] text-gray-900 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>Create New Package</span>
            </button>
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-[#FDF6ED] text-[#0f111a] rounded-2xl border border-[#ABD2FA]">
              <Layers className="w-7 h-7 text-[#0f111a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Subscription Packages & Plans
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Option 1: Packages Catalog
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Configure your pricing tiers, validity durations, and included features for client accounts.
              </p>
            </div>
          </div>
        </div>

        {/* PACKAGES GRID */}
        {packagesLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500 bg-white rounded-2xl border border-gray-200">
            <RefreshCw className="w-8 h-8 animate-spin text-[#ABD2FA] mb-3" />
            <p className="font-semibold text-gray-700">Loading subscription packages...</p>
          </div>
        ) : packages && packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative flex flex-col bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                  pkg.isPopular
                    ? 'border-[#ABD2FA] ring-2 ring-[#ABD2FA]/40 shadow-md'
                    : 'border-gray-200 shadow-sm'
                } ${!pkg.isActive ? 'opacity-70 bg-gray-50/70' : ''}`}
              >
                {/* Popular Ribbon */}
                {pkg.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Card Top / Header */}
                <div className="p-6 pb-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        slug: {pkg.slug || 'custom'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          pkg.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 font-medium mt-3 line-clamp-2 min-h-[32px]">
                    {pkg.description || 'Standard subscription tier for land developers and CAD planners.'}
                  </p>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-gray-900">
                      ₹{Number(pkg.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      / {pkg.durationValue} {pkg.durationType?.toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Validity: <strong>{pkg.durationDays} days</strong></span>
                  </div>
                </div>

                {/* Features List */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Included Capabilities
                    </h4>
                    <ul className="space-y-2.5">
                      {pkg.features && pkg.features.length > 0 ? (
                        pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-gray-400 italic">No specific features listed.</li>
                      )}
                    </ul>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-2.5">
                    <button
                      onClick={() => handleAssignShortcut(pkg)}
                      className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <UserCheck className="w-4 h-4 text-[#ABD2FA]" />
                      <span>Assign This Package to Client</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-400" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(pkg)}
                        className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        <span>Edit Package</span>
                      </button>
                      <button
                        onClick={() => handleDelete(pkg)}
                        className="py-2 px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        title="Delete Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">No Packages Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-5">
              Create your first subscription package to start offering structured plans to clients.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-[#ABD2FA] hover:bg-[#8bbefa] text-gray-900 font-bold rounded-xl shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Package</span>
            </button>
          </div>
        )}

        {/* MODAL: CREATE / EDIT PACKAGE */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#FDF6ED]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-gray-900">
                    <Layers className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      {editingPackage ? 'Edit Subscription Package' : 'Create Subscription Package'}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Define pricing, billing duration, and feature bullet points.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Plan Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starter Plan, Professional Plan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA] text-sm font-semibold"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of who this plan is tailored for..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA] text-sm resize-none"
                  />
                </div>

                {/* Price and Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Price (₹ INR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        placeholder="39999"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA] text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Validity Period *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={formData.durationValue}
                        onChange={(e) =>
                          setFormData({ ...formData, durationValue: parseInt(e.target.value, 10) || 1 })
                        }
                        className="w-20 px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA] text-sm font-bold text-center"
                      />
                      <select
                        value={formData.durationType}
                        onChange={(e) => setFormData({ ...formData, durationType: e.target.value })}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA] text-sm font-semibold bg-white"
                      >
                        <option value="DAYS">Days</option>
                        <option value="MONTHS">Month(s)</option>
                        <option value="YEARS">Year(s)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Included Features
                    </label>
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Feature
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feat, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <input
                          type="text"
                          placeholder="e.g. Unlimited CAD Conversions"
                          value={feat}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ABD2FA] text-xs font-medium"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Toggles: Popular & Active */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Mark as &quot;Most Popular&quot; Tier
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Active (Visible for Assignment & Clients)
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#ABD2FA] hover:bg-[#8bbefa] text-gray-900 text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingPackage ? 'Save Changes' : 'Create Package'}</span>
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