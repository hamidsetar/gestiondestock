import jsPDF from 'jspdf';
import { Receipt, Client, Product } from '../types';

export const generateReceiptPDF = (receipt: Receipt, client: Client, products: Product[]) => {
  // Configuration pour reçu thermique optimisé (80mm de large)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 250] // Format 80mm de large, hauteur adaptable
  });
  
  // Configuration des polices
  doc.setFont('helvetica');
  
  let yPosition = 8;
  
  // Logo en haut du reçu
  try {
    doc.addImage('/hali copy.jpg', 'JPEG', 30, yPosition, 20, 20);
    yPosition += 25;
  } catch (error) {
    console.log('Logo non trouvé, continuation sans logo');
    yPosition += 5;
  }
  
  // En-tête boutique
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('HIYA', 40, yPosition, { align: 'center' });
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Boutique de Mode & Location', 40, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('Tel: +213 XXX XXX XXX', 40, yPosition, { align: 'center' });
  yPosition += 8;
  
  // Ligne de séparation
  doc.setLineWidth(0.5);
  doc.line(5, yPosition, 75, yPosition);
  yPosition += 8;
  
  // Type de document
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const documentTitle = receipt.type === 'sale' ? 'BON DE VENTE' : 
                       receipt.type === 'rental' ? 'BON DE LOCATION' : 'RECU DE PAIEMENT';
  doc.text(documentTitle, 40, yPosition, { align: 'center' });
  yPosition += 10;
  
  // Numéro et date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`No: ${receipt.id.substring(0, 8).toUpperCase()}`, 5, yPosition);
  yPosition += 5;
  doc.text(`Date: ${new Date(receipt.createdAt).toLocaleDateString('fr-FR')}`, 5, yPosition);
  yPosition += 5;
  doc.text(`Heure: ${new Date(receipt.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 5, yPosition);
  yPosition += 8;
  
  // Ligne de séparation
  doc.line(5, yPosition, 75, yPosition);
  yPosition += 6;
  
  // Informations client
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT:', 5, yPosition);
  yPosition += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${receipt.clientName}`, 5, yPosition);
  yPosition += 5;
  doc.text(`Tel: ${client.phone}`, 5, yPosition);
  yPosition += 8;
  
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
    
    doc.line(5, yPosition, 75, yPosition);
    yPosition += 5;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('LOCATION:', 5, yPosition);
    yPosition += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Debut: ${startDate.toLocaleDateString('fr-FR')}`, 5, yPosition);
    yPosition += 4;
    doc.text(`Fin: ${endDate.toLocaleDateString('fr-FR')}`, 5, yPosition);
    yPosition += 4;
    doc.text(`Duree: ${days} jour${days > 1 ? 's' : ''}`, 5, yPosition);
    yPosition += 4;
    doc.text(`Retour: ${returnDate.toLocaleDateString('fr-FR')}`, 5, yPosition);
    yPosition += 8;
  }
  
  // Ligne de séparation
  doc.line(5, yPosition, 75, yPosition);
  yPosition += 6;
  
  // Articles
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLES:', 5, yPosition);
  yPosition += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  receipt.items.forEach((item) => {
    // Nom du produit (sans la durée pour les locations)
    const productName = receipt.type === 'rental' 
      ? item.name.replace(/\s*\(\d+ jours?\)/, '')
      : item.name;
    
    // Limiter la longueur du nom et gérer les retours à la ligne
    const maxLineLength = 35;
    const words = productName.split(' ');
    let currentLine = '';
    
    words.forEach((word, index) => {
      if ((currentLine + word).length > maxLineLength) {
        if (currentLine) {
          doc.text(currentLine.trim(), 5, yPosition);
          yPosition += 4;
          currentLine = word + ' ';
        } else {
          // Mot trop long, le couper
          doc.text(word.substring(0, maxLineLength), 5, yPosition);
          yPosition += 4;
          if (word.length > maxLineLength) {
            doc.text(word.substring(maxLineLength), 5, yPosition);
            yPosition += 4;
          }
          currentLine = '';
        }
      } else {
        currentLine += word + ' ';
      }
      
      if (index === words.length - 1 && currentLine) {
        doc.text(currentLine.trim(), 5, yPosition);
        yPosition += 4;
      }
    });
    
    yPosition += 2;
    
    // Prix et quantité
    doc.text(`${item.quantity} x ${item.unitPrice.toFixed(2)} DA`, 5, yPosition);
    doc.text(`${item.total.toFixed(2)} DA`, 55, yPosition);
    yPosition += 8;
  });
  
  // Ligne de séparation
  doc.line(5, yPosition, 75, yPosition);
  yPosition += 6;
  
  // Totaux
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  doc.text(`SOUS-TOTAL:`, 5, yPosition);
  doc.text(`${receipt.total.toFixed(2)} DA`, 55, yPosition);
  yPosition += 6;
  
  if (receipt.type === 'rental') {
    const caution = receipt.total * 0.1;
    doc.setFont('helvetica', 'normal');
    doc.text(`Caution:`, 5, yPosition);
    doc.text(`${caution.toFixed(2)} DA`, 55, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'bold');
  }
  
  doc.text(`PAYE:`, 5, yPosition);
  doc.text(`${receipt.paid.toFixed(2)} DA`, 55, yPosition);
  yPosition += 6;
  
  if (receipt.remaining > 0) {
    doc.text(`RESTE:`, 5, yPosition);
    doc.text(`${receipt.remaining.toFixed(2)} DA`, 55, yPosition);
    yPosition += 10;
  } else {
    doc.setFontSize(9);
    doc.text('*** PAYE INTEGRALEMENT ***', 40, yPosition, { align: 'center' });
    yPosition += 10;
  }
  
  // Conditions pour les locations (version courte)
  if (receipt.type === 'rental') {
    doc.line(5, yPosition, 75, yPosition);
    yPosition += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDITIONS:', 5, yPosition);
    yPosition += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text('- Retour dans l\'etat initial', 5, yPosition);
    yPosition += 4;
    doc.text('- Retard facture au tarif/jour', 5, yPosition);
    yPosition += 4;
    doc.text('- Caution restituee apres controle', 5, yPosition);
    yPosition += 8;
  }
  
  // Pied de page
  doc.line(5, yPosition, 75, yPosition);
  yPosition += 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vendeur: ${receipt.createdBy}`, 5, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('MERCI DE VOTRE VISITE !', 40, yPosition, { align: 'center' });
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Signature client:', 5, yPosition);
  yPosition += 8;
  
  // Ligne pour signature
  doc.line(5, yPosition, 50, yPosition);
  yPosition += 5;
  
  // Ajuster la hauteur du PDF selon le contenu
  const finalHeight = Math.max(yPosition + 10, 150); // Hauteur minimale de 150mm
  
  // Créer un nouveau PDF avec la bonne hauteur
  const finalDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, finalHeight]
  });
  
  // Recréer le contenu dans le nouveau document avec la bonne taille
  finalDoc.setFont('helvetica');
  let finalY = 8;
  
  // Logo en haut du reçu
  try {
    finalDoc.addImage('/hali copy.jpg', 'JPEG', 30, finalY, 20, 20);
    finalY += 25;
  } catch (error) {
    console.log('Logo non trouvé, continuation sans logo');
    finalY += 5;
  }
  
  // En-tête boutique
  finalDoc.setFontSize(18);
  finalDoc.setFont('helvetica', 'bold');
  finalDoc.text('HIYA', 40, finalY, { align: 'center' });
  finalY += 8;
  
  finalDoc.setFontSize(11);
  finalDoc.setFont('helvetica', 'normal');
  finalDoc.text('Boutique de Mode & Location', 40, finalY, { align: 'center' });
  finalY += 5;
  finalDoc.text('Tel: +213 XXX XXX XXX', 40, finalY, { align: 'center' });
  finalY += 8;
  
  // Ligne de séparation
  finalDoc.setLineWidth(0.5);
  finalDoc.line(5, finalY, 75, finalY);
  finalY += 8;
  
  // Type de document
  finalDoc.setFontSize(14);
  finalDoc.setFont('helvetica', 'bold');
  finalDoc.text(documentTitle, 40, finalY, { align: 'center' });
  finalY += 10;
  
  // Numéro et date
  finalDoc.setFontSize(10);
  finalDoc.setFont('helvetica', 'normal');
  finalDoc.text(`No: ${receipt.id.substring(0, 8).toUpperCase()}`, 5, finalY);
  finalY += 5;
  finalDoc.text(`Date: ${new Date(receipt.createdAt).toLocaleDateString('fr-FR')}`, 5, finalY);
  finalY += 5;
  finalDoc.text(`Heure: ${new Date(receipt.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 5, finalY);
  finalY += 8;
  
  // Ligne de séparation
  finalDoc.line(5, finalY, 75, finalY);
  finalY += 6;
  
  // Informations client
  finalDoc.setFontSize(11);
  finalDoc.setFont('helvetica', 'bold');
  finalDoc.text('CLIENT:', 5, finalY);
  finalY += 6;
  
  finalDoc.setFontSize(10);
  finalDoc.setFont('helvetica', 'normal');
  finalDoc.text(`${receipt.clientName}`, 5, finalY);
  finalY += 5;
  finalDoc.text(`Tel: ${client.phone}`, 5, finalY);
  finalY += 8;
  
  // Informations spécifiques à la location
  if (receipt.type === 'rental') {
    const rentalItem = receipt.items[0];
    const itemName = rentalItem.name;
    
    const daysMatch = itemName.match(/\((\d+) jours?\)/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 1;
    
    const startDate = new Date(receipt.createdAt);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);
    const returnDate = new Date(endDate);
    returnDate.setDate(endDate.getDate() + 1);
    
    finalDoc.line(5, finalY, 75, finalY);
    finalY += 5;
    
    finalDoc.setFontSize(11);
    finalDoc.setFont('helvetica', 'bold');
    finalDoc.text('LOCATION:', 5, finalY);
    finalY += 6;
    
    finalDoc.setFontSize(9);
    finalDoc.setFont('helvetica', 'normal');
    finalDoc.text(`Debut: ${startDate.toLocaleDateString('fr-FR')}`, 5, finalY);
    finalY += 4;
    finalDoc.text(`Fin: ${endDate.toLocaleDateString('fr-FR')}`, 5, finalY);
    finalY += 4;
    finalDoc.text(`Duree: ${days} jour${days > 1 ? 's' : ''}`, 5, finalY);
    finalY += 4;
    finalDoc.text(`Retour: ${returnDate.toLocaleDateString('fr-FR')}`, 5, finalY);
    finalY += 8;
  }
  
  // Ligne de séparation
  finalDoc.line(5, finalY, 75, finalY);
  finalY += 6;
  
  // Articles
  finalDoc.setFontSize(11);
  finalDoc.setFont('helvetica', 'bold');
  finalDoc.text('ARTICLES:', 5, finalY);
  finalY += 8;
  
  finalDoc.setFontSize(9);
  finalDoc.setFont('helvetica', 'normal');
  
  receipt.items.forEach((item) => {
    const productName = receipt.type === 'rental' 
      ? item.name.replace(/\s*\(\d+ jours?\)/, '')
      : item.name;
    
    // Gérer les noms longs avec retour à la ligne
    const maxLineLength = 35;
    const words = productName.split(' ');
    let currentLine = '';
    
    words.forEach((word, index) => {
      if ((currentLine + word).length > maxLineLength) {
        if (currentLine) {
          finalDoc.text(currentLine.trim(), 5, finalY);
          finalY += 4;
          currentLine = word + ' ';
        } else {
          finalDoc.text(word.substring(0, maxLineLength), 5, finalY);
          finalY += 4;
          if (word.length > maxLineLength) {
            finalDoc.text(word.substring(maxLineLength), 5, finalY);
            finalY += 4;
          }
          currentLine = '';
        }
      } else {
        currentLine += word + ' ';
      }
      
      if (index === words.length - 1 && currentLine) {
        finalDoc.text(currentLine.trim(), 5, finalY);
        finalY += 4;
      }
    });
    
    finalY += 2;
    
    finalDoc.text(`${item.quantity} x ${item.unitPrice.toFixed(2)} DA`, 5, finalY);
    finalDoc.text(`${item.total.toFixed(2)} DA`, 55, finalY);
    finalY += 8;
  });
  
  // Ligne de séparation
  finalDoc.line(5, finalY, 75, finalY);
  finalY += 6;
  
  // Totaux
  finalDoc.setFontSize(10);
  finalDoc.setFont('helvetica', 'bold');
  
  finalDoc.text(`SOUS-TOTAL:`, 5, finalY);
  finalDoc.text(`${receipt.total.toFixed(2)} DA`, 55, finalY);
  finalY += 6;
  
  if (receipt.type === 'rental') {
    const caution = receipt.total * 0.1;
    finalDoc.setFont('helvetica', 'normal');
    finalDoc.text(`Caution:`, 5, finalY);
    finalDoc.text(`${caution.toFixed(2)} DA`, 55, finalY);
    finalY += 6;
    finalDoc.setFont('helvetica', 'bold');
  }
  
  finalDoc.text(`PAYE:`, 5, finalY);
  finalDoc.text(`${receipt.paid.toFixed(2)} DA`, 55, finalY);
  finalY += 6;
  
  if (receipt.remaining > 0) {
    finalDoc.text(`RESTE:`, 5, finalY);
    finalDoc.text(`${receipt.remaining.toFixed(2)} DA`, 55, finalY);
    finalY += 10;
  } else {
    finalDoc.setFontSize(9);
    finalDoc.text('*** PAYE INTEGRALEMENT ***', 40, finalY, { align: 'center' });
    finalY += 10;
  }
  
  // Conditions pour les locations
  if (receipt.type === 'rental') {
    finalDoc.line(5, finalY, 75, finalY);
    finalY += 5;
    
    finalDoc.setFontSize(9);
    finalDoc.setFont('helvetica', 'bold');
    finalDoc.text('CONDITIONS:', 5, finalY);
    finalY += 5;
    
    finalDoc.setFont('helvetica', 'normal');
    finalDoc.text('- Retour dans l\'etat initial', 5, finalY);
    finalY += 4;
    finalDoc.text('- Retard facture au tarif/jour', 5, finalY);
    finalY += 4;
    finalDoc.text('- Caution restituee apres controle', 5, finalY);
    finalY += 8;
  }
  
  // Pied de page
  finalDoc.line(5, finalY, 75, finalY);
  finalY += 5;
  
  finalDoc.setFontSize(9);
  finalDoc.setFont('helvetica', 'normal');
  finalDoc.text(`Vendeur: ${receipt.createdBy}`, 5, finalY);
  finalY += 8;
  
  finalDoc.setFont('helvetica', 'bold');
  finalDoc.text('MERCI DE VOTRE VISITE !', 40, finalY, { align: 'center' });
  finalY += 8;
  
  finalDoc.setFont('helvetica', 'normal');
  finalDoc.text('Signature client:', 5, finalY);
  finalY += 8;
  
  // Ligne pour signature
  finalDoc.line(5, finalY, 50, finalY);
  
  // Télécharger le PDF
  const fileName = receipt.type === 'sale' 
    ? `recu-vente-${receipt.id.substring(0, 8)}.pdf`
    : receipt.type === 'rental'
    ? `recu-location-${receipt.id.substring(0, 8)}.pdf`
    : `recu-paiement-${receipt.id.substring(0, 8)}.pdf`;
  
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