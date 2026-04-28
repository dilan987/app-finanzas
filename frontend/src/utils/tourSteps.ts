import type { TourStep } from '../types/onboarding';

export const TOUR_VERSION = '1';

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    section: 'Bienvenida',
    route: '/dashboard',
    anchor: null,
    title: '¡Te damos la bienvenida!',
    description:
      'Vamos a recorrer rápidamente la app para que sepas dónde está cada cosa. En menos de 2 minutos tendrás claro cómo empezar.',
    placement: 'center',
  },
  {
    id: 'dashboard-overview',
    section: 'Dashboard',
    route: '/dashboard',
    anchor: '[data-tour="dashboard-summary"]',
    title: 'Tu panorama financiero',
    description:
      'Aquí ves tu balance, ingresos y gastos del mes y un resumen general. Es tu punto de partida cada vez que entras.',
    placement: 'bottom',
  },
  {
    id: 'accounts-intro',
    section: 'Cuentas',
    route: '/accounts',
    anchor: '[data-tour="accounts-list"]',
    title: 'Tus cuentas',
    description:
      'Crea cuentas (efectivo, banco, tarjetas) para reflejar tu dinero real. Todas las transacciones se asocian a una cuenta.',
    placement: 'bottom',
    cta: {
      label: 'Crear mi primera cuenta',
      action: 'create-account',
      showWhen: (ctx) => !ctx.hasAccounts,
    },
  },
  {
    id: 'categories-intro',
    section: 'Categorías',
    route: '/categories',
    anchor: '[data-tour="categories-list"]',
    title: 'Categorías',
    description:
      'Clasifica tus ingresos y gastos. Vienen algunas por defecto y puedes crear las tuyas con icono y color.',
    placement: 'bottom',
  },
  {
    id: 'transactions-intro',
    section: 'Transacciones',
    route: '/transactions',
    anchor: '[data-tour="transactions-create"]',
    title: 'Transacciones',
    description:
      'Aquí registras cada movimiento: ingreso, gasto o transferencia entre cuentas. Es el corazón de la app.',
    placement: 'left',
  },
  {
    id: 'budgets-intro',
    section: 'Presupuestos',
    route: '/budgets',
    anchor: '[data-tour="budgets-list"]',
    title: 'Presupuestos',
    description:
      'Define cuánto planeas gastar al mes por categoría y la app te avisa cuando te acercas o pasas el límite.',
    placement: 'bottom',
  },
  {
    id: 'recurring-intro',
    section: 'Recurrentes',
    route: '/recurring',
    anchor: '[data-tour="recurring-list"]',
    title: 'Pagos recurrentes',
    description:
      'Registra una vez los pagos que se repiten (sueldo, arriendo, suscripciones) y la app los proyecta automáticamente.',
    placement: 'bottom',
  },
  {
    id: 'goals-intro',
    section: 'Metas',
    route: '/goals',
    anchor: '[data-tour="goals-list"]',
    title: 'Metas',
    description:
      'Crea metas de ahorro o de pago de deudas con plazos. La app calcula cuotas sugeridas y proyecta tu progreso.',
    placement: 'bottom',
  },
  {
    id: 'investments-intro',
    section: 'Inversiones',
    route: '/investments',
    anchor: '[data-tour="investments-list"]',
    title: 'Inversiones',
    description:
      'Lleva el control de tus inversiones, su rendimiento y compáralas con tu meta de retorno esperado.',
    placement: 'bottom',
  },
  {
    id: 'analytics-intro',
    section: 'Analytics',
    route: '/analytics',
    anchor: '[data-tour="analytics-charts"]',
    title: 'Analítica',
    description:
      'Aquí encuentras gráficos de tendencias, distribución por categoría y comparativas para entender tus hábitos.',
    placement: 'top',
  },
  {
    id: 'reports-intro',
    section: 'Reportes',
    route: '/reports',
    anchor: '[data-tour="reports-export"]',
    title: 'Reportes',
    description:
      'Genera informes mensuales y exporta tus datos cuando los necesites para impuestos o respaldo.',
    placement: 'left',
  },
  {
    id: 'closing',
    section: 'Cierre',
    route: '/dashboard',
    anchor: null,
    title: 'Listo, ya conoces lo esencial',
    description:
      'Empieza por crear una cuenta y registra tu primera transacción. Puedes volver a ver este recorrido desde Configuración cuando quieras.',
    placement: 'center',
    ctaResolver: (ctx) => {
      if (!ctx.hasAccounts) {
        return {
          label: 'Crear mi primera cuenta',
          action: 'goto-route',
          payload: { route: '/accounts' },
        };
      }
      if (!ctx.hasTransactions) {
        return {
          label: 'Registrar mi primera transacción',
          action: 'goto-route',
          payload: { route: '/transactions' },
        };
      }
      return null;
    },
  },
];

export function isStepAccessible(_step: TourStep): boolean {
  return true;
}
