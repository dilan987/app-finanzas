import { NavLink } from 'react-router-dom';
import {
  HiHome,
  HiBuildingLibrary,
  HiArrowsRightLeft,
  HiTag,
  HiCalculator,
  HiArrowPath,
  HiChartBar,
  HiChartPie,
  HiDocumentText,
  HiChevronDoubleLeft,
  HiArrowRightOnRectangle,
} from 'react-icons/hi2';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <HiHome className="h-5 w-5" /> },
  { label: 'Cuentas', path: '/accounts', icon: <HiBuildingLibrary className="h-5 w-5" /> },
  { label: 'Transacciones', path: '/transactions', icon: <HiArrowsRightLeft className="h-5 w-5" /> },
  { label: 'Categorias', path: '/categories', icon: <HiTag className="h-5 w-5" /> },
  { label: 'Presupuestos', path: '/budgets', icon: <HiCalculator className="h-5 w-5" /> },
  { label: 'Recurrentes', path: '/recurring', icon: <HiArrowPath className="h-5 w-5" /> },
  { label: 'Inversiones', path: '/investments', icon: <HiChartBar className="h-5 w-5" /> },
  { label: 'Analisis', path: '/analytics', icon: <HiChartPie className="h-5 w-5" /> },
  { label: 'Reportes', path: '/reports', icon: <HiDocumentText className="h-5 w-5" /> },
];

export default function Sidebar() {
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, setSidebarOpen } = useUiStore();
  const { user, logout } = useAuthStore();

  const isCollapsed = sidebarCollapsed && !sidebarOpen;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-sidebar bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-sidebar flex flex-col border-r border-border-primary
          bg-surface-card transition-all duration-normal
          ${sidebarOpen
            ? 'w-[260px]'
            : isCollapsed
              ? 'hidden w-0 lg:flex lg:w-[68px]'
              : 'hidden w-0 lg:flex lg:w-[260px]'
          }
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border-primary px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 font-bold text-white">
            F
          </div>
          {(!isCollapsed || sidebarOpen) && (
            <span className="text-lg font-bold text-text-primary">Finanzas</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400'
                    : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                } ${isCollapsed && !sidebarOpen ? 'justify-center' : ''}`
              }
              title={isCollapsed && !sidebarOpen ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {(!isCollapsed || sidebarOpen) && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border-primary p-3">
          {user && (!isCollapsed || sidebarOpen) && (
            <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-400">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
                <p className="truncate text-xs text-text-tertiary">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => void logout()}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-expense-bg hover:text-expense dark:hover:bg-[rgba(239,68,68,0.08)] dark:hover:text-expense-light ${
              isCollapsed && !sidebarOpen ? 'justify-center' : ''
            }`}
            title={isCollapsed && !sidebarOpen ? 'Cerrar sesion' : undefined}
          >
            <HiArrowRightOnRectangle className="h-5 w-5 shrink-0" />
            {(!isCollapsed || sidebarOpen) && <span>Cerrar sesion</span>}
          </button>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={toggleSidebarCollapsed}
            className={`mt-1 hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-secondary lg:flex ${
              isCollapsed && !sidebarOpen ? 'justify-center' : ''
            }`}
          >
            <HiChevronDoubleLeft
              className={`h-5 w-5 shrink-0 transition-transform duration-normal ${isCollapsed && !sidebarOpen ? 'rotate-180' : ''}`}
            />
            {(!isCollapsed || sidebarOpen) && <span>Colapsar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
