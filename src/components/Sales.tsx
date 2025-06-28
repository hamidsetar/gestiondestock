import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { generateReceiptPDF } from '../utils/receipt';
import { Sale, Product, Client, Receipt } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Printer, DollarSign, Scan } from 'lucide-react';

const Sales: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [saleForm, setSaleForm] = useState({
    clientId: '',
    productId: '',
    quantity: '1',
    discount: '0',
    paidAmount: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesData, productsData, clientsData] = await Promise.all([
        SupabaseService.getSales(),
        SupabaseService.getProducts(),
        SupabaseService.getClients()
      ]);
      setSales(salesData);
      setProducts(productsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    const client = clients.find(c => c.id === sale.clientId);
    const product = products.find(p => p.id === sale.productId);
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
      setSaleForm({...saleForm, productId: product.id});
      setBarcodeSearch('');
    } else {
      alert('Produit non trouvé ou en rupture de stock');
    }
  };

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const product = products.find(p => p.id === saleForm.productId);
      const client = clients.find(c => c.id === saleForm.clientId);
      
      if (!product || !client) return;

      const quantity = parseInt(saleForm.quantity);
      const discount = parseFloat(saleForm.discount) || 0;
      const paidAmount = parseFloat(saleForm.paidAmount) || 0;
      
      const totalAmount = (product.price * quantity) - discount;
      const remainingAmount = totalAmount - paidAmount;

      const newSale: Sale = {
        id: crypto.randomUUID(),
        clientId: saleForm.clientId,
        productId: saleForm.productId,
        quantity,
        unitPrice: product.price,
        discount,
        totalAmount,
        paidAmount,
        remainingAmount,
        status: remainingAmount > 0 ? 'partial' : 'paid',
        createdBy: `${user?.firstName} ${user?.lastName}`,
        createdAt: new Date().toISOString()
      };

      // Update product stock
      const updatedProduct = { ...product, stock: product.stock - quantity };
      await SupabaseService.saveProduct(updatedProduct);

      // Save sale
      await SupabaseService.saveSale(newSale);

      // Reload data
      await loadData();

      // Generate receipt
      const receipt: Receipt = {
        id: newSale.id,
        type: 'sale',
        transactionId: newSale.id,
        clientName: `${client.firstName} ${client.lastName}`,
        items: [{
          name: product.name,
          quantity,
          unitPrice: product.price,
          total: product.price * quantity
        }],
        total: totalAmount,
        paid: paidAmount,
        remaining: remainingAmount,
        createdBy: newSale.createdBy,
        createdAt: newSale.createdAt
      };

      generateReceiptPDF(receipt, client, products);

      // Reset form
      setSaleForm({
        clientId: '',
        productId: '',
        quantity: '1',
        discount: '0',
        paidAmount: ''
      });
      setShowSaleForm(false);
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Erreur lors de la création de la vente');
    }
  };

  const handlePrintReceipt = (sale: Sale) => {
    const client = clients.find(c => c.id === sale.clientId);
    const product = products.find(p => p.id === sale.productId);
    
    if (!client || !product) return;

    const receipt: Receipt = {
      id: sale.id,
      type: 'sale',
      transactionId: sale.id,
      clientName: `${client.firstName} ${client.lastName}`,
      items: [{
        name: product.name,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        total: sale.unitPrice * sale.quantity
      }],
      total: sale.totalAmount,
      paid: sale.paidAmount,
      remaining: sale.remainingAmount,
      createdBy: sale.createdBy,
      createdAt: sale.createdAt
    };

    generateReceiptPDF(receipt, client, products);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Ventes</h1>
        <button
          onClick={() => setShowSaleForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle vente
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sale Form */}
      {showSaleForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Nouvelle vente</h2>
          
          {/* Recherche par code-barres */}
          <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h3 className="text-lg font-medium text-teal-800 mb-3 flex items-center">
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
                className="flex-1 px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => handleBarcodeSearch(barcodeSearch)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Rechercher
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmitSale} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <select
                value={saleForm.clientId}
                onChange={(e) => setSaleForm({...saleForm, clientId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                value={saleForm.productId}
                onChange={(e) => setSaleForm({...saleForm, productId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un produit</option>
                {products.filter(p => p.stock > 0).map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.barcode} - {product.price.toFixed(2)} DH (Stock: {product.stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
              <input
                type="number"
                min="1"
                value={saleForm.quantity}
                onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Réduction (DH)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={saleForm.discount}
                onChange={(e) => setSaleForm({...saleForm, discount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant payé (DH)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={saleForm.paidAmount}
                onChange={(e) => setSaleForm({...saleForm, paidAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSaleForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Enregistrer la vente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales Table */}
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
              {filteredSales.map((sale) => {
                const client = clients.find(c => c.id === sale.clientId);
                const product = products.find(p => p.id === sale.productId);
                
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {client?.firstName} {client?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{client?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product?.name}</div>
                      <div className="text-sm text-gray-500">Code: {product?.barcode} | Qté: {sale.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.totalAmount.toFixed(2)} DH
                      </div>
                      <div className="text-sm text-gray-500">
                        Payé: {sale.paidAmount.toFixed(2)} DH
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.status === 'paid' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : sale.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.status === 'paid' ? 'Payé' : sale.status === 'partial' ? 'Partiel' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePrintReceipt(sale)}
                          className="text-teal-600 hover:text-teal-900"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
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

export default Sales;