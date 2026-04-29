import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  HiHome,
  HiArrowsRightLeft,
  HiPlusCircle,
  HiCalculator,
  HiEllipsisHorizontal,
  HiTag,
  HiArrowPath,
  HiChartBar,
  HiChartPie,
  HiDocumentText,
  HiUserCircle,
  HiCog6Tooth,
  HiXMark,
  HiFlag,
} from 'react-icons/hi2';

interface BottomTabBarProps {
  onAddClick: () => void;
}

const moreItems = [
  { label: 'Metas', path: '/goals', icon: <HiFlag className="h-5 w-5" /> },
  { label: 'Categorias', path: '/categories', icon: <HiTag className="h-5 w-5" /> },
  { label: 'Movimientos programados', path: '/recurring', icon: <HiArrowPath className="h-5 w-5" /> },
  { label: 'Inversiones', path: '/investments', icon: <HiChartBar className="h-5 w-5" /> },
  { label: 'Analisis', path: '/analytics', icon: <HiChartPie className="h-5 w-5" /> },
  { label: 'Reportes', path: '/reports', icon: <HiDocumentText className="h-5 w-5" /> },
  { label: 'Perfil', path: '/profile', icon: <HiUserCircle className="h-5 w-5" /> },
  { label: 'Configuracion', path: '/settings', icon: <HiCog6Tooth className="h-5 w-5" /> },
];

export default function BottomTabBar({ onAddClick }: BottomTabBarProps) {
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const tabClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors ${
      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-text-tertiary'
    }`;

  return (
    <>
      {/* More sheet */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              className="fixed inset-0 z-bottom-tabs bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-modal rounded-t-2xl border-t border-border-primary bg-surface-card pb-safe"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <h3 className="text-base font-semibold text-text-primary">Mas opciones</h3>
                <button
                  onClick={() => setShowMore(false)}
                  className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary"
                >
                  <HiXMark className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 px-4 pb-6">
                {moreItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setShowMore(false);
                      navigate(item.path);
                    }}
                    className="flex flex-col items-center gap-2 rounded-xl p-3 text-text-secondary transition-colors hover:bg-surface-tertiary"
                  >
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-bottom-tabs border-t border-border-primary bg-surface-card/95 backdrop-blur-md pb-safe sm:hidden">
        <div className="grid h-16 grid-cols-5">
          <NavLink to="/dashboard" className={({ isActive }) => tabClass(isActive)}>
            <HiHome className="h-6 w-6" />
            <span>Inicio</span>
          </NavLink>

          <NavLink to="/transactions" className={({ isActive }) => tabClass(isActive)}>
            <HiArrowsRightLeft className="h-6 w-6" />
            <span>Movimientos</span>
          </NavLink>

          <button
            onClick={onAddClick}
            className="flex items-center justify-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-md active:scale-95">
              <HiPlusCircle className="h-7 w-7" />
            </div>
          </button>

          <NavLink to="/budgets" className={({ isActive }) => tabClass(isActive)}>
            <HiCalculator className="h-6 w-6" />
            <span>Presupuesto</span>
          </NavLink>

          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium text-text-tertiary`}
          >
            <HiEllipsisHorizontal className="h-6 w-6" />
            <span>Mas</span>
          </button>
        </div>
      </nav>
    </>
  );
}
