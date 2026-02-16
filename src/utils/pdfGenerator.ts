import jsPDF from 'jspdf';
import { Quote, Order, Client } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const addHeader = (doc: jsPDF, title: string) => {
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sua Empresa LTDA', 20, 45);
  doc.text('Rua das Flores, 123 - Centro', 20, 55);
  doc.text('CEP: 12345-678 - Cidade/UF', 20, 65);
  doc.text('Tel: (11) 9999-9999', 20, 75);
  doc.text('email@empresa.com', 20, 85);
  
  doc.line(20, 95, 190, 95);
};

const addClientInfo = (doc: jsPDF, client: Client, yPosition: number) => {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Cliente:', 20, yPosition);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const clientInfo = [
    `Nome: ${client.name}`,
    `${client.type === 'fisica' ? 'CPF' : 'CNPJ'}: ${client.document}`,
    `Email: ${client.email}`,
    `Telefone: ${client.phone}`,
    `Endereço: ${client.address}`,
    `${client.city}/${client.state} - CEP: ${client.zipCode}`
  ];
  
  clientInfo.forEach((info, index) => {
    doc.text(info, 20, yPosition + 15 + (index * 10));
  });
  
  return yPosition + 80;
};

const addItemsTable = (doc: jsPDF, services: any[], products: any[], yPosition: number) => {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Serviços:', 20, yPosition);
  
  let currentY = yPosition + 15;
  
  if (services.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição', 20, currentY);
    doc.text('Horas', 100, currentY);
    doc.text('Valor/Hora', 130, currentY);
    doc.text('Total', 170, currentY);
    
    doc.line(20, currentY + 3, 190, currentY + 3);
    currentY += 10;
    
    doc.setFont('helvetica', 'normal');
    services.forEach((service) => {
      doc.text(service.description, 20, currentY, { maxWidth: 75 });
      doc.text(service.hours.toString(), 100, currentY);
      doc.text(`R$ ${service.hourlyRate.toFixed(2)}`, 130, currentY);
      doc.text(`R$ ${service.total.toFixed(2)}`, 170, currentY);
      currentY += 10;
    });
  }
  
  currentY += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Produtos:', 20, currentY);
  currentY += 15;
  
  if (products.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição', 20, currentY);
    doc.text('Qtd', 100, currentY);
    doc.text('Valor Unit.', 130, currentY);
    doc.text('Total', 170, currentY);
    
    doc.line(20, currentY + 3, 190, currentY + 3);
    currentY += 10;
    
    doc.setFont('helvetica', 'normal');
    products.forEach((product) => {
      doc.text(product.description, 20, currentY, { maxWidth: 75 });
      doc.text(product.quantity.toString(), 100, currentY);
      doc.text(`R$ ${product.unitPrice.toFixed(2)}`, 130, currentY);
      doc.text(`R$ ${product.total.toFixed(2)}`, 170, currentY);
      currentY += 10;
    });
  }
  
  return currentY + 15;
};

export const generateQuotePDF = (quote: Quote) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'ORÇAMENTO');
  
  doc.setFontSize(12);
  doc.text(`Orçamento Nº: ${quote.number}`, 20, 110);
  doc.text(`Data: ${format(quote.createdAt, 'dd/MM/yyyy', { locale: ptBR })}`, 20, 120);
  doc.text(`Válido até: ${format(quote.validUntil, 'dd/MM/yyyy', { locale: ptBR })}`, 20, 130);
  
  const clientY = addClientInfo(doc, quote.client, 145);
  const itemsEndY = addItemsTable(doc, quote.services, quote.products, clientY);
  
  // Totais
  doc.line(20, itemsEndY, 190, itemsEndY);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  if (quote.discount > 0) {
    doc.text(`Subtotal: R$ ${quote.subtotal.toFixed(2)}`, 130, itemsEndY + 15);
    doc.text(`Desconto: R$ ${quote.discount.toFixed(2)}`, 130, itemsEndY + 25);
    doc.text(`TOTAL: R$ ${quote.total.toFixed(2)}`, 130, itemsEndY + 35);
  } else {
    doc.text(`TOTAL: R$ ${quote.total.toFixed(2)}`, 130, itemsEndY + 15);
  }
  
  if (quote.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Observações:', 20, itemsEndY + 50);
    doc.text(quote.notes, 20, itemsEndY + 60, { maxWidth: 170 });
  }
  
  doc.save(`orcamento-${quote.number}.pdf`);
};

export const generateReceiptPDF = (order: Order) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'RECIBO DE PAGAMENTO');
  
  doc.setFontSize(12);
  doc.text(`Pedido Nº: ${order.number}`, 20, 110);
  doc.text(`Data: ${format(order.createdAt, 'dd/MM/yyyy', { locale: ptBR })}`, 20, 120);
  
  if (order.completedAt) {
    doc.text(`Concluído em: ${format(order.completedAt, 'dd/MM/yyyy', { locale: ptBR })}`, 20, 130);
  }
  
  const clientY = addClientInfo(doc, order.client, 145);
  const itemsEndY = addItemsTable(doc, order.services, order.products, clientY);
  
  // Total
  doc.line(20, itemsEndY, 190, itemsEndY);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`VALOR TOTAL: R$ ${order.total.toFixed(2)}`, 130, itemsEndY + 20);
  
  // Assinatura
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('_________________________________', 20, itemsEndY + 60);
  doc.text('Assinatura do Cliente', 20, itemsEndY + 70);
  
  doc.text('_________________________________', 120, itemsEndY + 60);
  doc.text('Assinatura da Empresa', 120, itemsEndY + 70);
  
  doc.save(`recibo-${order.number}.pdf`);
};