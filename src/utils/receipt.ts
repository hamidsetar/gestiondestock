import jsPDF from 'jspdf';
import { Receipt, Product, Client } from '../types';
import { format } from 'date-fns';

export const generateReceiptPDF = (receipt: Receipt, client: Client, products: Product[]): void => {
  const doc = new jsPDF();
  
  // Header avec logo
  try {
    // Ajouter le logo (vous devrez ajuster la taille et position selon votre logo)
    doc.addImage('/hali.jpg', 'JPEG', 85, 10, 40, 40);
  } catch (error) {
    console.log('Logo non trouvé, utilisation du texte');
  }
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HALI', 105, 60, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Boutique de Mode et Location', 105, 70, { align: 'center' });
  doc.text('123 Rue de la Mode, Casablanca', 105, 78, { align: 'center' });
  doc.text('Tél: +212 522 123 456', 105, 86, { align: 'center' });
  
  // Receipt info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`REÇU ${receipt.type.toUpperCase()}`, 105, 105, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${receipt.id.substring(0, 8)}`, 20, 120);
  doc.text(`Date: ${format(new Date(receipt.createdAt), 'dd/MM/yyyy HH:mm')}`, 20, 128);
  doc.text(`Vendeur: ${receipt.createdBy}`, 20, 136);
  
  // Client info
  doc.text(`Client: ${client.firstName} ${client.lastName}`, 20, 150);
  doc.text(`Téléphone: ${client.phone}`, 20, 158);
  if (client.email) {
    doc.text(`Email: ${client.email}`, 20, 166);
  }
  
  // Items table
  let yPosition = 180;
  doc.setFont('helvetica', 'bold');
  doc.text('Article', 20, yPosition);
  doc.text('Qté', 100, yPosition);
  doc.text('P.U.', 130, yPosition);
  doc.text('Total', 160, yPosition);
  
  doc.line(20, yPosition + 3, 190, yPosition + 3);
  
  yPosition += 15;
  doc.setFont('helvetica', 'normal');
  
  receipt.items.forEach(item => {
    doc.text(item.name.substring(0, 30), 20, yPosition);
    doc.text(item.quantity.toString(), 100, yPosition);
    doc.text(`${item.unitPrice.toFixed(2)} DH`, 130, yPosition);
    doc.text(`${item.total.toFixed(2)} DH`, 160, yPosition);
    yPosition += 10;
  });
  
  // Totals
  doc.line(20, yPosition + 3, 190, yPosition + 3);
  yPosition += 15;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${receipt.total.toFixed(2)} DH`, 130, yPosition);
  doc.text(`Payé: ${receipt.paid.toFixed(2)} DH`, 130, yPosition + 10);
  if (receipt.remaining > 0) {
    doc.setTextColor(255, 0, 0); // Rouge pour le reste à payer
    doc.text(`Reste: ${receipt.remaining.toFixed(2)} DH`, 130, yPosition + 20);
    doc.setTextColor(0, 0, 0); // Retour au noir
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Merci pour votre confiance!', 105, 260, { align: 'center' });
  doc.text('Échange possible sous 7 jours avec le reçu', 105, 270, { align: 'center' });
  doc.text('Suivez-nous sur nos réseaux sociaux', 105, 280, { align: 'center' });
  
  // Save PDF
  doc.save(`recu-hali-${receipt.id.substring(0, 8)}.pdf`);
};

export const generateClientListPDF = (clients: Client[]): void => {
  const doc = new jsPDF();
  
  // Header avec logo
  try {
    doc.addImage('/hali.jpg', 'JPEG', 85, 10, 40, 40);
  } catch (error) {
    console.log('Logo non trouvé, utilisation du texte');
  }
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTE DES CLIENTS - HALI', 105, 60, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 80);
  doc.text(`Total clients: ${clients.length}`, 20, 88);
  
  let yPosition = 105;
  doc.setFont('helvetica', 'bold');
  doc.text('Nom', 20, yPosition);
  doc.text('Prénom', 70, yPosition);
  doc.text('Téléphone', 120, yPosition);
  doc.text('Email', 170, yPosition);
  
  doc.line(20, yPosition + 3, 190, yPosition + 3);
  
  yPosition += 15;
  doc.setFont('helvetica', 'normal');
  
  clients.forEach(client => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.text(client.lastName, 20, yPosition);
    doc.text(client.firstName, 70, yPosition);
    doc.text(client.phone, 120, yPosition);
    doc.text(client.email || '', 170, yPosition);
    yPosition += 10;
  });
  
  doc.save('liste-clients-hali.pdf');
};