import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import {
  TrendingUp,
  Package,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { Product, Sale, Rental, Client } from '../types';

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Chargement des données du dashboard...');
        
        // Test de connexion d'abord
        const connectionOk = await SupabaseService.testConnection();
        if (!connectionOk) {
          throw new Error('Impossible de se connecter à Supabase');
        }
        
        const [productsData, salesData, rentalsData, clientsData] = await Promise.all([
          SupabaseService.getProducts(),
          SupabaseService.getSales(),
          SupabaseService.getRentals(),
          SupabaseService.getClients()
        ]);

        console.log('📊 Données récupérées:');
        console.log('- Produits:', productsData.length);
        console.log('- Ventes:', salesData.length);
        console.log('- Locations:', rentalsData.length);
        console.log('- Clients:', clientsData.length);

        setProducts(productsData);
        setSales(salesData);
        setRentals(rentalsData);
        setClients(clientsData);
        setError(null);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données du dashboard:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center px-4">
          <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm sm:text-base"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalProducts = products.reduce((sum, product) => sum + product.stock, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  
  // Calcul des bénéfices
  const totalProfit = sales.reduce((sum, sale) => {
    const product = products.find(p => p.id === sale.productId);
    if (product) {
      const profit = (sale.unitPrice - product.purchasePrice) * sale.quantity;
      return sum + profit;
    }
    return sum;
  }, 0);
  
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  
  const totalRentals = rentals.reduce((sum, rental) => sum + rental.totalAmount, 0);
  
  const activeRentals = rentals.filter(rental => rental.status === 'active').length;
  const overdueRentals = rentals.filter(rental => 
    rental.status === 'active' && isAfter(new Date(), new Date(rental.endDate))
  ).length;
  
  const recentSales = sales.filter(sale => 
    isAfter(new Date(sale.createdAt), subDays(new Date(), 30))
  ).length;

  const lowStockProducts = products.filter(product => product.stock < 5);

  const stats = [
    {
      title: 'Chiffre d\'affaires',
      value: `${totalSales.toFixed(2)} DA`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      trend: `Marge: ${profitMargin.toFixed(1)}%`
    },
    {
      title: 'Bénéfices',
      value: `${totalProfit.toFixed(2)} DA`,
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: `${profitMargin.toFixed(1)}% de marge`
    },
    {
      title: 'Produits en stock',
      value: totalProducts.toString(),
      icon: Package,
      color: 'bg-teal-500',
      trend: `${lowStockProducts.length} en rupture`
    },
    {
      title: 'Locations actives',
      value: activeRentals.toString(),
      icon: Calendar,
      color: 'bg-cyan-500',
      trend: `${overdueRentals} en retard`
    },
    {
      title: 'Clients',
      value: clients.length.toString(),
      icon: Users,
      color: 'bg-blue-500',
      trend: `${recentSales} ventes récentes`
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          Dernière mise à jour: {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </p>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2 break-words">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{stat.trend}</p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2`}>
                  <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts - Responsive */}
      {(lowStockProducts.length > 0 || overdueRentals > 0) && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Alertes</h2>
          </div>
          
          <div className="space-y-3">
            {lowStockProducts.length > 0 && (
              <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h3 className="font-medium text-orange-800 dark:text-orange-300 text-sm sm:text-base">Produits en rupture de stock</h3>
                <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400 mt-1">
                  {lowStockProducts.length} produit(s) ont un stock inférieur à 5 unités
                </p>
                <div className="mt-2 space-y-1">
                  {lowStockProducts.slice(0, 3).map(product => (
                    <p key={product.id} className="text-xs text-orange-600 dark:text-orange-400 break-words">
                      • {product.name} (Stock: {product.stock})
                    </p>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ... et {lowStockProducts.length - 3} autre(s)
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {overdueRentals > 0 && (
              <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-medium text-red-800 dark:text-red-300 text-sm sm:text-base">Locations en retard</h3>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 mt-1">
                  {overdueRentals} location(s) sont en retard de retour
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4">Ventes récentes</h2>
          <div className="space-y-3">
            {sales.slice(-5).reverse().map((sale) => {
              const client = clients.find(c => c.id === sale.clientId);
              const product = products.find(p => p.id === sale.productId);
              return (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white text-sm sm:text-base truncate">
                      {client?.firstName} {client?.lastName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{product?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-medium text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">{sale.totalAmount.toFixed(2)} DA</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(sale.createdAt), 'dd/MM HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
            {sales.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm sm:text-base">Aucune vente enregistrée</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4">Locations actives</h2>
          <div className="space-y-3">
            {rentals.filter(r => r.status === 'active').slice(-5).map((rental) => {
              const client = clients.find(c => c.id === rental.clientId);
              const product = products.find(p => p.id === rental.productId);
              const isOverdue = isAfter(new Date(), new Date(rental.endDate));
              
              return (
                <div key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white text-sm sm:text-base truncate">
                      {client?.firstName} {client?.lastName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{product?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-xs sm:text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'}`}>
                      {isOverdue ? 'En retard' : 'Active'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Fin: {format(new Date(rental.endDate), 'dd/MM')}
                    </p>
                  </div>
                </div>
              );
            })}
            {rentals.filter(r => r.status === 'active').length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm sm:text-base">Aucune location active</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;