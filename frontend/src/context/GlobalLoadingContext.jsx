import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DTB_GLOBAL_LOADING_END_EVENT,
  DTB_GLOBAL_LOADING_START_EVENT,
} from '../utils/globalLoadingEvents.js';

const GlobalLoadingContext = createContext(null);

export function GlobalLoadingProvider({ children }) {
  const [activeLoadCount, setActiveLoadCount] = useState(0);

  const beginLoading = useCallback(() => {
    setActiveLoadCount((count) => count + 1);
  }, []);

  const endLoading = useCallback(() => {
    setActiveLoadCount((count) => (count > 0 ? count - 1 : 0));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleGlobalLoadingStart = () => {
      setActiveLoadCount((count) => count + 1);
    };

    const handleGlobalLoadingEnd = () => {
      setActiveLoadCount((count) => (count > 0 ? count - 1 : 0));
    };

    window.addEventListener(DTB_GLOBAL_LOADING_START_EVENT, handleGlobalLoadingStart);
    window.addEventListener(DTB_GLOBAL_LOADING_END_EVENT, handleGlobalLoadingEnd);

    return () => {
      window.removeEventListener(DTB_GLOBAL_LOADING_START_EVENT, handleGlobalLoadingStart);
      window.removeEventListener(DTB_GLOBAL_LOADING_END_EVENT, handleGlobalLoadingEnd);
    };
  }, []);

  const value = useMemo(() => ({
    activeLoadCount,
    isLoading: activeLoadCount > 0,
    beginLoading,
    endLoading,
  }), [activeLoadCount, beginLoading, endLoading]);

  return <GlobalLoadingContext.Provider value={value}>{children}</GlobalLoadingContext.Provider>;
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider.');
  }
  return context;
}
