import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Sale, Rental, Product, Client } from '../types';
import { 
  AlertTriangle, 
  Search, 
  Calendar, 
  DollarSign, 
  User, 
  Phone, 
  Mail,
  X,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';

interface DebtInfo {
  client: Client;
  sales: Sale[];
  rentals: Rental[];
  totalDebt: number;
  salesDebt: number;
  rentalsDebt: number;
  lastTransaction: Date;
  transactionCount: number;
}

const Debts: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

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

  const getDebtInfo = (): DebtInfo[] => {
    const debtMap = new Map<string, DebtInfo>();

    // Traiter les ventes avec dettes
    sales.filter(sale => sale.remainingAmount > 0).forEach(sale => {
      const client = clients.find(c => c.id === sale.clientId);
      if (!client) return;

      if (!debtMap.has(client.id)) {
        debtMap.set(client.id, {
          client,
          sales: [],
          rentals: [],
          totalDebt: 0,
          salesDebt: 0,
          rentalsDebt: 0,
          lastTransaction: new Date(sale.createdAt),
          transactionCount: 0
        });
      }

      const debtInfo = debtMap.get(client.id)!;
      debtInfo.sales.push(sale);
      debtInfo.salesDebt += sale.remainingAmount;
      debtInfo.totalDebt += sale.remainingAmount;
      debtInfo.transactionCount++;
      
      const saleDate = new Date(sale.createdAt);
      if (saleDate > debtInfo.lastTransaction) {
        debtInfo.lastTransaction = saleDate;
      }
    });

    // Traiter les locations avec dettes
    rentals.filter(rental => rental.remainingAmount > 0).forEach(rental => {
      const client = clients.find(c => c.id === rental.clientId);
      if (!client) return;

      if (!debtMap.has(client.id)) {
        debtMap.set(client.id, {
          client,
          sales: [],
          rentals: [],
          totalDebt: 0,
          salesDebt: 0,
          rentalsDebt: 0,
          lastTransaction: new Date(rental.createdAt),
          transactionCount: 0
        });
      }

      const debtInfo = debtMap.get(client.id)!;
      debtInfo.rentals.push(rental);
      debtInfo.rentalsDebt += rental.remainingAmount;
      debtInfo.totalDebt += rental.remainingAmount;
      debtInfo.transactionCount++;
      
      const rentalDate = new Date(rental.createdAt);
      if (rentalDate > debtInfo.lastTransaction) {
        debtInfo.lastTransaction = rentalDate;
      }
    });

    return Array.from(debtMap.values());
  };

  const filteredDebts = getDebtInfo().filter(debtInfo => {
    // Filtrage par texte
    const textMatch = !searchTerm || (
      debtInfo.client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtInfo.client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtInfo.client.phone.includes(searchTerm) ||
      (debtInfo.client.email && debtInfo.client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filtrage par date
    let dateMatch = true;
    if (dateFilter.startDate && dateFilter.endDate) {
      const startDate = startOfDay(new Date(dateFilter.startDate));
      const endDate = endOfDay(new Date(dateFilter.endDate));
      dateMatch = isWithinInterval(debtInfo.lastTransaction, { start: startDate, end: endDate });
    } else if (dateFilter.startDate) {
      const startDate = startOfDay(new Date(dateFilter.startDate));
      dateMatch = debtInfo.lastTransaction >= startDate;
    } else if (dateFilter.endDate) {
      const endDate = endOfDay(new Date(dateFilter.endDate));
      dateMatch = debtInfo.lastTransaction <= endDate;
    }

    return textMatch && dateMatch;
  }).sort((a, b) => b.totalDebt - a.totalDebt);

  const totalDebts = filteredDebts.reduce((sum, debt) => sum + debt.totalDebt, 0);
  const totalSalesDebts = filteredDebts.reduce((sum, debt) => sum + debt.salesDebt, 0);
  const totalRentalsDebts = filteredDebts.reduce((sum, debt) => sum + debt.rentalsDebt, 0);

  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' });
  };

  const generateDebtsReport = () => {
    const doc = new jsPDF();
    
    // En-tête avec logo
    try {
      doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
    } catch (error) {
      console.log('Logo non trouvé');
    }
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DES CRÉANCES - HIYA', 105, 60, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 75, { align: 'center' });
    
    let yPosition = 95;
    
    // Résumé
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ DES CRÉANCES', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre de clients avec dettes: ${filteredDebts.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total des créances: ${totalDebts.toFixed(2)} DA`, 20, yPosition);
    yPosition += 8;
    doc.text(`Créances ventes: ${totalSalesDebts.toFixed(2)} DA`, 20, yPosition);
    yPosition += 8;
    doc.text(`Créances locations: ${totalRentalsDebts.toFixed(2)} DA`, 20, yPosition);
    yPosition += 20;
    
    // Détail par client
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAIL PAR CLIENT', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Client', 20, yPosition);
    doc.text('Téléphone', 80, yPosition);
    doc.text('Ventes', 120, yPosition);
    doc.text('Locations', 150, yPosition);
    doc.text('Total', 180, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    filteredDebts.forEach((debt) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.text(`${debt.client.firstName} ${debt.client.lastName}`, 20, yPosition);
      doc.text(debt.client.phone, 80, yPosition);
      doc.text(`${debt.salesDebt.toFixed(2)} DA`, 120, yPosition);
      doc.text(`${debt.rentalsDebt.toFixed(2)} DA`, 150, yPosition);
      doc.text(`${debt.totalDebt.toFixed(2)} DA`, 180, yPosition);
      
      yPosition += 8;
    });
    
    doc.save(`rapport-creances-hiya-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Gestion des Créances</h1>
        </div>
        <button
          onClick={generateDebtsReport}
          className="bg-red-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm sm:text-base"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Rapport PDF
        </button>
      </div>

      {/* Statistiques globales - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{filteredDebts.length}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Clients avec dettes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{totalDebts.toFixed(0)} DA</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total créances</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{totalSalesDebts.toFixed(0)} DA</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Créances ventes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{totalRentalsDebts.toFixed(0)} DA</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Créances locations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recherche textuelle */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Filtre par date */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              placeholder="Date début"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
              className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <span className="text-gray-400 text-sm">à</span>
            <input
              type="date"
              placeholder="Date fin"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
              className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            {(dateFilter.startDate || dateFilter.endDate) && (
              <button
                onClick={clearDateFilter}
                className="px-2 sm:px-3 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Résumé des résultats */}
      {(searchTerm || dateFilter.startDate || dateFilter.endDate) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-red-800 dark:text-red-300 font-medium text-sm sm:text-base">
                {filteredDebts.length} client(s) avec dettes trouvé(s)
              </p>
              <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
                Total créances: {totalDebts.toFixed(2)} DA
              </p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                clearDateFilter();
              }}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs sm:text-sm"
            >
              Effacer les filtres
            </button>
          </div>
        </div>
      )}

      {/* Liste des clients avec dettes - Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                  Contact
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Créances
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                  Dernière transaction
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDebts.map((debtInfo) => (
                <tr key={debtInfo.client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {debtInfo.client.firstName} {debtInfo.client.lastName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {debtInfo.transactionCount} transaction(s)
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                          {debtInfo.client.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="flex items-center space-x-2 text-sm text-gray-900 dark:text-white">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{debtInfo.client.phone}</span>
                    </div>
                    {debtInfo.client.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{debtInfo.client.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">
                      {debtInfo.totalDebt.toFixed(2)} DA
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Ventes: {debtInfo.salesDebt.toFixed(2)} DA
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Locations: {debtInfo.rentalsDebt.toFixed(2)} DA
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {format(debtInfo.lastTransaction, 'dd/MM/yyyy')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format(debtInfo.lastTransaction, 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedClient(selectedClient === debtInfo.client.id ? null : debtInfo.client.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détail du client sélectionné - Responsive */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Détail des créances</h2>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              {(() => {
                const debtInfo = filteredDebts.find(d => d.client.id === selectedClient);
                if (!debtInfo) return null;

                return (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Info client */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        {debtInfo.client.firstName} {debtInfo.client.lastName}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Téléphone:</span>
                          <p className="font-medium text-gray-800 dark:text-white">{debtInfo.client.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Email:</span>
                          <p className="font-medium text-gray-800 dark:text-white break-words">{debtInfo.client.email || 'Non renseigné'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Ventes impayées */}
                    {debtInfo.sales.length > 0 && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3">
                          Ventes impayées ({debtInfo.salesDebt.toFixed(2)} DA)
                        </h3>
                        <div className="space-y-3">
                          {debtInfo.sales.map((sale) => {
                            const product = products.find(p => p.id === sale.productId);
                            return (
                              <div key={sale.id} className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 dark:text-white truncate">
                                      {product?.name || 'Produit supprimé'}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                      {format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-red-600 dark:text-red-400">
                                      Reste: {sale.remainingAmount.toFixed(2)} DA
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                      Total: {sale.totalAmount.toFixed(2)} DA
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Locations impayées */}
                    {debtInfo.rentals.length > 0  && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-3">
                          Locations impayées ({debtInfo.rentalsDebt.toFixed(2)} DA)
                        </h3>
                        <div className="space-y-3">
                          {debtInfo.rentals.map((rental) => {
                            const product = products.find(p => p.id === rental.productId);
                            return (
                              <div key={rental.id} className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 dark:text-white truncate">
                                      {product?.name || 'Produit supprimé'}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                      {format(new Date(rental.startDate), 'dd/MM')} - {format(new Date(rental.endDate), 'dd/MM')}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                      Créé le: {format(new Date(rental.createdAt), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-purple-600 dark:text-purple-400">
                                      Reste: {rental.remainingAmount.toFixed(2)} DA
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                      Total: {rental.totalAmount.toFixed(2)} DA
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debts;