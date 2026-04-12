import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiBars3,
  HiSun,
  HiMoon,
  HiUserCircle,
  HiCog6Tooth,
  HiArrowRightOnRectangle,
} from 'react-icons/hi2';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import MonthSelector from '../ui/MonthSelector';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transacciones',
  '/categories': 'Categorias',
  '/budgets': 'Presupuestos',
  '/recurring': 'Recurrentes',
  '/investments': 'Inversiones',
  '/analytics': 'Analisis',
  '/reports': 'Reportes',
  '/profile': 'Perfil',
  '/settings': 'Configuracion',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, setSidebarOpen } = useUiStore();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Finanzas';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-header flex h-16 items-center gap-4 border-b border-border-primary bg-surface-card/80 px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile menu */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="rounded-lg p-2 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary sm:hidden lg:hidden"
        aria-label="Abrir menu"
      >
        <HiBars3 className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>

      {/* Month selector (center) */}
      <div className="hidden flex-1 justify-center md:flex">
        <MonthSelector />
      </div>

      {/* Spacer */}
      <div className="flex-1 md:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? (
            <HiSun className="h-5 w-5" />
          ) : (
            <HiMoon className="h-5 w-5" />
          )}
        </button>

        {/* User dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-surface-tertiary"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-400">
              {user?.name.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <span className="hidden text-sm font-medium text-text-primary sm:block">
              {user?.name ?? 'Usuario'}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-border-primary bg-surface-card py-1 shadow-lg">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
              >
                <HiUserCircle className="h-4 w-4" />
                Perfil
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
              >
                <HiCog6Tooth className="h-4 w-4" />
                Configuracion
              </button>
              <hr className="my-1 border-border-primary" />
              <button
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-expense transition-colors hover:bg-expense-bg dark:text-expense-light"
              >
                <HiArrowRightOnRectangle className="h-4 w-4" />
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
