import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useUiStore } from '../../store/uiStore';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomTabBar from './BottomTabBar';
import PageTransition from './PageTransition';

export default function MainLayout() {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="min-h-screen bg-surface-primary">
      <Sidebar />

      <div
        className={`flex min-h-screen flex-col transition-all duration-normal ${
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[260px]'
        }`}
      >
        <Header />

        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-6">
          <AnimatePresence mode="wait">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom tabs - Add navigates to transactions page */}
      <BottomTabBar onAddClick={() => window.location.assign('/transactions?add=true')} />
    </div>
  );
}
