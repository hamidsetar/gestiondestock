import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Sale, Rental, Product, Client, Payment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  Search, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  User,
  Package,
  Receipt,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { generateReceiptPDF } from '../utils/receipt';

interface DebtTransaction {
  id: string;
  type: 'sale' | 'rental';
  client: Client;
  product: Product;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  createdBy: string;
}

const PaymentCompletion: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<DebtTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesData, rentalsData, productsData, clientsData, paymentsData] = await Promise.all([
        SupabaseService.getSales(),
        SupabaseService.getRentals(),
        SupabaseService.getProducts(),
        SupabaseService.getClients(),
        SupabaseService.getPayments()
      ]);
      setSales(salesData);
      setRentals(rentalsData);
      setProducts(productsData);
      setClients(clientsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDebtTransactions = (): DebtTransaction[] => {
    const debtTransactions: DebtTransaction[] = [];

    // Ventes avec dettes
    sales.filter(sale => sale.remainingAmount > 0).forEach(sale => {
      const client = clients.find(c => c.id === sale.clientId);
      const product = products.find(p => p.id === sale.productId);
      
      if (client && product) {
        debtTransactions.push({
          id: sale.id,
          type: 'sale',
          client,
          product,
          totalAmount: sale.totalAmount,
          paidAmount: sale.paidAmount,
          remainingAmount: sale.remainingAmount,
          createdAt: sale.createdAt,
          createdBy: sale.createdBy
        });
      }
    });

    // Locations avec dettes
    rentals.filter(rental => rental.remainingAmount > 0).forEach(rental => {
      const client = clients.find(c => c.id === rental.clientId);
      const product = products.find(p => p.id === rental.productId);
      
      if (client && product) {
        debtTransactions.push({
          id: rental.id,
          type: 'rental',
          client,
          product,
          totalAmount: rental.totalAmount,
          paidAmount: rental.paidAmount,
          remainingAmount: rental.remainingAmount,
          createdAt: rental.createdAt,
          createdBy: rental.createdBy
        });
      }
    });

    return debtTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const filteredTransactions = getDebtTransactions().filter(transaction =>
    transaction.client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.client.phone.includes(searchTerm) ||
    transaction.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.product.barcode.includes(searchTerm)
  );

  const handlePayment = async () => {
    if (!selectedTransaction || !paymentAmount) {
      alert('Veuillez sélectionner une transaction et saisir un montant');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > selectedTransaction.remainingAmount) {
      alert(`Le montant doit être entre 0 et ${selectedTransaction.remainingAmount.toFixed(2)} DA`);
      return;
    }

    try {
      // Créer le paiement
      const newPayment: Payment = {
        id: crypto.randomUUID(),
        transactionId: selectedTransaction.id,
        transactionType: selectedTransaction.type,
        amount,
        paymentMethod,
        createdBy: `${user?.firstName} ${user?.lastName}`,
        createdAt: new Date().toISOString()
      };

      await SupabaseService.savePayment(newPayment);

      // Mettre à jour la transaction
      const newPaidAmount = selectedTransaction.paidAmount + amount;
      const newRemainingAmount = selectedTransaction.totalAmount - newPaidAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

      if (selectedTransaction.type === 'sale') {
        const sale = sales.find(s => s.id === selectedTransaction.id);
        if (sale) {
          const updatedSale: Sale = {
            ...sale,
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus as 'paid' | 'partial' | 'pending'
          };
          await SupabaseService.saveSale(updatedSale);
        }
      } else {
        const rental = rentals.find(r => r.id === selectedTransaction.id);
        if (rental) {
          const updatedRental: Rental = {
            ...rental,
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount
          };
          await SupabaseService.saveRental(updatedRental);
        }
      }

      // Générer un reçu de paiement
      const receipt = {
        id: newPayment.id,
        type: 'payment' as const,
        transactionId: selectedTransaction.id,
        clientName: `${selectedTransaction.client.firstName} ${selectedTransaction.client.lastName}`,
        items: [{
          name: `Paiement - ${selectedTransaction.product.name}`,
          quantity: 1,
          unitPrice: amount,
          total: amount
        }],
        total: amount,
        paid: amount,
        remaining: newRemainingAmount,
        createdBy: newPayment.createdBy,
        createdAt: newPayment.createdAt
      };

      generateReceiptPDF(receipt, selectedTransaction.client, products);

      // Recharger les données
      await loadData();
      
      // Réinitialiser le formulaire
      setSelectedTransaction(null);
      setPaymentAmount('');
      setPaymentMethod('cash');

      alert(`Paiement de ${amount.toFixed(2)} DA enregistré avec succès !`);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Erreur lors du traitement du paiement');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-8 h-8 text-green-600 dark:text-green-400" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Complétion des Paiements</h1>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredTransactions.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transactions impayées</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredTransactions.reduce((sum, t) => sum + t.remainingAmount, 0).toFixed(0)} DA
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total à encaisser</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {payments.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paiements effectués</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par client ou produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Formulaire de paiement */}
      {selectedTransaction && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nouveau Paiement</h2>
            <button
              onClick={() => setSelectedTransaction(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations de la transaction */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white mb-3">Détails de la transaction</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Client:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedTransaction.client.firstName} {selectedTransaction.client.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Produit:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedTransaction.product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedTransaction.type === 'sale' ? 'Vente' : 'Location'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedTransaction.totalAmount.toFixed(2)} DA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Déjà payé:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {selectedTransaction.paidAmount.toFixed(2)} DA
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 dark:text-gray-300">Reste à payer:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {selectedTransaction.remainingAmount.toFixed(2)} DA
                  </span>
                </div>
              </div>
            </div>

            {/* Formulaire de paiement */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Montant du paiement (DA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedTransaction.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount((selectedTransaction.remainingAmount / 2).toFixed(2))}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedTransaction.remainingAmount.toFixed(2))}
                    className="px-3 py-1 text-xs bg-green-200 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-300 dark:hover:bg-green-900/30"
                  >
                    Tout payer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mode de paiement
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'transfer')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte bancaire</option>
                  <option value="transfer">Virement</option>
                </select>
              </div>

              <button
                onClick={handlePayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Enregistrer le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des transactions impayées */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Transactions avec dettes</h3>
        </div>
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Montants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {format(new Date(transaction.createdAt), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(transaction.createdAt), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.client.firstName} {transaction.client.lastName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.client.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">{transaction.product.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.product.barcode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'sale' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400' 
                        : 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400'
                    }`}>
                      {transaction.type === 'sale' ? 'Vente' : 'Location'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white">
                        Total: {transaction.totalAmount.toFixed(2)} DA
                      </div>
                      <div className="text-green-600 dark:text-green-400">
                        Payé: {transaction.paidAmount.toFixed(2)} DA
                      </div>
                      <div className="text-red-600 dark:text-red-400 font-medium">
                        Reste: {transaction.remainingAmount.toFixed(2)} DA
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Payer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentCompletion;