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
  const { theme, toggleTheme, toggleSidebar } = useUiStore();
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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 sm:px-6">
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
        aria-label="Abrir menu"
      >
        <HiBars3 className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>

      {/* Month selector (center) */}
      <div className="hidden flex-1 justify-center md:flex">
        <MonthSelector />
      </div>

      {/* Spacer for mobile */}
      <div className="flex-1 md:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
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
            className="flex items-center gap-2 rounded-lg p-1.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
              {user?.name.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <span className="hidden text-sm font-medium sm:block">
              {user?.name ?? 'Usuario'}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <HiUserCircle className="h-4 w-4" />
                Perfil
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <HiCog6Tooth className="h-4 w-4" />
                Configuracion
              </button>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
