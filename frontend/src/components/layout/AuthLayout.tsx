import { type ReactNode } from 'react';
import { motion } from 'motion/react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface-primary">
      {/* Left: Branding panel (desktop only) */}
      <div className="relative hidden w-[55%] overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600" />
        {/* Decorative elements */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-white/5" />
        <div className="absolute bottom-40 left-20 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 font-bold text-white text-lg backdrop-blur-sm">
              F
            </div>
            <span className="text-xl font-bold text-white">Finanzas</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Toma el control de tus finanzas personales
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/70">
              Gestiona tus ingresos, gastos, presupuestos e inversiones en un solo lugar.
              Visualiza tu progreso financiero con herramientas profesionales.
            </p>
          </div>

          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Finanzas App
          </p>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10 lg:p-16">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 font-bold text-white">
              F
            </div>
            <span className="text-lg font-bold text-text-primary">Finanzas</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-base text-text-secondary">{subtitle}</p>
          )}

          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
