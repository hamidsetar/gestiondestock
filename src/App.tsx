import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Rentals from './components/Rentals';
import Clients from './components/Clients';
import Users from './components/Users';

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
      case 'users':
        return <Users />;
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;