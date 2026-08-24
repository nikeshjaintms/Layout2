'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import AbilityProvider from '@/components/auth/AbilityProvider';

export default function StoreProvider({ children }) {
  return (
    <Provider store={store}>
      <AbilityProvider>
        {children}
      </AbilityProvider>
    </Provider>
  );
}
