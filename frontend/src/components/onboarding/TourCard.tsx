import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  type Placement,
} from '@floating-ui/react';
import FocusLock from 'react-focus-lock';
import type { TourStep, TourStepCta, TourStepContext } from '../../types/onboarding';

interface TourCardProps {
  step: TourStep;
  target: HTMLElement | null;
  stepIndex: number;
  totalSteps: number;
  ctx: TourStepContext;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onCta: (cta: TourStepCta) => void;
}

const PLACEMENT_MAP: Record<TourStep['placement'], Placement> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  center: 'bottom',
};

export default function TourCard({
  step,
  target,
  stepIndex,
  totalSteps,
  ctx,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  onCta,
}: TourCardProps) {
  const reduce = useReducedMotion();
  const isCenter = step.placement === 'center' || !target;
  const isLast = stepIndex === totalSteps - 1;
  const titleId = `tour-title-${step.id}`;
  const descId = `tour-desc-${step.id}`;
  const primaryRef = useRef<HTMLButtonElement>(null);

  const { refs, floatingStyles } = useFloating({
    placement: PLACEMENT_MAP[step.placement],
    middleware: [offset(12), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
    open: !isCenter,
  });

  useEffect(() => {
    if (!isCenter && target) {
      refs.setReference(target);
    }
  }, [target, isCenter, refs]);

  useEffect(() => {
    primaryRef.current?.focus();
  }, [step.id]);

  const cta = step.cta ?? step.ctaResolver?.(ctx);
  const showCta = !!cta && (cta.showWhen?.(ctx) ?? true);
  const showAccountsHint =
    step.id === 'accounts-intro' && ctx.hasAccounts;

  const card = (
    <FocusLock returnFocus>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: reduce ? 0 : 0.18, ease: 'easeOut' }}
        className="pointer-events-auto w-[min(92vw,22rem)] rounded-xl border border-border-primary bg-surface-card p-5 shadow-2xl"
      >
        <div className="mb-2 text-xs font-medium text-text-tertiary">
          Paso {stepIndex + 1} de {totalSteps} · {step.section}
        </div>
        <h2
          id={titleId}
          className="text-lg font-semibold text-text-primary"
        >
          {step.title}
        </h2>
        <p id={descId} className="mt-2 text-sm text-text-secondary">
          {step.description}
        </p>

        {showCta && cta ? (
          <button
            type="button"
            onClick={() => onCta(cta)}
            className="mt-4 w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {cta.label}
          </button>
        ) : null}

        {showAccountsHint ? (
          <p className="mt-3 rounded-md bg-surface-secondary dark:bg-surface-tertiary px-3 py-2 text-xs text-text-tertiary">
            Ya tienes cuentas creadas. ¡Bien hecho!
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-text-tertiary hover:text-text-primary focus:outline-none focus:underline"
          >
            Saltar
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={stepIndex === 0}
              className="rounded-lg border border-border-primary px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary dark:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            {isLast ? (
              <button
                ref={primaryRef}
                type="button"
                onClick={onFinish}
                className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                Finalizar
              </button>
            ) : (
              <button
                ref={primaryRef}
                type="button"
                onClick={onNext}
                className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </FocusLock>
  );

  if (typeof document === 'undefined') return null;

  if (isCenter) {
    return createPortal(
      <div className="fixed inset-0 z-[1010] flex items-center justify-center px-4">
        {card}
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-[1010]"
    >
      {card}
    </div>,
    document.body,
  );
}
