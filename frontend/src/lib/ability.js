import { defineAbility } from '@casl/ability';
import { createContext, useContext } from 'react';

export const buildAbilityFor = (permissions, role) => {
  return defineAbility((can) => {
    if (!permissions || !Array.isArray(permissions)) return;
    
    permissions.forEach((perm) => {
      const parts = perm.split('-');
      if (parts.length >= 2) {
        const action = parts[0];
        const subject = parts.slice(1).join('-');
        can(action, subject);
      }
    });
  });
};

export const AbilityContext = createContext(buildAbilityFor([]));

export function Can({ I, a, children }) {
  const ability = useContext(AbilityContext);
  
  if (ability && ability.can(I, a)) {
    return children;
  }
  
  return null;
}
