import api from './axiosInstance';
import type { ApiResponse } from '../types';
import type { OnboardingStateResponse, TourStatus } from '../types/onboarding';

export const onboardingApi = {
  getTour() {
    return api.get<ApiResponse<OnboardingStateResponse>>('/onboarding/tour');
  },
  updateTour(data: { status: TourStatus; version?: string | null }) {
    return api.patch<ApiResponse<OnboardingStateResponse>>('/onboarding/tour', data);
  },
};
