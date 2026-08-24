'use client';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { initializeAuth } from '@/redux/slices/authSlice';
import { AbilityContext } from '@/lib/ability';
import { useContext } from 'react';

export default function AuthGuard({ children, requiredRole, requirePermission }) {
  const dispatch = useDispatch();
  const router = useRouter();
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
      // Note: We bypass strict `requiredRole` enforcement if it's 'ADMIN'
      // to let CASL handle the real logic, but keep it for fallback/routing.
      if (requiredRole && user?.role !== requiredRole && !requirePermission) {
        if (user?.role === 'CLIENT') {
          router.push('/cad-conversion');
        } else {
          router.push('/login');
        }
      }

      if (requirePermission) {
        const { action, subject } = requirePermission;
        if (!ability.can(action, subject)) {
          router.push('/unauthorized'); // or somewhere else safe, like dashboard if they can access it, or login
        }
      }
    }
  }, [status, user, requiredRole, requirePermission, router, ability]);

  if (status === 'loading') return null;
  
  if (status === 'unauthenticated') return null;
  
  if (requiredRole && user?.role !== requiredRole && !requirePermission) return null;

  if (requirePermission) {
    const { action, subject } = requirePermission;
    if (!ability.can(action, subject)) return null;
  }

  return <>{children}</>;
}
