import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Sale, Rental, Product, Client } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Download, 
  FileText,
  Users,
  Package,
  ShoppingCart,
  Clock,
  PieChart,
  Filter
} from 'lucide-react';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import jsPDF from 'jspdf';

interface StatisticsPeriod {
  label: string;
  startDate: Date;
  endDate: Date;
}

const Statistics: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-year');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesData, rentalsData, productsData, clientsData] = await Promise.all([
        SupabaseService.getSales(),
        SupabaseService.getRentals(),
        SupabaseService.getProducts(),
        SupabaseService.getClients()
      ]);
      setSales(salesData);
      setRentals(rentalsData);
      setProducts(productsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodDates = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'current-year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'last-year':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear) };
      case 'current-month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      case 'custom':
        return {
          startDate: customDateRange.startDate ? new Date(customDateRange.startDate) : startOfYear(now),
          endDate: customDateRange.endDate ? new Date(customDateRange.endDate) : endOfYear(now)
        };
      default:
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
    }
  };

  const getFilteredData = () => {
    const { startDate, endDate } = getPeriodDates();
    
    const filteredSales = sales.filter(sale => 
      isWithinInterval(new Date(sale.createdAt), { start: startDate, end: endDate })
    );
    
    const filteredRentals = rentals.filter(rental => 
      isWithinInterval(new Date(rental.createdAt), { start: startDate, end: endDate })
    );
    
    return { filteredSales, filteredRentals, startDate, endDate };
  };

  const calculateStatistics = () => {
    const { filteredSales, filteredRentals } = getFilteredData();
    
    // Statistiques des ventes
    const totalSalesRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalSalesPaid = filteredSales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const totalSalesRemaining = totalSalesRevenue - totalSalesPaid;
    const salesCount = filteredSales.length;
    
    // Statistiques des locations
    const totalRentalsRevenue = filteredRentals.reduce((sum, rental) => sum + rental.totalAmount, 0);
    const totalRentalsPaid = filteredRentals.reduce((sum, rental) => sum + rental.paidAmount, 0);
    const totalRentalsRemaining = totalRentalsRevenue - totalRentalsPaid;
    const rentalsCount = filteredRentals.length;
    
    // Totaux généraux
    const totalRevenue = totalSalesRevenue + totalRentalsRevenue;
    const totalPaid = totalSalesPaid + totalRentalsPaid;
    const totalRemaining = totalSalesRemaining + totalRentalsRemaining;
    const totalTransactions = salesCount + rentalsCount;
    
    // Produits les plus vendus
    const productSales = filteredSales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        const key = product.id;
        if (!acc[key]) {
          acc[key] = { product, quantity: 0, revenue: 0 };
        }
        acc[key].quantity += sale.quantity;
        acc[key].revenue += sale.totalAmount;
      }
      return acc;
    }, {} as Record<string, { product: Product; quantity: number; revenue: number }>);
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Clients les plus actifs
    const clientStats = [...filteredSales, ...filteredRentals].reduce((acc, transaction) => {
      const client = clients.find(c => c.id === transaction.clientId);
      if (client) {
        const key = client.id;
        if (!acc[key]) {
          acc[key] = { client, transactions: 0, revenue: 0 };
        }
        acc[key].transactions += 1;
        acc[key].revenue += transaction.totalAmount;
      }
      return acc;
    }, {} as Record<string, { client: Client; transactions: number; revenue: number }>);
    
    const topClients = Object.values(clientStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Évolution mensuelle
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(2024, i, 1);
      const monthSales = filteredSales.filter(sale => 
        new Date(sale.createdAt).getMonth() === i
      );
      const monthRentals = filteredRentals.filter(rental => 
        new Date(rental.createdAt).getMonth() === i
      );
      
      return {
        month: format(month, 'MMM'),
        sales: monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        rentals: monthRentals.reduce((sum, rental) => sum + rental.totalAmount, 0)
      };
    });
    
    return {
      totalRevenue,
      totalPaid,
      totalRemaining,
      totalTransactions,
      salesCount,
      rentalsCount,
      totalSalesRevenue,
      totalRentalsRevenue,
      topProducts,
      topClients,
      monthlyData
    };
  };

  const generateAccountingReport = () => {
    const { filteredSales, filteredRentals, startDate, endDate } = getFilteredData();
    const stats = calculateStatistics();
    
    const doc = new jsPDF();
    
    // En-tête avec logo
    try {
      doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
    } catch (error) {
      console.log('Logo non trouvé');
    }
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT COMPTABLE - HIYA', 105, 60, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Période: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 105, 75, { align: 'center' });
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 85, { align: 'center' });
    
    let yPosition = 105;
    
    // Résumé financier
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ FINANCIER', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Chiffre d'affaires total: ${stats.totalRevenue.toFixed(2)} DA`, 20, yPosition);
    yPosition += 8;
    doc.text(`Montant encaissé: ${stats.totalPaid.toFixed(2)} DA`, 20, yPosition);
    yPosition += 8;
    doc.text(`Reste à encaisser: ${stats.totalRemaining.toFixed(2)} DA`, 20, yPosition);
    yPosition += 8;
    doc.text(`Nombre de transactions: ${stats.totalTransactions}`, 20, yPosition);
    yPosition += 20;
    
    // Détail par type
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAIL PAR TYPE D\'ACTIVITÉ', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('VENTES:', 20, yPosition);
    yPosition += 8;
    doc.text(`  • Nombre: ${stats.salesCount}`, 25, yPosition);
    yPosition += 6;
    doc.text(`  • Chiffre d'affaires: ${stats.totalSalesRevenue.toFixed(2)} DA`, 25, yPosition);
    yPosition += 10;
    
    doc.text('LOCATIONS:', 20, yPosition);
    yPosition += 8;
    doc.text(`  • Nombre: ${stats.rentalsCount}`, 25, yPosition);
    yPosition += 6;
    doc.text(`  • Chiffre d'affaires: ${stats.totalRentalsRevenue.toFixed(2)} DA`, 25, yPosition);
    yPosition += 20;
    
    // Nouvelle page pour les détails
    doc.addPage();
    yPosition = 30;
    
    // Top produits
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP 10 PRODUITS PAR CHIFFRE D\'AFFAIRES', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    stats.topProducts.forEach((item, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      doc.text(`${index + 1}. ${item.product.name}`, 20, yPosition);
      doc.text(`${item.revenue.toFixed(2)} DA`, 150, yPosition);
      doc.text(`(${item.quantity} unités)`, 180, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
    
    // Top clients
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP 10 CLIENTS PAR CHIFFRE D\'AFFAIRES', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    stats.topClients.forEach((item, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      doc.text(`${index + 1}. ${item.client.firstName} ${item.client.lastName}`, 20, yPosition);
      doc.text(`${item.revenue.toFixed(2)} DA`, 150, yPosition);
      doc.text(`(${item.transactions} transactions)`, 180, yPosition);
      yPosition += 8;
    });
    
    // Nouvelle page pour les transactions détaillées
    doc.addPage();
    yPosition = 30;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAIL DES TRANSACTIONS', 20, yPosition);
    yPosition += 15;
    
    // Ventes détaillées
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VENTES:', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Date', 20, yPosition);
    doc.text('Client', 50, yPosition);
    doc.text('Produit', 100, yPosition);
    doc.text('Montant', 150, yPosition);
    doc.text('Statut', 180, yPosition);
    yPosition += 5;
    
    filteredSales.forEach(sale => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      const client = clients.find(c => c.id === sale.clientId);
      const product = products.find(p => p.id === sale.productId);
      
      doc.text(format(new Date(sale.createdAt), 'dd/MM/yy'), 20, yPosition);
      doc.text(`${client?.firstName} ${client?.lastName}`.substring(0, 20), 50, yPosition);
      doc.text(product?.name?.substring(0, 20) || '', 100, yPosition);
      doc.text(`${sale.totalAmount.toFixed(2)} DA`, 150, yPosition);
      doc.text(sale.status === 'paid' ? 'Payé' : sale.status === 'partial' ? 'Partiel' : 'En attente', 180, yPosition);
      yPosition += 6;
    });
    
    // Sauvegarder le PDF
    const periodLabel = selectedPeriod === 'custom' 
      ? `${format(startDate, 'dd-MM-yyyy')}_${format(endDate, 'dd-MM-yyyy')}`
      : selectedPeriod;
    
    doc.save(`rapport-comptable-hiya-${periodLabel}.pdf`);
  };

  const stats = calculateStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Statistiques & Comptabilité</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={generateAccountingReport}
            className="bg-green-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Rapport Comptable
          </button>
        </div>
      </div>

      {/* Sélection de période - Responsive */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Période d'analyse</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="current-year">Année en cours</option>
            <option value="last-year">Année précédente</option>
            <option value="current-month">Mois en cours</option>
            <option value="last-month">Mois précédent</option>
            <option value="custom">Période personnalisée</option>
          </select>
          
          {selectedPeriod === 'custom' && (
            <>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </>
          )}
        </div>
      </div>

      {/* Statistiques principales - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{stats.totalRevenue.toFixed(0)} DA</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Chiffre d'affaires</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{stats.totalPaid.toFixed(0)} DA</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Encaissé</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{stats.totalRemaining.toFixed(0)} DA</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Reste à encaisser</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTransactions}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Répartition ventes/locations - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Ventes</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Nombre:</span>
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{stats.salesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Chiffre d'affaires:</span>
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{stats.totalSalesRevenue.toFixed(2)} DA</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full" 
                style={{ width: `${(stats.totalSalesRevenue / stats.totalRevenue) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Locations</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Nombre:</span>
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{stats.rentalsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Chiffre d'affaires:</span>
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{stats.totalRentalsRevenue.toFixed(2)} DA</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${(stats.totalRentalsRevenue / stats.totalRevenue) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top produits et clients - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Top 5 Produits</h3>
          </div>
          <div className="space-y-3">
            {stats.topProducts.slice(0, 5).map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{item.product.name}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.quantity} unités vendues</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{item.revenue.toFixed(2)} DA</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 mr-2" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Top 5 Clients</h3>
          </div>
          <div className="space-y-3">
            {stats.topClients.slice(0, 5).map((item, index) => (
              <div key={item.client.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                    {item.client.firstName} {item.client.lastName}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.transactions} transactions</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{item.revenue.toFixed(2)} DA</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Évolution mensuelle - Responsive */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6 gap-4">
          <div className="flex items-center">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Évolution Mensuelle</h3>
          </div>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 sm:gap-2">
          {stats.monthlyData.map((month, index) => {
            const maxValue = Math.max(...stats.monthlyData.map(m => m.sales + m.rentals));
            const totalHeight = ((month.sales + month.rentals) / maxValue) * 100;
            const salesHeight = (month.sales / (month.sales + month.rentals)) * totalHeight;
            const rentalsHeight = (month.rentals / (month.sales + month.rentals)) * totalHeight;
            
            return (
              <div key={index} className="text-center">
                <div className="h-20 sm:h-32 flex flex-col justify-end mb-2">
                  <div 
                    className="bg-purple-500 rounded-t"
                    style={{ height: `${rentalsHeight}%` }}
                    title={`Locations: ${month.rentals.toFixed(0)} DA`}
                  ></div>
                  <div 
                    className="bg-emerald-500 rounded-b"
                    style={{ height: `${salesHeight}%` }}
                    title={`Ventes: ${month.sales.toFixed(0)} DA`}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{month.month}</p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center space-x-4 sm:space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded mr-2"></div>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Ventes</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Locations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;