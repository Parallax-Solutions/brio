'use client';

import { useSyncExternalStore } from 'react';

/**
 * Hook to check if the component has mounted (client-side hydration complete)
 * Use this to prevent hydration mismatches for client-only features
 */
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
