import jsPDF from 'jspdf';
import { Receipt, Client, Product } from '../types';

export const generateReceiptPDF = (receipt: Receipt, client: Client, products: Product[]) => {
  const doc = new jsPDF();
  
  // Configuration des couleurs
  const primaryColor = [20, 184, 166]; // Teal
  const secondaryColor = [75, 85, 99]; // Gray
  const accentColor = [16, 185, 129]; // Emerald
  
  // En-tête avec logo et informations boutique
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Logo (si disponible)
  try {
    doc.addImage('/hali copy.jpg', 'JPEG', 15, 10, 30, 30);
  } catch (error) {
    console.log('Logo non trouvé, utilisation du texte');
  }
  
  // Nom de la boutique
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('HALI', 55, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Boutique de Mode & Location', 55, 35);
  doc.text('Téléphone: +212 XXX XXX XXX', 55, 42);
  
  // Type de document
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const documentTitle = receipt.type === 'sale' ? 'BON DE VENTE' : 'BON DE LOCATION';
  doc.text(documentTitle, 150, 25);
  
  // Numéro et date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N°: ${receipt.id.substring(0, 8).toUpperCase()}`, 150, 35);
  doc.text(`Date: ${new Date(receipt.createdAt).toLocaleDateString('fr-FR')}`, 150, 42);
  
  // Informations client
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS CLIENT', 20, 70);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom: ${receipt.clientName}`, 20, 85);
  doc.text(`Téléphone: ${client.phone}`, 20, 95);
  if (client.email) {
    doc.text(`Email: ${client.email}`, 20, 105);
  }
  if (client.address) {
    doc.text(`Adresse: ${client.address}`, 20, client.email ? 115 : 105);
  }
  
  let yPosition = client.address ? 135 : (client.email ? 125 : 115);
  
  // Informations spécifiques à la location
  if (receipt.type === 'rental') {
    // Récupérer les informations de location depuis les items
    const rentalItem = receipt.items[0];
    const itemName = rentalItem.name;
    
    // Extraire les dates du nom de l'item (format: "Produit (X jours)")
    const daysMatch = itemName.match(/\((\d+) jours?\)/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 1;
    
    // Calculer les dates (approximation basée sur la date de création)
    const startDate = new Date(receipt.createdAt);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);
    const returnDate = new Date(endDate);
    returnDate.setDate(endDate.getDate() + 1);
    
    doc.setFillColor(240, 253, 250); // Vert très clair
    doc.rect(15, yPosition, 180, 45, 'F');
    
    doc.setTextColor(...accentColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS DE LOCATION', 20, yPosition + 15);
    
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`📅 Date de début: ${startDate.toLocaleDateString('fr-FR')}`, 20, yPosition + 28);
    doc.text(`📅 Date de fin: ${endDate.toLocaleDateString('fr-FR')}`, 110, yPosition + 28);
    doc.text(`⏱️ Durée: ${days} jour${days > 1 ? 's' : ''}`, 20, yPosition + 38);
    doc.text(`🔄 Date de récupération: ${returnDate.toLocaleDateString('fr-FR')}`, 110, yPosition + 38);
    
    yPosition += 60;
  }
  
  // Tableau des articles
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAIL DES ARTICLES', 20, yPosition);
  yPosition += 15;
  
  // En-tête du tableau
  doc.setFillColor(249, 250, 251);
  doc.rect(15, yPosition - 5, 180, 15, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Article', 20, yPosition + 5);
  doc.text('Qté', 120, yPosition + 5);
  doc.text('Prix Unit.', 140, yPosition + 5);
  doc.text('Total', 170, yPosition + 5);
  
  yPosition += 20;
  
  // Articles
  doc.setFont('helvetica', 'normal');
  receipt.items.forEach((item, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    // Nom du produit (sans la durée pour les locations)
    const productName = receipt.type === 'rental' 
      ? item.name.replace(/\s*\(\d+ jours?\)/, '')
      : item.name;
    
    doc.text(productName, 20, yPosition);
    doc.text(item.quantity.toString(), 125, yPosition);
    doc.text(`${item.unitPrice.toFixed(2)} DH`, 140, yPosition);
    doc.text(`${item.total.toFixed(2)} DH`, 170, yPosition);
    
    yPosition += 12;
  });
  
  // Ligne de séparation
  doc.setDrawColor(...secondaryColor);
  doc.line(15, yPosition + 5, 195, yPosition + 5);
  yPosition += 20;
  
  // Totaux
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Sous-total: ${receipt.total.toFixed(2)} DH`, 130, yPosition);
  yPosition += 12;
  
  if (receipt.type === 'rental') {
    // Afficher la caution pour les locations
    doc.setFont('helvetica', 'normal');
    doc.text(`Caution: ${(receipt.total * 0.1).toFixed(2)} DH`, 130, yPosition);
    yPosition += 12;
    doc.setFont('helvetica', 'bold');
  }
  
  doc.text(`Montant payé: ${receipt.paid.toFixed(2)} DH`, 130, yPosition);
  yPosition += 12;
  
  if (receipt.remaining > 0) {
    doc.setTextColor(220, 38, 38); // Rouge
    doc.text(`Reste à payer: ${receipt.remaining.toFixed(2)} DH`, 130, yPosition);
  } else {
    doc.setTextColor(...accentColor);
    doc.text('PAYÉ INTÉGRALEMENT', 130, yPosition);
  }
  
  yPosition += 25;
  
  // Conditions pour les locations
  if (receipt.type === 'rental') {
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDITIONS DE LOCATION:', 20, yPosition);
    yPosition += 12;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const conditions = [
      '• Le client s\'engage à retourner l\'article dans l\'état où il l\'a reçu',
      '• Tout retard sera facturé au tarif journalier',
      '• La caution sera restituée après vérification de l\'état de l\'article',
      '• En cas de dégradation, les frais de réparation seront déduits de la caution',
      '• Le client est responsable de l\'article pendant toute la durée de location'
    ];
    
    conditions.forEach(condition => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 30;
      }
      doc.text(condition, 20, yPosition);
      yPosition += 8;
    });
    
    yPosition += 10;
  }
  
  // Pied de page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 30;
  }
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vendu par: ${receipt.createdBy}`, 20, yPosition);
  doc.text(`Merci de votre confiance !`, 20, yPosition + 12);
  
  // Signature
  doc.text('Signature client:', 130, yPosition);
  doc.rect(130, yPosition + 5, 60, 20);
  
  // Télécharger le PDF
  const fileName = receipt.type === 'sale' 
    ? `bon-vente-${receipt.id.substring(0, 8)}.pdf`
    : `bon-location-${receipt.id.substring(0, 8)}.pdf`;
  
  doc.save(fileName);
};

export const generateClientListPDF = (clients: any[]) => {
  const doc = new jsPDF();
  
  // En-tête
  try {
    doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
  } catch (error) {
    console.log('Logo non trouvé');
  }
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTE DES CLIENTS - HALI', 105, 60, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 75, { align: 'center' });
  
  let yPosition = 95;
  
  // En-tête du tableau
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Nom', 20, yPosition);
  doc.text('Téléphone', 80, yPosition);
  doc.text('Email', 130, yPosition);
  doc.text('Date création', 170, yPosition);
  
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
  
  doc.save('liste-clients-hali.pdf');
};