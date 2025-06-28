import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { generateClientListPDF } from '../utils/receipt';
import { Client, Sale, Rental, Product } from '../types';
import { Plus, Search, Printer, Eye, User, X, Calendar, ShoppingCart, Package, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, salesData, rentalsData, productsData] = await Promise.all([
        SupabaseService.getClients(),
        SupabaseService.getSales(),
        SupabaseService.getRentals(),
        SupabaseService.getProducts()
      ]);
      setClients(clientsData);
      setSales(salesData);
      setRentals(rentalsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newClient: Client = {
        id: crypto.randomUUID(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        createdAt: new Date().toISOString()
      };

      await SupabaseService.saveClient(newClient);
      await loadData();
      
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Erreur lors de la sauvegarde du client');
    }
  };

  const getClientHistory = (clientId: string) => {
    const clientSales = sales.filter(sale => sale.clientId === clientId);
    const clientRentals = rentals.filter(rental => rental.clientId === clientId);
    
    return { sales: clientSales, rentals: clientRentals };
  };

  const getClientStats = (clientId: string) => {
    const history = getClientHistory(clientId);
    const totalSales = history.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalRentals = history.rentals.reduce((sum, rental) => sum + rental.totalAmount, 0);
    const totalSpent = totalSales + totalRentals;
    const totalPaid = history.sales.reduce((sum, sale) => sum + sale.paidAmount, 0) +
                     history.rentals.reduce((sum, rental) => sum + rental.paidAmount, 0);
    const totalRemaining = totalSpent - totalPaid;
    
    return {
      totalTransactions: history.sales.length + history.rentals.length,
      totalSpent,
      totalPaid,
      totalRemaining,
      lastTransaction: [...history.sales, ...history.rentals]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    };
  };

  const handlePrintClientList = () => {
    generateClientListPDF(clients);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestion des Clients</h1>
        <div className="flex space-x-3">
          <button
            onClick={handlePrintClientList}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <Printer className="w-5 h-5 mr-2" />
            Imprimer la liste
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un client
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Ajouter un nouveau client</h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prénom</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adresse</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Client History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Historique détaillé du client</h2>
                <button
                  onClick={() => setShowHistory(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {(() => {
                const client = clients.find(c => c.id === showHistory);
                const history = getClientHistory(showHistory);
                const stats = getClientStats(showHistory);
                
                return (
                  <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        {client?.firstName} {client?.lastName}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Téléphone:</span>
                          <p className="font-medium text-gray-800 dark:text-white">{client?.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Email:</span>
                          <p className="font-medium text-gray-800 dark:text-white">{client?.email || 'Non renseigné'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Client depuis:</span>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {client ? format(new Date(client.createdAt), 'dd/MM/yyyy') : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                          <div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTransactions}</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Transactions</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                          <div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalSpent.toFixed(0)} DH</p>
                            <p className="text-sm text-green-600 dark:text-green-400">Total dépensé</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mr-3" />
                          <div>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalPaid.toFixed(0)} DH</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">Total payé</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <DollarSign className="w-8 h-8 text-orange-600 dark:text-orange-400 mr-3" />
                          <div>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalRemaining.toFixed(0)} DH</p>
                            <p className="text-sm text-orange-600 dark:text-orange-400">Reste à payer</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales History */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Ventes ({history.sales.length})
                      </h3>
                      <div className="space-y-3">
                        {history.sales.map((sale) => {
                          const product = products.find(p => p.id === sale.productId);
                          return (
                            <div key={sale.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Package className="w-4 h-4 text-gray-500" />
                                    <p className="font-medium text-gray-800 dark:text-white">
                                      {product?.name || 'Produit supprimé'}
                                    </p>
                                    <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                      {product?.barcode}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <div>
                                      <span className="font-medium">Quantité:</span> {sale.quantity}
                                    </div>
                                    <div>
                                      <span className="font-medium">Prix unitaire:</span> {sale.unitPrice.toFixed(2)} DH
                                    </div>
                                    <div>
                                      <span className="font-medium">Réduction:</span> {sale.discount.toFixed(2)} DH
                                    </div>
                                    <div>
                                      <span className="font-medium">Vendeur:</span> {sale.createdBy}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="font-medium text-lg text-gray-800 dark:text-white">{sale.totalAmount.toFixed(2)} DH</p>
                                  <p className="text-sm text-green-600 dark:text-green-400">
                                    Payé: {sale.paidAmount.toFixed(2)} DH
                                  </p>
                                  {sale.remainingAmount > 0 && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                      Reste: {sale.remainingAmount.toFixed(2)} DH
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                                    sale.status === 'paid' 
                                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                                      : sale.status === 'partial'
                                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                                  }`}>
                                    {sale.status === 'paid' ? 'Payé' : sale.status === 'partial' ? 'Partiel' : 'En attente'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {history.sales.length === 0 && (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucune vente enregistrée</p>
                        )}
                      </div>
                    </div>

                    {/* Rentals History */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Locations ({history.rentals.length})
                      </h3>
                      <div className="space-y-3">
                        {history.rentals.map((rental) => {
                          const product = products.find(p => p.id === rental.productId);
                          const isOverdue = rental.status === 'active' && new Date() > new Date(rental.endDate);
                          return (
                            <div key={rental.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Package className="w-4 h-4 text-gray-500" />
                                    <p className="font-medium text-gray-800 dark:text-white">
                                      {product?.name || 'Produit supprimé'}
                                    </p>
                                    <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                      {product?.barcode}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <div>
                                      <span className="font-medium">Quantité:</span> {rental.quantity}
                                    </div>
                                    <div>
                                      <span className="font-medium">Tarif/jour:</span> {rental.dailyRate.toFixed(2)} DH
                                    </div>
                                    <div>
                                      <span className="font-medium">Période:</span> 
                                      {format(new Date(rental.startDate), 'dd/MM')} - {format(new Date(rental.endDate), 'dd/MM')}
                                    </div>
                                    <div>
                                      <span className="font-medium">Caution:</span> {rental.deposit.toFixed(2)} DH
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="font-medium text-lg text-gray-800 dark:text-white">{rental.totalAmount.toFixed(2)} DH</p>
                                  <p className="text-sm text-green-600 dark:text-green-400">
                                    Payé: {rental.paidAmount.toFixed(2)} DH
                                  </p>
                                  {rental.remainingAmount > 0 && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                      Reste: {rental.remainingAmount.toFixed(2)} DH
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {format(new Date(rental.createdAt), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                                    rental.status === 'returned' 
                                      ? 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300' 
                                      : isOverdue
                                      ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                                      : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                  }`}>
                                    {rental.status === 'returned' ? 'Retourné' : isOverdue ? 'En retard' : 'Active'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {history.rentals.length === 0 && (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucune location enregistrée</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statistiques
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => {
                const stats = getClientStats(client.id);
                
                return (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Client depuis {format(new Date(client.createdAt), 'dd/MM/yyyy')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{client.phone}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{client.email || 'Email non renseigné'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {stats.totalTransactions} transaction(s)
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total: {stats.totalSpent.toFixed(2)} DH
                      </div>
                      {stats.totalRemaining > 0 && (
                        <div className="text-sm text-red-600 dark:text-red-400">
                          Reste: {stats.totalRemaining.toFixed(2)} DH
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setShowHistory(client.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Clients;