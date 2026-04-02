import { NavLink } from 'react-router-dom';
import {
  HiHome,
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
  { label: 'Transacciones', path: '/transactions', icon: <HiArrowsRightLeft className="h-5 w-5" /> },
  { label: 'Categorias', path: '/categories', icon: <HiTag className="h-5 w-5" /> },
  { label: 'Proyección', path: '/budgets', icon: <HiCalculator className="h-5 w-5" /> },
  { label: 'Recurrentes', path: '/recurring', icon: <HiArrowPath className="h-5 w-5" /> },
  { label: 'Inversiones', path: '/investments', icon: <HiChartBar className="h-5 w-5" /> },
  { label: 'Analisis', path: '/analytics', icon: <HiChartPie className="h-5 w-5" /> },
  { label: 'Reportes', path: '/reports', icon: <HiDocumentText className="h-5 w-5" /> },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore();
  const { user, logout } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200
          bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-900
          ${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            F
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Finanzas
            </span>
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
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                } ${!sidebarOpen ? 'justify-center' : ''}`
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          {/* User info */}
          {user && sidebarOpen && (
            <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.name}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={() => void logout()}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
            title={!sidebarOpen ? 'Cerrar sesion' : undefined}
          >
            <HiArrowRightOnRectangle className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Cerrar sesion</span>}
          </button>

          {/* Collapse button (desktop) */}
          <button
            onClick={toggleSidebar}
            className={`mt-1 hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 lg:flex ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
          >
            <HiChevronDoubleLeft
              className={`h-5 w-5 shrink-0 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
            />
            {sidebarOpen && <span>Colapsar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
