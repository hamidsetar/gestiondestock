import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Sale, Rental, Product, Client } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Calendar, 
  Download, 
  Filter,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Clock,
  Target,
  Activity,
  FileText
} from 'lucide-react';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths, isWithinInterval, eachMonthOfInterval, getYear, getMonth } from 'date-fns';
import jsPDF from 'jspdf';

interface MonthlyData {
  month: string;
  year: number;
  monthNumber: number;
  sales: number;
  rentals: number;
  totalRevenue: number;
  salesCount: number;
  rentalsCount: number;
  newClients: number;
  averageOrderValue: number;
}

interface YearlyData {
  year: number;
  totalRevenue: number;
  salesRevenue: number;
  rentalsRevenue: number;
  totalTransactions: number;
  salesCount: number;
  rentalsCount: number;
  newClients: number;
  averageMonthlyRevenue: number;
  bestMonth: string;
  worstMonth: string;
}

const Analytics: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewType, setViewType] = useState<'monthly' | 'yearly' | 'comparison'>('monthly');

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

  const getAvailableYears = (): number[] => {
    const allDates = [
      ...sales.map(s => new Date(s.createdAt)),
      ...rentals.map(r => new Date(r.createdAt))
    ];
    
    const years = Array.from(new Set(allDates.map(date => date.getFullYear())));
    return years.sort((a, b) => b - a);
  };

  const getMonthlyData = (year: number): MonthlyData[] => {
    const months = eachMonthOfInterval({
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31)
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSales = sales.filter(sale => 
        isWithinInterval(new Date(sale.createdAt), { start: monthStart, end: monthEnd })
      );
      
      const monthRentals = rentals.filter(rental => 
        isWithinInterval(new Date(rental.createdAt), { start: monthStart, end: monthEnd })
      );
      
      const monthClients = clients.filter(client => 
        isWithinInterval(new Date(client.createdAt), { start: monthStart, end: monthEnd })
      );
      
      const salesRevenue = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const rentalsRevenue = monthRentals.reduce((sum, rental) => sum + rental.totalAmount, 0);
      const totalRevenue = salesRevenue + rentalsRevenue;
      const totalTransactions = monthSales.length + monthRentals.length;
      
      return {
        month: format(month, 'MMM'),
        year: getYear(month),
        monthNumber: getMonth(month),
        sales: salesRevenue,
        rentals: rentalsRevenue,
        totalRevenue,
        salesCount: monthSales.length,
        rentalsCount: monthRentals.length,
        newClients: monthClients.length,
        averageOrderValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
      };
    });
  };

  const getYearlyData = (): YearlyData[] => {
    const years = getAvailableYears();
    
    return years.map(year => {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 11, 31));
      
      const yearSales = sales.filter(sale => 
        isWithinInterval(new Date(sale.createdAt), { start: yearStart, end: yearEnd })
      );
      
      const yearRentals = rentals.filter(rental => 
        isWithinInterval(new Date(rental.createdAt), { start: yearStart, end: yearEnd })
      );
      
      const yearClients = clients.filter(client => 
        isWithinInterval(new Date(client.createdAt), { start: yearStart, end: yearEnd })
      );
      
      const salesRevenue = yearSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const rentalsRevenue = yearRentals.reduce((sum, rental) => sum + rental.totalAmount, 0);
      const totalRevenue = salesRevenue + rentalsRevenue;
      
      const monthlyData = getMonthlyData(year);
      const bestMonth = monthlyData.reduce((best, current) => 
        current.totalRevenue > best.totalRevenue ? current : best
      );
      const worstMonth = monthlyData.reduce((worst, current) => 
        current.totalRevenue < worst.totalRevenue ? current : worst
      );
      
      return {
        year,
        totalRevenue,
        salesRevenue,
        rentalsRevenue,
        totalTransactions: yearSales.length + yearRentals.length,
        salesCount: yearSales.length,
        rentalsCount: yearRentals.length,
        newClients: yearClients.length,
        averageMonthlyRevenue: totalRevenue / 12,
        bestMonth: bestMonth.month,
        worstMonth: worstMonth.month
      };
    });
  };

  const generateMonthlyReport = (year: number) => {
    const monthlyData = getMonthlyData(year);
    const doc = new jsPDF();
    
    // En-tête
    try {
      doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
    } catch (error) {
      console.log('Logo non trouvé');
    }
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`RAPPORT MENSUEL ${year} - HIYA`, 105, 60, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 75, { align: 'center' });
    
    let yPosition = 95;
    
    // Résumé annuel
    const yearTotal = monthlyData.reduce((sum, month) => sum + month.totalRevenue, 0);
    const totalTransactions = monthlyData.reduce((sum, month) => sum + month.salesCount + month.rentalsCount, 0);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ ANNUEL', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Chiffre d'affaires total: ${yearTotal.toFixed(2)} DA`, 20, yPosition);
    yPosition += 8;
    doc.text(`Nombre de transactions: ${totalTransactions}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Moyenne mensuelle: ${(yearTotal / 12).toFixed(2)} DA`, 20, yPosition);
    yPosition += 20;
    
    // Détail mensuel
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAIL MENSUEL', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Mois', 20, yPosition);
    doc.text('Ventes', 50, yPosition);
    doc.text('Locations', 80, yPosition);
    doc.text('Total', 110, yPosition);
    doc.text('Transactions', 140, yPosition);
    doc.text('Nouveaux clients', 170, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    monthlyData.forEach((month) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.text(month.month, 20, yPosition);
      doc.text(`${month.sales.toFixed(0)} DA`, 50, yPosition);
      doc.text(`${month.rentals.toFixed(0)} DA`, 80, yPosition);
      doc.text(`${month.totalRevenue.toFixed(0)} DA`, 110, yPosition);
      doc.text(`${month.salesCount + month.rentalsCount}`, 140, yPosition);
      doc.text(`${month.newClients}`, 170, yPosition);
      
      yPosition += 8;
    });
    
    doc.save(`rapport-mensuel-${year}-hiya.pdf`);
  };

  const generateYearlyReport = () => {
    const yearlyData = getYearlyData();
    const doc = new jsPDF();
    
    // En-tête
    try {
      doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
    } catch (error) {
      console.log('Logo non trouvé');
    }
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT ANNUEL COMPARATIF - HIYA', 105, 60, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 75, { align: 'center' });
    
    let yPosition = 95;
    
    // Évolution annuelle
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ÉVOLUTION ANNUELLE', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Année', 20, yPosition);
    doc.text('CA Total', 50, yPosition);
    doc.text('Ventes', 80, yPosition);
    doc.text('Locations', 110, yPosition);
    doc.text('Transactions', 140, yPosition);
    doc.text('Clients', 170, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    yearlyData.forEach((year) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.text(year.year.toString(), 20, yPosition);
      doc.text(`${year.totalRevenue.toFixed(0)} DA`, 50, yPosition);
      doc.text(`${year.salesRevenue.toFixed(0)} DA`, 80, yPosition);
      doc.text(`${year.rentalsRevenue.toFixed(0)} DA`, 110, yPosition);
      doc.text(`${year.totalTransactions}`, 140, yPosition);
      doc.text(`${year.newClients}`, 170, yPosition);
      
      yPosition += 8;
    });
    
    // Analyse de croissance
    if (yearlyData.length > 1) {
      yPosition += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ANALYSE DE CROISSANCE', 20, yPosition);
      yPosition += 15;
      
      const currentYear = yearlyData[0];
      const previousYear = yearlyData[1];
      const growth = ((currentYear.totalRevenue - previousYear.totalRevenue) / previousYear.totalRevenue) * 100;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Croissance ${currentYear.year} vs ${previousYear.year}: ${growth.toFixed(1)}%`, 20, yPosition);
      yPosition += 8;
      doc.text(`Évolution CA: ${(currentYear.totalRevenue - previousYear.totalRevenue).toFixed(2)} DA`, 20, yPosition);
    }
    
    doc.save(`rapport-annuel-comparatif-hiya.pdf`);
  };

  const currentMonthlyData = getMonthlyData(selectedYear);
  const yearlyData = getYearlyData();
  const currentYearData = yearlyData.find(y => y.year === selectedYear);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Organigrammes & Rapports</h1>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => generateMonthlyReport(selectedYear)}
            className="bg-indigo-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Rapport Mensuel
          </button>
          <button
            onClick={generateYearlyReport}
            className="bg-purple-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Rapport Annuel
          </button>
        </div>
      </div>

      {/* Contrôles - Responsive */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vue:</span>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as any)}
              className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="monthly">Mensuelle</option>
              <option value="yearly">Annuelle</option>
              <option value="comparison">Comparaison</option>
            </select>
          </div>
          
          {viewType === 'monthly' && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Année:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                {getAvailableYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Vue Mensuelle */}
      {viewType === 'monthly' && (
        <>
          {/* KPIs de l'année - Responsive */}
          {currentYearData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{currentYearData.totalRevenue.toFixed(0)} DA</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">CA Total {selectedYear}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Target className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{currentYearData.averageMonthlyRevenue.toFixed(0)} DA</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Moyenne mensuelle</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{currentYearData.totalTransactions}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{currentYearData.newClients}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Nouveaux clients</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Graphique mensuel - Responsive */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Évolution Mensuelle {selectedYear}</h3>
              <div className="flex flex-wrap gap-2 sm:space-x-4">
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
            
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 sm:gap-2">
              {currentMonthlyData.map((month, index) => {
                const maxValue = Math.max(...currentMonthlyData.map(m => m.totalRevenue));
                const totalHeight = maxValue > 0 ? ((month.totalRevenue) / maxValue) * 200 : 0;
                const salesHeight = month.totalRevenue > 0 ? (month.sales / month.totalRevenue) * totalHeight : 0;
                const rentalsHeight = totalHeight - salesHeight;
                
                return (
                  <div key={index} className="text-center">
                    <div className="h-32 sm:h-52 flex flex-col justify-end mb-2 relative group">
                      <div 
                        className="bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-600"
                        style={{ height: `${rentalsHeight}px` }}
                        title={`Locations: ${month.rentals.toFixed(0)} DA`}
                      ></div>
                      <div 
                        className="bg-emerald-500 rounded-b transition-all duration-300 hover:bg-emerald-600"
                        style={{ height: `${salesHeight}px` }}
                        title={`Ventes: ${month.sales.toFixed(0)} DA`}
                      ></div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                        <div>Total: {month.totalRevenue.toFixed(0)} DA</div>
                        <div>Ventes: {month.sales.toFixed(0)} DA</div>
                        <div>Locations: {month.rentals.toFixed(0)} DA</div>
                        <div>Transactions: {month.salesCount + month.rentalsCount}</div>
                      </div>
                    </div>
                    <p className="text-xs font-medium">{month.month}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{month.totalRevenue.toFixed(0)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tableau détaillé mensuel - Responsive */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Détail Mensuel {selectedYear}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mois</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ventes</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Locations</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Transactions</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Nouveaux clients</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Panier moyen</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentMonthlyData.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {month.month} {month.year}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {month.sales.toFixed(2)} DA
                        <div className="text-xs text-gray-500 dark:text-gray-400">({month.salesCount} ventes)</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {month.rentals.toFixed(2)} DA
                        <div className="text-xs text-gray-500 dark:text-gray-400">({month.rentalsCount} locations)</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {month.totalRevenue.toFixed(2)} DA
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden sm:table-cell">
                        {month.salesCount + month.rentalsCount}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                        {month.newClients}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                        {month.averageOrderValue.toFixed(2)} DA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Vue Annuelle */}
      {viewType === 'yearly' && (
        <>
          {/* Graphique annuel - Responsive */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Évolution Annuelle</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Chiffre d'affaires</span>
              </div>
            </div>
            
            <div className="flex items-end space-x-4 sm:space-x-8 h-48 sm:h-64 overflow-x-auto">
              {yearlyData.map((year, index) => {
                const maxValue = Math.max(...yearlyData.map(y => y.totalRevenue));
                const height = maxValue > 0 ? (year.totalRevenue / maxValue) * 200 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center group flex-shrink-0">
                    <div className="relative">
                      <div 
                        className="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 w-12 sm:w-16"
                        style={{ height: `${height}px` }}
                      ></div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                        <div>CA: {year.totalRevenue.toFixed(0)} DA</div>
                        <div>Transactions: {year.totalTransactions}</div>
                        <div>Clients: {year.newClients}</div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-2">{year.year}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{year.totalRevenue.toFixed(0)} DA</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tableau comparatif annuel - Responsive */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Comparaison Annuelle</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Année</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CA Total</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Ventes</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Locations</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Transactions</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Nouveaux clients</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Meilleur mois</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {yearlyData.map((year, index) => {
                    const previousYear = yearlyData[index + 1];
                    const growth = previousYear ? ((year.totalRevenue - previousYear.totalRevenue) / previousYear.totalRevenue) * 100 : 0;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {year.year}
                          {previousYear && (
                            <div className={`text-xs ${growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {year.totalRevenue.toFixed(2)} DA
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden sm:table-cell">
                          {year.salesRevenue.toFixed(2)} DA
                          <div className="text-xs text-gray-500 dark:text-gray-400">({year.salesCount} ventes)</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden sm:table-cell">
                          {year.rentalsRevenue.toFixed(2)} DA
                          <div className="text-xs text-gray-500 dark:text-gray-400">({year.rentalsCount} locations)</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                          {year.totalTransactions}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                          {year.newClients}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                          {year.bestMonth}
                          <div className="text-xs text-gray-500 dark:text-gray-400">vs {year.worstMonth} (pire)</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Vue Comparaison */}
      {viewType === 'comparison' && yearlyData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Comparaison CA */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">Comparaison Chiffre d'Affaires</h3>
            <div className="space-y-4">
              {yearlyData.slice(0, 3).map((year, index) => {
                const maxRevenue = Math.max(...yearlyData.slice(0, 3).map(y => y.totalRevenue));
                const percentage = (year.totalRevenue / maxRevenue) * 100;
                
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{year.year}</span>
                      <span className="text-sm text-gray-900 dark:text-white">{year.totalRevenue.toFixed(0)} DA</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparaison Transactions */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">Comparaison Transactions</h3>
            <div className="space-y-4">
              {yearlyData.slice(0, 3).map((year, index) => {
                const maxTransactions = Math.max(...yearlyData.slice(0, 3).map(y => y.totalTransactions));
                const percentage = (year.totalTransactions / maxTransactions) * 100;
                
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{year.year}</span>
                      <span className="text-sm text-gray-900 dark:text-white">{year.totalTransactions} transactions</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;