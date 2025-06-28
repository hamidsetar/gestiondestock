import jsPDF from 'jspdf';
import { Receipt, Product, Client } from '../types';
import { format } from 'date-fns';

export const generateReceiptPDF = (receipt: Receipt, client: Client, products: Product[]): void => {
  const doc = new jsPDF();
  
  // Header avec logo Hali
  try {
    // Ajouter le logo Hali (vous devrez ajuster la taille et position selon votre logo)
    doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
  } catch (error) {
    console.log('Logo Hali non trouvé, utilisation du texte');
    // Fallback si le logo n'est pas trouvé
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('HALI', 105, 35, { align: 'center' });
  }
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HALI', 105, 60, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Boutique de Mode et Location', 105, 70, { align: 'center' });
  doc.text('123 Rue de la Mode, Casablanca', 105, 78, { align: 'center' });
  doc.text('Tél: +212 522 123 456', 105, 86, { align: 'center' });
  doc.text('Email: contact@hali.ma', 105, 94, { align: 'center' });
  
  // Receipt info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`REÇU ${receipt.type.toUpperCase()}`, 105, 115, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${receipt.id.substring(0, 8)}`, 20, 130);
  doc.text(`Date: ${format(new Date(receipt.createdAt), 'dd/MM/yyyy HH:mm')}`, 20, 138);
  doc.text(`Vendeur: ${receipt.createdBy}`, 20, 146);
  
  // Client info
  doc.text(`Client: ${client.firstName} ${client.lastName}`, 20, 160);
  doc.text(`Téléphone: ${client.phone}`, 20, 168);
  if (client.email) {
    doc.text(`Email: ${client.email}`, 20, 176);
  }
  
  // Items table
  let yPosition = 190;
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
  doc.text('Suivez-nous sur nos réseaux sociaux @hali_boutique', 105, 280, { align: 'center' });
  
  // Save PDF
  doc.save(`recu-hali-${receipt.id.substring(0, 8)}.pdf`);
};

export const generateClientListPDF = (clients: Client[]): void => {
  const doc = new jsPDF();
  
  // Header avec logo Hali
  try {
    doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
  } catch (error) {
    console.log('Logo Hali non trouvé, utilisation du texte');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('HALI', 105, 35, { align: 'center' });
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
      // Ajouter le logo sur chaque nouvelle page
      try {
        doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
      } catch (error) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('HALI', 105, 25, { align: 'center' });
      }
      yPosition = 60;
    }
    
    doc.text(client.lastName, 20, yPosition);
    doc.text(client.firstName, 70, yPosition);
    doc.text(client.phone, 120, yPosition);
    doc.text(client.email || '', 170, yPosition);
    yPosition += 10;
  });
  
  // Footer sur chaque page
  doc.setFontSize(8);
  doc.text('Hali - Boutique de Mode | contact@hali.ma', 105, 285, { align: 'center' });
  
  doc.save('liste-clients-hali.pdf');
};

export const generateInventoryPDF = (products: Product[]): void => {
  const doc = new jsPDF();
  
  // Header avec logo Hali
  try {
    doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
  } catch (error) {
    console.log('Logo Hali non trouvé, utilisation du texte');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('HALI', 105, 35, { align: 'center' });
  }
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVENTAIRE DES PRODUITS - HALI', 105, 60, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 80);
  doc.text(`Total produits: ${products.length}`, 20, 88);
  
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  doc.text(`Valeur totale du stock: ${totalValue.toFixed(2)} DH`, 20, 96);
  
  let yPosition = 115;
  doc.setFont('helvetica', 'bold');
  doc.text('Produit', 20, yPosition);
  doc.text('Code', 80, yPosition);
  doc.text('Prix', 120, yPosition);
  doc.text('Stock', 150, yPosition);
  doc.text('Valeur', 170, yPosition);
  
  doc.line(20, yPosition + 3, 190, yPosition + 3);
  
  yPosition += 15;
  doc.setFont('helvetica', 'normal');
  
  products.forEach(product => {
    if (yPosition > 270) {
      doc.addPage();
      // Ajouter le logo sur chaque nouvelle page
      try {
        doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
      } catch (error) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('HALI', 105, 25, { align: 'center' });
      }
      yPosition = 60;
    }
    
    doc.text(product.name.substring(0, 20), 20, yPosition);
    doc.text(product.barcode, 80, yPosition);
    doc.text(`${product.price.toFixed(2)}`, 120, yPosition);
    doc.text(product.stock.toString(), 150, yPosition);
    doc.text(`${(product.price * product.stock).toFixed(2)}`, 170, yPosition);
    yPosition += 10;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text('Hali - Boutique de Mode | contact@hali.ma', 105, 285, { align: 'center' });
  
  doc.save('inventaire-hali.pdf');
};

export const generateSalesReportPDF = (sales: any[], clients: Client[], products: Product[]): void => {
  const doc = new jsPDF();
  
  // Header avec logo Hali
  try {
    doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
  } catch (error) {
    console.log('Logo Hali non trouvé, utilisation du texte');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('HALI', 105, 35, { align: 'center' });
  }
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT DES VENTES - HALI', 105, 60, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 80);
  doc.text(`Nombre de ventes: ${sales.length}`, 20, 88);
  
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  doc.text(`Chiffre d'affaires total: ${totalSales.toFixed(2)} DH`, 20, 96);
  doc.text(`Montant encaissé: ${totalPaid.toFixed(2)} DH`, 20, 104);
  
  let yPosition = 125;
  doc.setFont('helvetica', 'bold');
  doc.text('Date', 20, yPosition);
  doc.text('Client', 50, yPosition);
  doc.text('Produit', 100, yPosition);
  doc.text('Total', 150, yPosition);
  doc.text('Statut', 175, yPosition);
  
  doc.line(20, yPosition + 3, 190, yPosition + 3);
  
  yPosition += 15;
  doc.setFont('helvetica', 'normal');
  
  sales.forEach(sale => {
    if (yPosition > 270) {
      doc.addPage();
      // Ajouter le logo sur chaque nouvelle page
      try {
        doc.addImage('/hali copy.jpg', 'JPEG', 85, 10, 40, 40);
      } catch (error) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('HALI', 105, 25, { align: 'center' });
      }
      yPosition = 60;
    }
    
    const client = clients.find(c => c.id === sale.clientId);
    const product = products.find(p => p.id === sale.productId);
    
    doc.text(format(new Date(sale.createdAt), 'dd/MM'), 20, yPosition);
    doc.text(client ? `${client.firstName} ${client.lastName}`.substring(0, 15) : 'N/A', 50, yPosition);
    doc.text(product ? product.name.substring(0, 15) : 'N/A', 100, yPosition);
    doc.text(`${sale.totalAmount.toFixed(2)}`, 150, yPosition);
    doc.text(sale.status === 'paid' ? 'Payé' : sale.status === 'partial' ? 'Partiel' : 'En attente', 175, yPosition);
    yPosition += 10;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text('Hali - Boutique de Mode | contact@hali.ma', 105, 285, { align: 'center' });
  
  doc.save('rapport-ventes-hali.pdf');
};