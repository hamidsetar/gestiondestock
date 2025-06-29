import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { generateReceiptPDF } from '../utils/receipt';
import { Rental, Product, Client, Receipt } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Printer, Calendar, Clock, AlertTriangle, Scan, X, User } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

const Rentals: React.FC = () => {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
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
    const rentalDate = new Date(rental.createdAt);
    
    // Filtrage par texte
    const textMatch = (
      client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.phone.includes(searchTerm) ||
      product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.barcode.includes(searchTerm)
    );

    // Filtrage par date
    let dateMatch = true;
    if (dateFilter.startDate && dateFilter.endDate) {
      const startDate = startOfDay(new Date(dateFilter.startDate));
      const endDate = endOfDay(new Date(dateFilter.endDate));
      dateMatch = (rentalDate >= startDate && rentalDate <= endDate);
    } else if (dateFilter.startDate) {
      const startDate = startOfDay(new Date(dateFilter.startDate));
      dateMatch = rentalDate >= startDate;
    } else if (dateFilter.endDate) {
      const endDate = endOfDay(new Date(dateFilter.endDate));
      dateMatch = rentalDate <= endDate;
    }

    return textMatch && dateMatch;
  });

  // Recherche de produit par code-barres avec sélection automatique
  const handleBarcodeSearch = () => {
    if (!barcodeSearch.trim()) {
      alert('Veuillez saisir un code-barres');
      return;
    }

    console.log('🔍 Recherche du code-barres:', barcodeSearch.trim());

    // Recherche exacte d'abord
    let product = products.find(p => 
      p.barcode.trim() === barcodeSearch.trim() && p.stock > 0
    );
    
    // Si pas trouvé, recherche partielle (contient)
    if (!product) {
      product = products.find(p => 
        p.barcode.includes(barcodeSearch.trim()) && p.stock > 0
      );
    }
    
    // Si toujours pas trouvé, recherche insensible à la casse
    if (!product) {
      product = products.find(p => 
        p.barcode.toLowerCase().includes(barcodeSearch.toLowerCase().trim()) && p.stock > 0
      );
    }

    // Si toujours pas trouvé, recherche très flexible
    if (!product) {
      const cleanBarcode = barcodeSearch.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      product = products.find(p => {
        const cleanProductBarcode = p.barcode.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return cleanProductBarcode.includes(cleanBarcode) && p.stock > 0;
      });
    }
    
    if (product) {
      // ✅ SÉLECTION AUTOMATIQUE DU PRODUIT
      setRentalForm({...rentalForm, productId: product.id});
      setBarcodeSearch('');
      
      // Message de confirmation avec détails
      alert(`✅ Produit sélectionné automatiquement !\n\n📦 ${product.name}\n🏷️ Code: ${product.barcode}\n📊 Stock: ${product.stock} unités\n💰 Prix location: ${product.rentalPrice.toFixed(2)} DA/jour\n\n➡️ Le produit a été ajouté au formulaire de location.`);
      console.log('✅ Produit sélectionné automatiquement:', product);
    } else {
      // Vérifier si le produit existe mais sans stock
      const productNoStock = products.find(p => 
        p.barcode.toLowerCase().includes(barcodeSearch.toLowerCase().trim())
      );
      
      if (productNoStock) {
        alert(`❌ Produit trouvé mais en rupture de stock:\n\n📦 ${productNoStock.name}\n🏷️ Code: ${productNoStock.barcode}\n📊 Stock: ${productNoStock.stock}\n\n⚠️ Impossible de sélectionner ce produit.`);
        console.log('❌ Produit sans stock:', productNoStock);
      } else {
        alert(`❌ Aucun produit trouvé avec le code-barres: "${barcodeSearch}"\n\n🔍 Vérifiez:\n• L'orthographe du code\n• Que le produit existe dans la base\n• Que le stock n'est pas à zéro\n\n💡 Astuce: La recherche fonctionne avec des codes partiels.`);
        console.log('❌ Aucun produit trouvé pour:', barcodeSearch);
      }
    }
  };

  // Recherche de client améliorée
  const filteredClients = clients.filter(client =>
    client.firstName.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.lastName.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.includes(clientSearch)
  );

  const handleClientSelect = (client: Client) => {
    setRentalForm({...rentalForm, clientId: client.id});
    setClientSearch(`${client.firstName} ${client.lastName} - ${client.phone}`);
    setShowClientDropdown(false);
  };

  const handleSubmitRental = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const product = products.find(p => p.id === rentalForm.productId);
      const client = clients.find(c => c.id === rentalForm.clientId);
      
      if (!product || !client) {
        alert('Veuillez sélectionner un produit et un client');
        return;
      }

      const quantity = parseInt(rentalForm.quantity);
      const deposit = parseFloat(rentalForm.deposit) || 0;
      const paidAmount = parseFloat(rentalForm.paidAmount) || 0;
      
      if (quantity > product.stock) {
        alert(`Stock insuffisant. Stock disponible: ${product.stock}`);
        return;
      }
      
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
      setClientSearch('');
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

  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' });
  };

  // Obtenir le nom du produit sélectionné pour l'affichage
  const selectedProduct = products.find(p => p.id === rentalForm.productId);

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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestion des Locations</h1>
        <button
          onClick={() => setShowRentalForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle location
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Text Search */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par client ou produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              placeholder="Date début"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span className="text-gray-400">à</span>
            <input
              type="date"
              placeholder="Date fin"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {(dateFilter.startDate || dateFilter.endDate) && (
              <button
                onClick={clearDateFilter}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || dateFilter.startDate || dateFilter.endDate) && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-800 dark:text-purple-300 font-medium">
                {filteredRentals.length} location(s) trouvée(s)
              </p>
              <p className="text-purple-600 dark:text-purple-400 text-sm">
                Total: {filteredRentals.reduce((sum, rental) => sum + rental.totalAmount, 0).toFixed(2)} DA
              </p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                clearDateFilter();
              }}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm"
            >
              Effacer les filtres
            </button>
          </div>
        </div>
      )}

      {/* Rental Form */}
      {showRentalForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nouvelle location</h2>
            <button
              onClick={() => setShowRentalForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Recherche par code-barres */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-medium text-purple-800 dark:text-purple-300 mb-3 flex items-center">
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
                    e.preventDefault();
                    handleBarcodeSearch();
                  }
                }}
                className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleBarcodeSearch}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Rechercher
              </button>
            </div>
            {selectedProduct && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300 font-medium">
                  ✅ Produit sélectionné: {selectedProduct.name}
                </p>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Code: {selectedProduct.barcode} | Stock: {selectedProduct.stock} | Prix: {selectedProduct.rentalPrice.toFixed(2)} DA/jour
                </p>
              </div>
            )}
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              💡 Astuce: Le produit sera sélectionné automatiquement une fois trouvé
            </p>
          </div>

          {/* Recherche de client */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Recherche de client
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un client par nom ou téléphone..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              
              {showClientDropdown && clientSearch && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredClients.slice(0, 10).map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleClientSelect(client)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {client.phone} {client.email && `• ${client.email}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmitRental} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Produit</label>
              <select
                value={rentalForm.productId}
                onChange={(e) => setRentalForm({...rentalForm, productId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Sélectionner un produit</option>
                {products.filter(p => p.stock > 0).map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.barcode} - {product.rentalPrice.toFixed(2)} DA/jour (Stock: {product.stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantité</label>
              <input
                type="number"
                min="1"
                value={rentalForm.quantity}
                onChange={(e) => setRentalForm({...rentalForm, quantity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Caution (DA)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rentalForm.deposit}
                onChange={(e) => setRentalForm({...rentalForm, deposit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Montant payé (DA)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rentalForm.paidAmount}
                onChange={(e) => setRentalForm({...rentalForm, paidAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date de début</label>
              <input
                type="date"
                value={rentalForm.startDate}
                onChange={(e) => setRentalForm({...rentalForm, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date de fin</label>
              <input
                type="date"
                value={rentalForm.endDate}
                onChange={(e) => setRentalForm({...rentalForm, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRentalForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRentals.map((rental) => {
                const client = clients.find(c => c.id === rental.clientId);
                const product = products.find(p => p.id === rental.productId);
                const isOverdue = rental.status === 'active' && isAfter(new Date(), new Date(rental.endDate));
                
                return (
                  <tr key={rental.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(rental.createdAt), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(rental.createdAt), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {client?.firstName} {client?.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{client?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{product?.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Code: {product?.barcode} | Qté: {rental.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(rental.startDate), 'dd/MM/yyyy')} - {format(new Date(rental.endDate), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) + 1} jours
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {rental.totalAmount.toFixed(2)} DA
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Payé: {rental.paidAmount.toFixed(2)} DA
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rental.status === 'returned' 
                          ? 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300' 
                          : isOverdue
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      }`}>
                        {rental.status === 'returned' ? 'Retourné' : isOverdue ? 'En retard' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePrintReceipt(rental)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {rental.status === 'active' && (
                          <button
                            onClick={() => handleReturnRental(rental)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
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