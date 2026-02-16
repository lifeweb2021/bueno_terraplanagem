import jsPDF from 'jspdf';
import { Quote, Order, Client } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from './validators';
import { supabaseStorage } from './supabaseStorage';

const addHeader = async (doc: jsPDF, title: string) => {
  const companySettings = await supabaseStorage.getCompanySettings();
  
  if (companySettings) {
    // Logo (se existir)
    if (companySettings.logo) {
      try {
        // Determinar formato da imagem
        const imageFormat = companySettings.logo.includes('data:image/png') ? 'PNG' : 
                           companySettings.logo.includes('data:image/gif') ? 'GIF' : 'JPEG';
        
        // Adicionar logo com tamanho fixo
        doc.addImage(companySettings.logo, imageFormat, 15, 15, 25, 20);
      } catch (error) {
        console.warn('Erro ao adicionar logo:', error);
      }
    }
    
    // Título do documento
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text(title, companySettings.logo ? 50 : 20, 22);
    
    // Informações da empresa em duas colunas
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    
    // Coluna esquerda - Dados principais
    const leftColumn = companySettings.logo ? 50 : 20;
    doc.text(companySettings.companyName, leftColumn, 30);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`CNPJ: ${companySettings.cnpj}`, leftColumn, 35);
    doc.text(`Tel: ${companySettings.phone}`, leftColumn, 40);
    if (companySettings.whatsapp) {
      doc.text(`WhatsApp: ${companySettings.whatsapp}`, leftColumn, 45);
    }
    
    // Coluna direita - Endereço e email
    const rightColumn = 120;
    doc.text(companySettings.email, rightColumn, 30);
    
    // Endereço completo formatado
    const addressLines = [];
    if (companySettings.address) {
      addressLines.push(companySettings.address);
    }
    if (companySettings.neighborhood) {
      addressLines.push(companySettings.neighborhood);
    }
    if (companySettings.city && companySettings.state) {
      addressLines.push(`${companySettings.city}/${companySettings.state}`);
    }
    if (companySettings.zipCode) {
      addressLines.push(`CEP: ${companySettings.zipCode}`);
    }
    
    addressLines.forEach((line, index) => {
      doc.text(line, rightColumn, 35 + (index * 5));
    });
    
  } else {
    // Fallback se não houver configurações
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 25);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Configure os dados da empresa', 20, 35);
    doc.text('Acesse Configurações > Dados da Empresa', 20, 42);
  }
  
  // Linha separadora
  doc.line(15, 55, 195, 55);
};

const addClientInfo = (doc: jsPDF, client: Client, yPosition: number) => {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 20, yPosition);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  // Informações do cliente compactas em duas linhas
  const leftColumn = 20;
  const rightColumn = 105;
  
  doc.text(`Nome: ${client.name}`, leftColumn, yPosition + 8);
  doc.text(`${client.type === 'fisica' ? 'CPF' : 'CNPJ'}: ${client.document}`, rightColumn, yPosition + 8);
  
  doc.text(`Telefone: ${client.phone}`, leftColumn, yPosition + 14);
  if (client.city && client.state) {
    doc.text(`${client.city}/${client.state}`, rightColumn, yPosition + 14);
  }
  
  return yPosition + 22;
};

const addItemsTable = (doc: jsPDF, services: any[], products: any[], yPosition: number) => {
  let currentY = yPosition;
  
  // Serviços
  if (services.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVIÇOS', 20, currentY);
    currentY += 8;
    
    // Cabeçalho da tabela
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição', 20, currentY);
    doc.text('Horas', 120, currentY);
    doc.text('Valor/Hora', 140, currentY);
    doc.text('Total', 170, currentY);
    
    doc.line(20, currentY + 1, 190, currentY + 1);
    currentY += 6;
    
    // Itens dos serviços
    doc.setFont('helvetica', 'normal');
    services.forEach((service) => {
      const descriptionLines = doc.splitTextToSize(service.description, 95);
      doc.text(descriptionLines, 20, currentY);
      doc.text(service.hours.toString(), 120, currentY);
      doc.text(formatCurrency(service.hourlyRate), 140, currentY);
      doc.text(formatCurrency(service.total), 170, currentY);
      currentY += Math.max(6, descriptionLines.length * 3);
    });
    
    currentY += 6;
  }
  
  // Produtos
  if (products.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUTOS', 20, currentY);
    currentY += 8;
    
    // Cabeçalho da tabela
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição', 20, currentY);
    doc.text('Qtd', 120, currentY);
    doc.text('Valor Unit.', 140, currentY);
    doc.text('Total', 170, currentY);
    
    doc.line(20, currentY + 1, 190, currentY + 1);
    currentY += 6;
    
    // Itens dos produtos
    doc.setFont('helvetica', 'normal');
    products.forEach((product) => {
      const descriptionLines = doc.splitTextToSize(product.description, 95);
      doc.text(descriptionLines, 20, currentY);
      doc.text(product.quantity.toString(), 120, currentY);
      doc.text(formatCurrency(product.unitPrice), 140, currentY);
      doc.text(formatCurrency(product.total), 170, currentY);
      currentY += Math.max(6, descriptionLines.length * 3);
    });
  }
  
  return currentY + 8;
};

const addFooter = (doc: jsPDF, quote: Quote, yPosition: number) => {
  // Verificar se há espaço suficiente na página atual
  const pageHeight = doc.internal.pageSize.height;
  const footerHeight = 60; // Altura estimada do rodapé
  
  if (yPosition + footerHeight > pageHeight - 20) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Linha separadora
  doc.line(20, yPosition, 190, yPosition);
  
  // Cálculos dos totais
  const servicesTotal = quote.services.reduce((sum, service) => sum + service.total, 0);
  const productsTotal = quote.products.reduce((sum, product) => sum + product.total, 0);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  let footerY = yPosition + 8;
  
  // Resumo dos totais
  if (quote.services.length > 0) {
    doc.text(`Total de Serviços: ${formatCurrency(servicesTotal)}`, 130, footerY);
    footerY += 6;
  }
  
  if (quote.products.length > 0) {
    doc.text(`Total de Produtos: ${formatCurrency(productsTotal)}`, 130, footerY);
    footerY += 6;
  }
  
  if (quote.discount > 0) {
    doc.text(`Subtotal: ${formatCurrency(quote.subtotal)}`, 130, footerY);
    footerY += 6;
    doc.text(`Desconto: ${formatCurrency(quote.discount)}`, 130, footerY);
    footerY += 6;
  }
  
  // Total final destacado
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`VALOR TOTAL: ${formatCurrency(quote.total)}`, 130, footerY);
  
  // Observações com quebra de página automática
  if (quote.notes) {
    footerY += 15;
    
    // Verificar se há espaço para as observações
    const notesHeight = 30; // Altura estimada das observações
    if (footerY + notesHeight > pageHeight - 20) {
      doc.addPage();
      footerY = 20;
    }
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES:', 20, footerY);
    
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(quote.notes, 170);
    doc.text(notesLines, 20, footerY + 6);
  }
};

const addReceiptFooter = async (doc: jsPDF, order: Order, yPosition: number, quote?: Quote) => {
  // Verificar se há espaço suficiente na página atual
  const pageHeight = doc.internal.pageSize.height;
  const footerHeight = 80; // Altura estimada do rodapé com observações e assinatura
  
  if (yPosition + footerHeight > pageHeight - 20) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Linha separadora
  doc.line(20, yPosition, 190, yPosition);
  
  // Total do recibo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`VALOR TOTAL PAGO: ${formatCurrency(order.total)}`, 130, yPosition + 12);
  
  let currentY = yPosition + 25;
  
  // Observações (se existirem no orçamento original)
  if (quote && quote.notes) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES:', 20, currentY);
    
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(quote.notes, 170);
    doc.text(notesLines, 20, currentY + 6);
    
    currentY += 6 + (notesLines.length * 4) + 10;
  }
  
  // Assinatura da empresa
  const signatureY = currentY + 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  doc.text('_________________________________', 20, signatureY);
  doc.text('Assinatura da Empresa', 20, signatureY + 6);
  
}
const addReportHeader = async (doc: jsPDF, title: string) => {
  const companySettings = await supabaseStorage.getCompanySettings();
  if (companySettings && companySettings.cnpj) {
    doc.text(`CNPJ: ${companySettings.cnpj}`, 20, signatureY + 12);
  }
};

export const generateQuotePDF = (quote: Quote) => {
  generateQuotePDFBlob(quote).then(blob => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orcamento-${quote.number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  });
};

// Função para gerar PDF como Blob (exportada para uso no emailService)
export const generateQuotePDFBlob = async (quote: Quote): Promise<Blob> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  await addHeader(doc, 'ORÇAMENTO');
  
  // Informações do orçamento em uma linha
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº: ${quote.number}`, 20, 60);
  doc.text(`Data: ${format(quote.createdAt, 'dd/MM/yyyy', { locale: ptBR })}`, 70, 60);
  doc.text(`Válido até: ${format(quote.validUntil, 'dd/MM/yyyy', { locale: ptBR })}`, 130, 60);
  
  const clientY = addClientInfo(doc, quote.client, 68);
  const itemsEndY = addItemsTable(doc, quote.services, quote.products, clientY);
  
  addFooter(doc, quote, itemsEndY);
  
  return doc.output('blob');
};

export const generateReceiptPDF = (order: Order) => {
  generateReceiptPDFBlob(order).then(blob => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `recibo-${order.number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  });
};

export const generateReceiptPDFBlob = async (order: Order): Promise<Blob> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Buscar o orçamento original para pegar as observações
  const quotes = await supabaseStorage.getQuotes();
  const originalQuote = quotes.find(q => q.id === order.quoteId);
  
  await addHeader(doc, 'RECIBO DE PAGAMENTO');
  
  // Informações do pedido em uma linha
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº: ${order.number}`, 20, 65);
  doc.text(`Data: ${format(order.createdAt, 'dd/MM/yyyy', { locale: ptBR })}`, 70, 65);
  
  if (order.completedAt) {
    doc.text(`Concluído: ${format(order.completedAt, 'dd/MM/yyyy', { locale: ptBR })}`, 130, 65);
  }
  
  const clientY = addClientInfo(doc, order.client, 75);
  const itemsEndY = addItemsTable(doc, order.services, order.products, clientY);
  
  await addReceiptFooter(doc, order, itemsEndY, originalQuote);
  
  return doc.output('blob');
};