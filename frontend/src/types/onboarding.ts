export type TourStatus = 'NOT_STARTED' | 'COMPLETED' | 'SKIPPED';

export type TourStepPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStepContext {
  hasAccounts: boolean;
  hasTransactions: boolean;
}

export type TourStepCtaAction = 'create-account' | 'goto-route';

export interface TourStepCta {
  label: string;
  action: TourStepCtaAction;
  payload?: { route?: string };
  showWhen?: (ctx: TourStepContext) => boolean;
}

export interface TourStep {
  id: string;
  section: string;
  route: string;
  anchor: string | null;
  title: string;
  description: string;
  placement: TourStepPlacement;
  cta?: TourStepCta;
  ctaResolver?: (ctx: TourStepContext) => TourStepCta | null;
}

export interface OnboardingStateResponse {
  status: TourStatus;
  version: string | null;
  updatedAt: string | null;
}
