import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { generateReceiptPDF } from '../utils/receipt';
import { Rental, Product, Client, Receipt } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Printer, Calendar, Clock, AlertTriangle, Scan } from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';

const Rentals: React.FC = () => {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [rentalForm, setRentalForm] = useState({
    clientId: '',
    productId: '',
    quantity: '1',
    startDate: '',
    endDate: '',
    deposit: '0',
    paidAmount: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rentalsData, productsData, clientsData] = await Promise.all([
        SupabaseService.getRentals(),
        SupabaseService.getProducts(),
        SupabaseService.getClients()
      ]);
      setRentals(rentalsData);
      setProducts(productsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter(rental => {
    const client = clients.find(c => c.id === rental.clientId);
    const product = products.find(p => p.id === rental.productId);
    return (
      client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.barcode.includes(searchTerm)
    );
  });

  // Recherche de produit par code-barres
  const handleBarcodeSearch = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode && p.stock > 0);
    if (product) {
      setRentalForm({...rentalForm, productId: product.id});
      setBarcodeSearch('');
    } else {
      alert('Produit non trouvé ou en rupture de stock');
    }
  };

  const handleSubmitRental = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const product = products.find(p => p.id === rentalForm.productId);
      const client = clients.find(c => c.id === rentalForm.clientId);
      
      if (!product || !client) return;

      const quantity = parseInt(rentalForm.quantity);
      const deposit = parseFloat(rentalForm.deposit) || 0;
      const paidAmount = parseFloat(rentalForm.paidAmount) || 0;
      
      const days = differenceInDays(new Date(rentalForm.endDate), new Date(rentalForm.startDate)) + 1;
      const totalAmount = product.rentalPrice * quantity * days;
      const remainingAmount = totalAmount - paidAmount;

      const newRental: Rental = {
        id: crypto.randomUUID(),
        clientId: rentalForm.clientId,
        productId: rentalForm.productId,
        quantity,
        dailyRate: product.rentalPrice,
        startDate: rentalForm.startDate,
        endDate: rentalForm.endDate,
        totalAmount,
        paidAmount,
        remainingAmount,
        deposit,
        status: 'active',
        createdBy: `${user?.firstName} ${user?.lastName}`,
        createdAt: new Date().toISOString()
      };

      // Update product stock
      const updatedProduct = { ...product, stock: product.stock - quantity };
      await SupabaseService.saveProduct(updatedProduct);

      // Save rental
      await SupabaseService.saveRental(newRental);

      // Reload data
      await loadData();

      // Generate receipt
      const receipt: Receipt = {
        id: newRental.id,
        type: 'rental',
        transactionId: newRental.id,
        clientName: `${client.firstName} ${client.lastName}`,
        items: [{
          name: `${product.name} (${days} jours)`,
          quantity,
          unitPrice: product.rentalPrice * days,
          total: totalAmount
        }],
        total: totalAmount,
        paid: paidAmount,
        remaining: remainingAmount,
        createdBy: newRental.createdBy,
        createdAt: newRental.createdAt
      };

      generateReceiptPDF(receipt, client, products);

      // Reset form
      setRentalForm({
        clientId: '',
        productId: '',
        quantity: '1',
        startDate: '',
        endDate: '',
        deposit: '0',
        paidAmount: ''
      });
      setShowRentalForm(false);
    } catch (error) {
      console.error('Error creating rental:', error);
      alert('Erreur lors de la création de la location');
    }
  };

  const handleReturnRental = async (rental: Rental) => {
    if (confirm('Confirmer le retour de cette location ?')) {
      try {
        const updatedRental = { ...rental, status: 'returned' as const };
        
        // Return stock
        const product = products.find(p => p.id === rental.productId);
        if (product) {
          const updatedProduct = { ...product, stock: product.stock + rental.quantity };
          await SupabaseService.saveProduct(updatedProduct);
        }

        await SupabaseService.saveRental(updatedRental);
        await loadData();
      } catch (error) {
        console.error('Error returning rental:', error);
        alert('Erreur lors du retour de la location');
      }
    }
  };

  const handlePrintReceipt = (rental: Rental) => {
    const client = clients.find(c => c.id === rental.clientId);
    const product = products.find(p => p.id === rental.productId);
    
    if (!client || !product) return;

    const days = differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) + 1;

    const receipt: Receipt = {
      id: rental.id,
      type: 'rental',
      transactionId: rental.id,
      clientName: `${client.firstName} ${client.lastName}`,
      items: [{
        name: `${product.name} (${days} jours)`,
        quantity: rental.quantity,
        unitPrice: rental.dailyRate * days,
        total: rental.totalAmount
      }],
      total: rental.totalAmount,
      paid: rental.paidAmount,
      remaining: rental.remainingAmount,
      createdBy: rental.createdBy,
      createdAt: rental.createdAt
    };

    generateReceiptPDF(receipt, client, products);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Locations</h1>
        <button
          onClick={() => setShowRentalForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle location
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par client ou produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Rental Form */}
      {showRentalForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Nouvelle location</h2>
          
          {/* Recherche par code-barres */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-medium text-purple-800 mb-3 flex items-center">
              <Scan className="w-5 h-5 mr-2" />
              Recherche par code-barres
            </h3>
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="Scanner ou saisir le code-barres..."
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeSearch(barcodeSearch);
                  }
                }}
                className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => handleBarcodeSearch(barcodeSearch)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Rechercher
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmitRental} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <select
                value={rentalForm.clientId}
                onChange={(e) => setRentalForm({...rentalForm, clientId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Produit</label>
              <select
                value={rentalForm.productId}
                onChange={(e) => setRentalForm({...rentalForm, productId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un produit</option>
                {products.filter(p => p.stock > 0).map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.barcode} - {product.rentalPrice.toFixed(2)} DH/jour (Stock: {product.stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
              <input
                type="number"
                min="1"
                value={rentalForm.quantity}
                onChange={(e) => setRentalForm({...rentalForm, quantity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caution (DH)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rentalForm.deposit}
                onChange={(e) => setRentalForm({...rentalForm, deposit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
              <input
                type="date"
                value={rentalForm.startDate}
                onChange={(e) => setRentalForm({...rentalForm, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
              <input
                type="date"
                value={rentalForm.endDate}
                onChange={(e) => setRentalForm({...rentalForm, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant payé (DH)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rentalForm.paidAmount}
                onChange={(e) => setRentalForm({...rentalForm, paidAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRentalForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Enregistrer la location
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rentals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRentals.map((rental) => {
                const client = clients.find(c => c.id === rental.clientId);
                const product = products.find(p => p.id === rental.productId);
                const isOverdue = rental.status === 'active' && isAfter(new Date(), new Date(rental.endDate));
                
                return (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {client?.firstName} {client?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{client?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product?.name}</div>
                      <div className="text-sm text-gray-500">Code: {product?.barcode} | Qté: {rental.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(rental.startDate), 'dd/MM/yyyy')} - {format(new Date(rental.endDate), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) + 1} jours
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {rental.totalAmount.toFixed(2)} DH
                      </div>
                      <div className="text-sm text-gray-500">
                        Payé: {rental.paidAmount.toFixed(2)} DH
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rental.status === 'returned' 
                          ? 'bg-gray-100 text-gray-800' 
                          : isOverdue
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {rental.status === 'returned' ? 'Retourné' : isOverdue ? 'En retard' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePrintReceipt(rental)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {rental.status === 'active' && (
                          <button
                            onClick={() => handleReturnRental(rental)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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

export default Rentals;