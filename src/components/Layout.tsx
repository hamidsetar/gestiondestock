import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  FileText
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false, agentHidden: true },
    { id: 'products', label: 'Produits', icon: Package, adminOnly: true, agentHidden: false },
    { id: 'sales', label: 'Ventes', icon: ShoppingCart, adminOnly: false, agentHidden: false },
    { id: 'rentals', label: 'Locations', icon: Calendar, adminOnly: false, agentHidden: false },
    { id: 'clients', label: 'Clients', icon: Users, adminOnly: false, agentHidden: false },
    { id: 'debts', label: 'Créances', icon: AlertTriangle, adminOnly: false, agentHidden: false },
    { id: 'payments', label: 'Paiements', icon: CreditCard, adminOnly: false, agentHidden: false },
    { id: 'contracts', label: 'Contrats', icon: FileText, adminOnly: false, agentHidden: false },
    { id: 'statistics', label: 'Statistiques', icon: BarChart3, adminOnly: true, agentHidden: false },
    { id: 'analytics', label: 'Organigrammes', icon: TrendingUp, adminOnly: true, agentHidden: false },
    { id: 'users', label: 'Utilisateurs', icon: UserCheck, adminOnly: true, agentHidden: false },
    { id: 'settings', label: 'Paramètres', icon: Settings, adminOnly: false, agentHidden: false },
  ];

  const filteredNavigation = navigationItems.filter(item => {
    // Si c'est un admin, il voit tout sauf les éléments cachés pour les agents
    if (user?.role === 'admin') {
      return !item.adminOnly || user?.role === 'admin';
    }
    // Si c'est un agent, il ne voit pas le dashboard et les éléments admin uniquement
    if (user?.role === 'agent') {
      return !item.adminOnly && !item.agentHidden;
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          {sidebarOpen ? <X className="w-6 h-6 text-gray-600 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800">
            <div className="flex items-center space-x-3">
              <img 
                src="/hali copy.jpg" 
                alt="Hiya Logo" 
                className="w-12 h-12 rounded-lg bg-white p-1"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Hiya</h1>
                <p className="text-sm text-teal-100 mt-1">
                  {user?.firstName} {user?.lastName} ({user?.role})
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-r-4 border-teal-600 dark:border-teal-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;