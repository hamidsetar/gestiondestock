import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Rental, Product, Client } from '../types';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  User, 
  Package,
  Printer,
  Eye,
  X
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import jsPDF from 'jspdf';

const RentalContract: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);

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

  const generateRentalContract = (rental: Rental) => {
    const client = clients.find(c => c.id === rental.clientId);
    const product = products.find(p => p.id === rental.productId);
    
    if (!client || !product) return;

    const doc = new jsPDF();
    const days = differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) + 1;
    
    // En-tête avec logo
    try {
      doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
    } catch (error) {
      console.log('Logo non trouvé');
    }
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRAT DE LOCATION', 105, 60, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HALI - BOUTIQUE DE MODE', 105, 75, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Adresse: [Votre adresse]', 105, 85, { align: 'center' });
    doc.text('Téléphone: +212 XXX XXX XXX', 105, 92, { align: 'center' });
    
    let yPosition = 110;
    
    // Informations du contrat
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS DU CONTRAT', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Numéro de contrat: ${rental.id.substring(0, 8).toUpperCase()}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Date d'établissement: ${format(new Date(rental.createdAt), 'dd/MM/yyyy')}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Établi par: ${rental.createdBy}`, 20, yPosition);
    yPosition += 15;
    
    // Parties contractantes
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTIES CONTRACTANTES', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('LE BAILLEUR:', 20, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.text('HALI - Boutique de Mode', 20, yPosition);
    yPosition += 4;
    doc.text('Représentée par: [Nom du gérant]', 20, yPosition);
    yPosition += 4;
    doc.text('Adresse: [Adresse de la boutique]', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('LE LOCATAIRE:', 20, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nom: ${client.firstName} ${client.lastName}`, 20, yPosition);
    yPosition += 4;
    doc.text(`Téléphone: ${client.phone}`, 20, yPosition);
    yPosition += 4;
    if (client.email) {
      doc.text(`Email: ${client.email}`, 20, yPosition);
      yPosition += 4;
    }
    if (client.address) {
      doc.text(`Adresse: ${client.address}`, 20, yPosition);
      yPosition += 4;
    }
    yPosition += 10;
    
    // Article détaillé
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ARTICLE LOUÉ', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Désignation: ${product.name}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Catégorie: ${product.category}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Taille: ${product.size}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Couleur: ${product.color}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Code article: ${product.barcode}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Quantité louée: ${rental.quantity}`, 20, yPosition);
    yPosition += 15;
    
    // Conditions de location
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDITIONS DE LOCATION', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Période de location: Du ${format(new Date(rental.startDate), 'dd/MM/yyyy')} au ${format(new Date(rental.endDate), 'dd/MM/yyyy')}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Durée: ${days} jour${days > 1 ? 's' : ''}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Tarif journalier: ${rental.dailyRate.toFixed(2)} DH`, 20, yPosition);
    yPosition += 6;
    doc.text(`Montant total de la location: ${rental.totalAmount.toFixed(2)} DH`, 20, yPosition);
    yPosition += 6;
    doc.text(`Caution versée: ${rental.deposit.toFixed(2)} DH`, 20, yPosition);
    yPosition += 6;
    doc.text(`Montant payé: ${rental.paidAmount.toFixed(2)} DH`, 20, yPosition);
    yPosition += 6;
    if (rental.remainingAmount > 0) {
      doc.text(`Solde restant: ${rental.remainingAmount.toFixed(2)} DH`, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 10;
    
    // Nouvelle page pour les conditions
    doc.addPage();
    yPosition = 30;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDITIONS GÉNÉRALES', 20, yPosition);
    yPosition += 15;
    
    const conditions = [
      '1. ÉTAT DE L\'ARTICLE',
      '   • Le locataire reconnaît avoir reçu l\'article en parfait état.',
      '   • Tout défaut constaté doit être signalé immédiatement.',
      '   • L\'article doit être restitué dans l\'état initial.',
      '',
      '2. UTILISATION',
      '   • L\'article est loué exclusivement pour l\'usage convenu.',
      '   • Toute modification ou altération est interdite.',
      '   • Le locataire est responsable de l\'entretien pendant la location.',
      '',
      '3. RETOUR',
      '   • L\'article doit être retourné à la date convenue.',
      '   • Tout retard entraîne une facturation au tarif journalier.',
      '   • Le retour doit se faire aux heures d\'ouverture de la boutique.',
      '',
      '4. CAUTION',
      '   • La caution sera restituée après vérification de l\'état de l\'article.',
      '   • En cas de dommage, le coût des réparations sera déduit de la caution.',
      '   • Si les dommages excèdent la caution, le locataire s\'engage à payer la différence.',
      '',
      '5. RESPONSABILITÉ',
      '   • Le locataire est responsable de l\'article pendant toute la durée de location.',
      '   • En cas de vol ou de perte, le locataire devra rembourser la valeur de l\'article.',
      '   • HALI décline toute responsabilité en cas d\'accident lié à l\'utilisation.',
      '',
      '6. RÉSILIATION',
      '   • En cas de non-respect des conditions, HALI peut résilier le contrat.',
      '   • Aucun remboursement ne sera effectué en cas de résiliation pour faute.',
      '',
      '7. LITIGES',
      '   • Tout litige sera soumis aux tribunaux compétents.',
      '   • Le droit marocain s\'applique à ce contrat.'
    ];
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    conditions.forEach(condition => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      
      if (condition.startsWith('   •') || condition.startsWith('   ')) {
        doc.text(condition, 25, yPosition);
      } else if (condition === '') {
        yPosition += 3;
        return;
      } else {
        doc.setFont('helvetica', 'bold');
        doc.text(condition, 20, yPosition);
        doc.setFont('helvetica', 'normal');
      }
      yPosition += 5;
    });
    
    // Signatures
    yPosition += 20;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', 20, yPosition);
    yPosition += 20;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Le Bailleur (HALI)', 30, yPosition);
    doc.text('Le Locataire', 130, yPosition);
    yPosition += 5;
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 30, yPosition);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 130, yPosition);
    yPosition += 20;
    
    // Lignes pour signatures
    doc.text('_________________________', 30, yPosition);
    doc.text('_________________________', 130, yPosition);
    yPosition += 5;
    doc.text('Signature et cachet', 30, yPosition);
    doc.text('Signature', 130, yPosition);
    
    // Sauvegarder
    doc.save(`contrat-location-${rental.id.substring(0, 8)}-${client.lastName}.pdf`);
  };

  const filteredRentals = rentals.filter(rental => {
    const client = clients.find(c => c.id === rental.clientId);
    const product = products.find(p => p.id === rental.productId);
    
    return (
      client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.phone.includes(searchTerm) ||
      product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.barcode.includes(searchTerm)
    );
  });

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
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Contrats de Location</h1>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{rentals.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total contrats</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {rentals.filter(r => r.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Locations actives</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(rentals.map(r => r.clientId)).size}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clients uniques</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {rentals.filter(r => r.status === 'reserved').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Réservations</p>
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Aperçu du contrat sélectionné */}
      {selectedRental && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Aperçu du Contrat</h2>
            <button
              onClick={() => setSelectedRental(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {(() => {
            const client = clients.find(c => c.id === selectedRental.clientId);
            const product = products.find(p => p.id === selectedRental.productId);
            const days = differenceInDays(new Date(selectedRental.endDate), new Date(selectedRental.startDate)) + 1;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 dark:text-white mb-3">Informations Client</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Nom:</span> {client?.firstName} {client?.lastName}</div>
                      <div><span className="font-medium">Téléphone:</span> {client?.phone}</div>
                      {client?.email && <div><span className="font-medium">Email:</span> {client.email}</div>}
                      {client?.address && <div><span className="font-medium">Adresse:</span> {client.address}</div>}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 dark:text-white mb-3">Article Loué</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Produit:</span> {product?.name}</div>
                      <div><span className="font-medium">Catégorie:</span> {product?.category}</div>
                      <div><span className="font-medium">Taille:</span> {product?.size}</div>
                      <div><span className="font-medium">Couleur:</span> {product?.color}</div>
                      <div><span className="font-medium">Code:</span> {product?.barcode}</div>
                      <div><span className="font-medium">Quantité:</span> {selectedRental.quantity}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 dark:text-white mb-3">Conditions de Location</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Début:</span> {format(new Date(selectedRental.startDate), 'dd/MM/yyyy')}</div>
                      <div><span className="font-medium">Fin:</span> {format(new Date(selectedRental.endDate), 'dd/MM/yyyy')}</div>
                      <div><span className="font-medium">Durée:</span> {days} jour{days > 1 ? 's' : ''}</div>
                      <div><span className="font-medium">Tarif/jour:</span> {selectedRental.dailyRate.toFixed(2)} DH</div>
                      <div><span className="font-medium">Total:</span> {selectedRental.totalAmount.toFixed(2)} DH</div>
                      <div><span className="font-medium">Caution:</span> {selectedRental.deposit.toFixed(2)} DH</div>
                      <div><span className="font-medium">Payé:</span> {selectedRental.paidAmount.toFixed(2)} DH</div>
                      {selectedRental.remainingAmount > 0 && (
                        <div><span className="font-medium">Reste:</span> {selectedRental.remainingAmount.toFixed(2)} DH</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => generateRentalContract(selectedRental)}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Télécharger le Contrat PDF
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Liste des locations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Toutes les Locations</h3>
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
                  Période
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
                const days = differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) + 1;
                const isOverdue = rental.status === 'active' && new Date() > new Date(rental.endDate);
                
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
                      <div className="text-xs text-gray-500 dark:text-gray-400">{client?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{product?.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Qté: {rental.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(rental.startDate), 'dd/MM')} - {format(new Date(rental.endDate), 'dd/MM')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{days} jour{days > 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rental.status === 'returned' 
                          ? 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300' 
                          : isOverdue
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                          : rental.status === 'reserved'
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      }`}>
                        {rental.status === 'returned' ? 'Retourné' : 
                         isOverdue ? 'En retard' : 
                         rental.status === 'reserved' ? 'Réservé' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedRental(rental)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                          title="Voir le contrat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateRentalContract(rental)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          title="Télécharger le contrat"
                        >
                          <Download className="w-4 h-4" />
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

export default RentalContract;