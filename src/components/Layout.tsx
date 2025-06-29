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
  FileText,
  ChevronDown,
  ChevronUp
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
  const [showMoreItems, setShowMoreItems] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false, agentHidden: true, priority: 1 },
    { id: 'products', label: 'Produits', icon: Package, adminOnly: true, agentHidden: false, priority: 1 },
    { id: 'sales', label: 'Ventes', icon: ShoppingCart, adminOnly: false, agentHidden: false, priority: 1 },
    { id: 'rentals', label: 'Locations', icon: Calendar, adminOnly: false, agentHidden: false, priority: 1 },
    { id: 'clients', label: 'Clients', icon: Users, adminOnly: false, agentHidden: false, priority: 1 },
    { id: 'debts', label: 'Créances', icon: AlertTriangle, adminOnly: false, agentHidden: false, priority: 2 },
    { id: 'payments', label: 'Paiements', icon: CreditCard, adminOnly: false, agentHidden: false, priority: 2 },
    { id: 'contracts', label: 'Contrats', icon: FileText, adminOnly: false, agentHidden: false, priority: 2 },
    { id: 'statistics', label: 'Statistiques', icon: BarChart3, adminOnly: true, agentHidden: false, priority: 3 },
    { id: 'analytics', label: 'Organigrammes', icon: TrendingUp, adminOnly: true, agentHidden: false, priority: 3 },
    { id: 'users', label: 'Utilisateurs', icon: UserCheck, adminOnly: true, agentHidden: false, priority: 3 },
    { id: 'settings', label: 'Paramètres', icon: Settings, adminOnly: false, agentHidden: false, priority: 3 },
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

  // Séparer les éléments par priorité pour l'affichage mobile
  const primaryItems = filteredNavigation.filter(item => item.priority === 1);
  const secondaryItems = filteredNavigation.filter(item => item.priority === 2);
  const tertiaryItems = filteredNavigation.filter(item => item.priority === 3);

  const handleNavigation = (pageId: string) => {
    onPageChange(pageId);
    setSidebarOpen(false);
  };

  const NavItem = ({ item }: { item: typeof navigationItems[0] }) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    
    return (
      <button
        onClick={() => handleNavigation(item.id)}
        className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
          isActive
            ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-r-4 border-teal-600 dark:border-teal-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6 text-gray-600 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 sm:w-72 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <img 
                src="/hali copy.jpg" 
                alt="Hiya Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white p-1 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">Hiya</h1>
                <p className="text-xs sm:text-sm text-teal-100 mt-1 truncate">
                  {user?.firstName} {user?.lastName} ({user?.role})
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
            {/* Éléments principaux - toujours visibles */}
            <div className="space-y-1">
              {primaryItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>

            {/* Séparateur si il y a des éléments secondaires */}
            {(secondaryItems.length > 0 || tertiaryItems.length > 0) && (
              <div className="border-t border-gray-200 dark:border-gray-700 my-3 sm:my-4"></div>
            )}

            {/* Éléments secondaires */}
            {secondaryItems.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Gestion
                  </p>
                </div>
                {secondaryItems.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Éléments tertiaires - Collapsibles sur mobile */}
            {tertiaryItems.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-2">
                  <button
                    onClick={() => setShowMoreItems(!showMoreItems)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors lg:cursor-default"
                  >
                    <span>Administration</span>
                    <div className="lg:hidden">
                      {showMoreItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                </div>
                <div className={`space-y-1 ${showMoreItems ? 'block' : 'hidden lg:block'}`}>
                  {tertiaryItems.map((item) => (
                    <NavItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Logout - Fixed at bottom */}
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={logout}
              className="w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 xl:ml-72">
        <div className="p-4 lg:p-6 xl:p-8 pt-16 lg:pt-4">
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