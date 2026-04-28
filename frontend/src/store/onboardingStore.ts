import { create } from 'zustand';
import { onboardingApi } from '../api/onboarding.api';
import { TOUR_VERSION, tourSteps } from '../utils/tourSteps';
import type { TourStatus } from '../types/onboarding';

interface OnboardingState {
  status: TourStatus;
  version: string | null;
  isOpen: boolean;
  pausedForModal: boolean;
  currentStepIndex: number;
  hydrated: boolean;
  hydrating: boolean;

  open: () => void;
  close: (reason: 'completed' | 'skipped') => Promise<void>;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  pauseForModal: () => void;
  resumeFromModal: () => void;
  restart: () => Promise<void>;
  hydrateFromServer: () => Promise<void>;
}

const TOTAL_STEPS = tourSteps.length;

async function persistWithRetry(
  status: TourStatus,
  version: string | null,
  retries = 1,
): Promise<void> {
  try {
    await onboardingApi.updateTour({ status, version });
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return persistWithRetry(status, version, retries - 1);
    }
    // eslint-disable-next-line no-console
    console.warn('[onboarding-tour] Failed to persist tour state:', err);
  }
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  status: 'NOT_STARTED',
  version: null,
  isOpen: false,
  pausedForModal: false,
  currentStepIndex: 0,
  hydrated: false,
  hydrating: false,

  open: () => set({ isOpen: true, currentStepIndex: 0, pausedForModal: false }),

  close: async (reason) => {
    const status: TourStatus = reason === 'completed' ? 'COMPLETED' : 'SKIPPED';
    set({
      isOpen: false,
      pausedForModal: false,
      status,
      version: TOUR_VERSION,
    });
    await persistWithRetry(status, TOUR_VERSION);
  },

  next: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex < TOTAL_STEPS - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  prev: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  goTo: (index) => {
    if (index >= 0 && index < TOTAL_STEPS) {
      set({ currentStepIndex: index });
    }
  },

  pauseForModal: () => set({ pausedForModal: true }),
  resumeFromModal: () => set({ pausedForModal: false }),

  restart: async () => {
    set({
      status: 'NOT_STARTED',
      version: null,
      currentStepIndex: 0,
      isOpen: true,
      pausedForModal: false,
    });
    await persistWithRetry('NOT_STARTED', null);
  },

  hydrateFromServer: async () => {
    if (get().hydrated || get().hydrating) return;
    set({ hydrating: true });
    try {
      const response = await onboardingApi.getTour();
      const data = response.data.data;
      if (!data) {
        set({ hydrated: true, hydrating: false });
        return;
      }
      const shouldOpen =
        data.status === 'NOT_STARTED' || data.version !== TOUR_VERSION;
      set({
        status: data.status,
        version: data.version,
        isOpen: shouldOpen,
        currentStepIndex: 0,
        hydrated: true,
        hydrating: false,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[onboarding-tour] Failed to hydrate tour state:', err);
      set({ hydrated: true, hydrating: false });
    }
  },
}));
