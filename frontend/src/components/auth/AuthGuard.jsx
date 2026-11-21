'use client';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { initializeAuth } from '@/redux/slices/authSlice';
import { AbilityContext } from '@/lib/ability';
import { useContext } from 'react';

export default function AuthGuard({ children, requiredRole, requirePermission }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useSelector((state) => state.auth);
  const ability = useContext(AbilityContext);

  useEffect(() => {
    if (status === 'loading' && !user) {
      // If user isn't loaded yet, try to initialize
      dispatch(initializeAuth());
    }
  }, [dispatch, status, user]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const isAdmin = user?.role === 'ADMIN';
      const isSubActive = Boolean(
        user?.isSubscriptionActive ||
        (user?.subscription &&
          user.subscription.status === 'ACTIVE' &&
          new Date(user.subscription.endDate).getTime() > Date.now())
      );

      // Subscription check: non-admin users without active subscription cannot access dashboard
      if (!isAdmin && !isSubActive) {
        if (pathname !== '/subscription' && !pathname.startsWith('/projects')) {
          router.push('/subscription');
          return;
        }
      }

      if (requiredRole && user?.role !== requiredRole && !requirePermission) {
        if (user?.role === 'CLIENT') {
          if (isSubActive) {
            router.push('/cad-conversion');
          } else {
            router.push('/subscription');
          }
        } else {
          router.push('/login');
        }
        return;
      }

      if (requirePermission) {
        const { action, subject } = requirePermission;
        if (!ability.can(action, subject)) {
          router.push('/unauthorized');
        }
      }
    }
  }, [status, user, requiredRole, requirePermission, router, ability, pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FDF6ED] text-gray-800">
        <div className="w-8 h-8 border-4 border-[#ABD2FA] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FDF6ED] text-gray-800">
        <div className="w-8 h-8 border-4 border-[#ABD2FA] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const isSubActive = Boolean(
    user?.isSubscriptionActive ||
    (user?.subscription &&
      user.subscription.status === 'ACTIVE' &&
      new Date(user.subscription.endDate).getTime() > Date.now())
  );

  // Block rendering dashboard pages if non-admin has no active subscription
  if (!isAdmin && !isSubActive && pathname !== '/subscription' && !pathname.startsWith('/projects')) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole && !requirePermission) return null;

  if (requirePermission) {
    const { action, subject } = requirePermission;
    if (!ability.can(action, subject)) return null;
  }

  return <>{children}</>;
}
