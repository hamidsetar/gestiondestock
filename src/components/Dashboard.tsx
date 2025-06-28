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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
      value: `${totalSales.toFixed(2)} DH`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      trend: '+12% ce mois'
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">
          Dernière mise à jour: {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.trend}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {(lowStockProducts.length > 0 || overdueRentals > 0) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Alertes</h2>
          </div>
          
          <div className="space-y-3">
            {lowStockProducts.length > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h3 className="font-medium text-orange-800">Produits en rupture de stock</h3>
                <p className="text-sm text-orange-700 mt-1">
                  {lowStockProducts.length} produit(s) ont un stock inférieur à 5 unités
                </p>
                <div className="mt-2 space-y-1">
                  {lowStockProducts.slice(0, 3).map(product => (
                    <p key={product.id} className="text-xs text-orange-600">
                      • {product.name} (Stock: {product.stock})
                    </p>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <p className="text-xs text-orange-600">
                      ... et {lowStockProducts.length - 3} autre(s)
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {overdueRentals > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-medium text-red-800">Locations en retard</h3>
                <p className="text-sm text-red-700 mt-1">
                  {overdueRentals} location(s) sont en retard de retour
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ventes récentes</h2>
          <div className="space-y-3">
            {sales.slice(-5).reverse().map((sale) => {
              const client = clients.find(c => c.id === sale.clientId);
              const product = products.find(p => p.id === sale.productId);
              return (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">
                      {client?.firstName} {client?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{product?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-emerald-600">{sale.totalAmount.toFixed(2)} DH</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(sale.createdAt), 'dd/MM HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
            {sales.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune vente enregistrée</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Locations actives</h2>
          <div className="space-y-3">
            {rentals.filter(r => r.status === 'active').slice(-5).map((rental) => {
              const client = clients.find(c => c.id === rental.clientId);
              const product = products.find(p => p.id === rental.productId);
              const isOverdue = isAfter(new Date(), new Date(rental.endDate));
              
              return (
                <div key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">
                      {client?.firstName} {client?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{product?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-teal-600'}`}>
                      {isOverdue ? 'En retard' : 'Active'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Fin: {format(new Date(rental.endDate), 'dd/MM')}
                    </p>
                  </div>
                </div>
              );
            })}
            {rentals.filter(r => r.status === 'active').length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune location active</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;