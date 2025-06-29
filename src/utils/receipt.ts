import jsPDF from 'jspdf';
import { Receipt, Client, Product } from '../types';

export const generateReceiptPDF = (receipt: Receipt, client: Client, products: Product[]) => {
  // Configuration pour reçu thermique (58mm ou 80mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200] // Format 80mm de large, hauteur variable
  });
  
  // Configuration des polices (éviter les caractères spéciaux)
  doc.setFont('helvetica');
  
  let yPosition = 10;
  
  // En-tête boutique
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('HIYA', 40, yPosition, { align: 'center' });
  yPosition += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Boutique de Mode & Location', 40, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('Tel: +213 XXX XXX XXX', 40, yPosition, { align: 'center' });
  yPosition += 8;
  
  // Ligne de séparation
  doc.text('================================', 40, yPosition, { align: 'center' });
  yPosition += 6;
  
  // Type de document
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const documentTitle = receipt.type === 'sale' ? 'BON DE VENTE' : 'BON DE LOCATION';
  doc.text(documentTitle, 40, yPosition, { align: 'center' });
  yPosition += 8;
  
  // Numéro et date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`No: ${receipt.id.substring(0, 8).toUpperCase()}`, 5, yPosition);
  doc.text(`Date: ${new Date(receipt.createdAt).toLocaleDateString('fr-FR')}`, 5, yPosition + 4);
  doc.text(`Heure: ${new Date(receipt.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 5, yPosition + 8);
  yPosition += 16;
  
  // Informations client
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT:', 5, yPosition);
  yPosition += 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${receipt.clientName}`, 5, yPosition);
  yPosition += 4;
  doc.text(`Tel: ${client.phone}`, 5, yPosition);
  yPosition += 6;
  
  // Informations spécifiques à la location
  if (receipt.type === 'rental') {
    const rentalItem = receipt.items[0];
    const itemName = rentalItem.name;
    
    // Extraire les dates du nom de l'item
    const daysMatch = itemName.match(/\((\d+) jours?\)/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 1;
    
    const startDate = new Date(receipt.createdAt);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);
    const returnDate = new Date(endDate);
    returnDate.setDate(endDate.getDate() + 1);
    
    doc.text('--------------------------------', 5, yPosition);
    yPosition += 4;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('LOCATION:', 5, yPosition);
    yPosition += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Debut: ${startDate.toLocaleDateString('fr-FR')}`, 5, yPosition);
    yPosition += 4;
    doc.text(`Fin: ${endDate.toLocaleDateString('fr-FR')}`, 5, yPosition);
    yPosition += 4;
    doc.text(`Duree: ${days} jour${days > 1 ? 's' : ''}`, 5, yPosition);
    yPosition += 4;
    doc.text(`Retour: ${returnDate.toLocaleDateString('fr-FR')}`, 5, yPosition);
    yPosition += 6;
  }
  
  // Ligne de séparation
  doc.text('--------------------------------', 5, yPosition);
  yPosition += 6;
  
  // Articles
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLES:', 5, yPosition);
  yPosition += 6;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  receipt.items.forEach((item) => {
    // Nom du produit (sans la durée pour les locations)
    const productName = receipt.type === 'rental' 
      ? item.name.replace(/\s*\(\d+ jours?\)/, '')
      : item.name;
    
    // Limiter la longueur du nom
    const shortName = productName.length > 25 ? productName.substring(0, 25) + '...' : productName;
    
    doc.text(shortName, 5, yPosition);
    yPosition += 4;
    
    doc.text(`${item.quantity} x ${item.unitPrice.toFixed(2)} DA`, 5, yPosition);
    doc.text(`${item.total.toFixed(2)} DA`, 60, yPosition);
    yPosition += 6;
  });
  
  // Ligne de séparation
  doc.text('--------------------------------', 5, yPosition);
  yPosition += 6;
  
  // Totaux
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  doc.text(`SOUS-TOTAL:`, 5, yPosition);
  doc.text(`${receipt.total.toFixed(2)} DA`, 60, yPosition);
  yPosition += 5;
  
  if (receipt.type === 'rental') {
    const caution = receipt.total * 0.1;
    doc.setFont('helvetica', 'normal');
    doc.text(`Caution:`, 5, yPosition);
    doc.text(`${caution.toFixed(2)} DA`, 60, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
  }
  
  doc.text(`PAYE:`, 5, yPosition);
  doc.text(`${receipt.paid.toFixed(2)} DA`, 60, yPosition);
  yPosition += 5;
  
  if (receipt.remaining > 0) {
    doc.text(`RESTE:`, 5, yPosition);
    doc.text(`${receipt.remaining.toFixed(2)} DA`, 60, yPosition);
    yPosition += 8;
  } else {
    doc.text('*** PAYE INTEGRALEMENT ***', 40, yPosition, { align: 'center' });
    yPosition += 8;
  }
  
  // Conditions pour les locations (version courte)
  if (receipt.type === 'rental') {
    doc.text('--------------------------------', 5, yPosition);
    yPosition += 4;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDITIONS:', 5, yPosition);
    yPosition += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text('- Retour dans l\'etat initial', 5, yPosition);
    yPosition += 3;
    doc.text('- Retard facture au tarif/jour', 5, yPosition);
    yPosition += 3;
    doc.text('- Caution restituee apres controle', 5, yPosition);
    yPosition += 6;
  }
  
  // Pied de page
  doc.text('--------------------------------', 5, yPosition);
  yPosition += 4;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vendeur: ${receipt.createdBy}`, 5, yPosition);
  yPosition += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('MERCI DE VOTRE VISITE !', 40, yPosition, { align: 'center' });
  yPosition += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Signature client:', 5, yPosition);
  yPosition += 10;
  
  // Ligne pour signature
  doc.text('_________________________', 5, yPosition);
  
  // Ajuster la hauteur du PDF selon le contenu
  const finalHeight = yPosition + 10;
  
  // Créer un nouveau PDF avec la bonne hauteur
  const finalDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, finalHeight]
  });
  
  // Copier le contenu
  const pageData = doc.internal.pages[1];
  finalDoc.internal.pages[1] = pageData;
  
  // Télécharger le PDF
  const fileName = receipt.type === 'sale' 
    ? `recu-vente-${receipt.id.substring(0, 8)}.pdf`
    : `recu-location-${receipt.id.substring(0, 8)}.pdf`;
  
  finalDoc.save(fileName);
};

export const generateClientListPDF = (clients: any[]) => {
  const doc = new jsPDF();
  
  // En-tête
  try {
    doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
  } catch (error) {
    console.log('Logo non trouve');
  }
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTE DES CLIENTS - HIYA', 105, 60, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 75, { align: 'center' });
  
  let yPosition = 95;
  
  // En-tête du tableau
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Nom', 20, yPosition);
  doc.text('Telephone', 80, yPosition);
  doc.text('Email', 130, yPosition);
  doc.text('Date creation', 170, yPosition);
  
  yPosition += 10;
  
  // Clients
  doc.setFont('helvetica', 'normal');
  clients.forEach((client) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.text(`${client.firstName} ${client.lastName}`, 20, yPosition);
    doc.text(client.phone, 80, yPosition);
    doc.text(client.email || 'N/A', 130, yPosition);
    doc.text(new Date(client.createdAt).toLocaleDateString('fr-FR'), 170, yPosition);
    
    yPosition += 8;
  });
  
  doc.save('liste-clients-hiya.pdf');
};