import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useAccountStore } from '../../store/accountStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useUiStore } from '../../store/uiStore';
import { tourSteps } from '../../utils/tourSteps';
import type { TourStepCta, TourStepContext } from '../../types/onboarding';
import TourCard from './TourCard';
import TourSpotlight from './TourSpotlight';

const ANCHOR_POLL_FRAMES = 30;

export default function TourProvider() {
  const isOpen = useOnboardingStore((s) => s.isOpen);
  const pausedForModal = useOnboardingStore((s) => s.pausedForModal);
  const currentStepIndex = useOnboardingStore((s) => s.currentStepIndex);
  const next = useOnboardingStore((s) => s.next);
  const prev = useOnboardingStore((s) => s.prev);
  const close = useOnboardingStore((s) => s.close);
  const pauseForModal = useOnboardingStore((s) => s.pauseForModal);

  const accounts = useAccountStore((s) => s.accounts);
  const transactions = useTransactionStore((s) => s.transactions);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  const navigate = useNavigate();
  const location = useLocation();

  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [routeReady, setRouteReady] = useState(false);
  const internalNavRef = useRef(false);

  const step = tourSteps[currentStepIndex];

  // Navigate to step.route if needed (internal nav).
  useEffect(() => {
    if (!isOpen || !step) return;
    if (location.pathname !== step.route) {
      internalNavRef.current = true;
      navigate(step.route);
      setRouteReady(false);
    } else {
      setRouteReady(true);
      internalNavRef.current = false;
    }
  }, [isOpen, step, location.pathname, navigate]);

  // Resolve anchor element via rAF polling.
  useEffect(() => {
    if (!isOpen || !step || !routeReady) {
      setTarget(null);
      return;
    }
    if (!step.anchor) {
      setTarget(null);
      return;
    }

    let frames = 0;
    let raf = 0;
    let cancelled = false;

    const tryFind = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(step.anchor as string);
      if (el) {
        // FR-025: expand sidebar in mobile if anchor is inside it.
        const sidebar = document.querySelector('[data-tour-sidebar]');
        if (
          sidebar instanceof HTMLElement &&
          sidebar.contains(el) &&
          !sidebarOpen &&
          window.innerWidth < 1024
        ) {
          setSidebarOpen(true);
        }
        setTarget(el);
        return;
      }
      if (frames >= ANCHOR_POLL_FRAMES) {
        // FR-026: warn for diagnostics.
        // eslint-disable-next-line no-console
        console.warn('[onboarding-tour] Anchor not found:', step.id);
        setTarget(null);
        return;
      }
      frames += 1;
      raf = requestAnimationFrame(tryFind);
    };

    raf = requestAnimationFrame(tryFind);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [isOpen, step, routeReady, sidebarOpen, setSidebarOpen]);

  // Esc → skip.
  useEffect(() => {
    if (!isOpen || pausedForModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        void close('skipped');
      } else if (e.key === 'ArrowRight' && step) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          if (currentStepIndex < tourSteps.length - 1) next();
        }
      } else if (e.key === 'ArrowLeft' && step) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          if (currentStepIndex > 0) prev();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, pausedForModal, step, currentStepIndex, close, next, prev]);

  if (!isOpen || !step || pausedForModal) return null;

  // FR-023: pause render if user manually navigated away.
  if (location.pathname !== step.route) return null;

  const ctx: TourStepContext = {
    hasAccounts: accounts.length > 0,
    hasTransactions: transactions.length > 0,
  };

  const handleCta = (cta: TourStepCta) => {
    if (cta.action === 'create-account') {
      pauseForModal();
      window.dispatchEvent(new CustomEvent('onboarding:create-account'));
    } else if (cta.action === 'goto-route' && cta.payload?.route) {
      void close('completed');
      navigate(cta.payload.route);
    }
  };

  const handleFinish = () => {
    void close('completed');
  };

  return (
    <AnimatePresence>
      {step.placement !== 'center' && target ? (
        <TourSpotlight key={`spot-${step.id}`} target={target} />
      ) : null}
      <TourCard
        key={`card-${step.id}`}
        step={step}
        target={target}
        stepIndex={currentStepIndex}
        totalSteps={tourSteps.length}
        ctx={ctx}
        onNext={next}
        onPrev={prev}
        onSkip={() => void close('skipped')}
        onFinish={handleFinish}
        onCta={handleCta}
      />
    </AnimatePresence>
  );
}
