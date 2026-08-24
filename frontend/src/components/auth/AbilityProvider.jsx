'use client';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AbilityContext, buildAbilityFor } from '@/lib/ability';

export default function AbilityProvider({ children }) {
  const user = useSelector((state) => state.auth.user);
  const permissions = user?.permissions || [];
  
  const ability = useMemo(() => {
    return buildAbilityFor(permissions, user?.role);
  }, [permissions, user?.role]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
