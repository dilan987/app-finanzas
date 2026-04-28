import { useEffect } from 'react';
import { useOnboardingStore } from '../store/onboardingStore';
import { useAuthStore } from '../store/authStore';

export function useOnboardingTour(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateFromServer = useOnboardingStore((s) => s.hydrateFromServer);
  const hydrated = useOnboardingStore((s) => s.hydrated);

  useEffect(() => {
    if (isAuthenticated && !hydrated) {
      void hydrateFromServer();
    }
  }, [isAuthenticated, hydrated, hydrateFromServer]);
}
