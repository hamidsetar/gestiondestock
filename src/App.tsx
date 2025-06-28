import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Rentals from './components/Rentals';
import Clients from './components/Clients';
import Debts from './components/Debts';
import Users from './components/Users';
import Settings from './components/Settings';
import Statistics from './components/Statistics';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState(() => {
    // Si c'est un agent, commencer par les ventes au lieu du dashboard
    return user?.role === 'agent' ? 'sales' : 'dashboard';
  });

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        // Seuls les admins peuvent voir le dashboard
        return user?.role === 'admin' ? <Dashboard /> : <Sales />;
      case 'products':
        return <Products />;
      case 'sales':
        return <Sales />;
      case 'rentals':
        return <Rentals />;
      case 'clients':
        return <Clients />;
      case 'debts':
        return <Debts />;
      case 'statistics':
        return <Statistics />;
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      default:
        return user?.role === 'admin' ? <Dashboard /> : <Sales />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <AppContent />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;