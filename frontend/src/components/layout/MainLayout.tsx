import { Outlet } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const { sidebarOpen } = useUiStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      {/* Main content area */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        <Header />

        <main className="flex-1 p-4 sm:p-6">{<Outlet />}</main>
      </div>
    </div>
  );
}
