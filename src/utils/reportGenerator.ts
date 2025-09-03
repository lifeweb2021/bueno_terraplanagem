import jsPDF from 'jspdf';
import { Client, Order } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from './validators';
import { storage } from './storage';

const addReportHeader = (doc: jsPDF, title: string) => {
  const companySettings = storage.getCompanySettings();
  
  if (companySettings) {
    // Logo (se existir)
    if (companySettings.logo) {
      try {
        // Calcular proporções da imagem para evitar deformação
        const img = new Image();
        img.src = companySettings.logo;
        const aspectRatio = img.width / img.height;
        const maxWidth = 25;
        const maxHeight = 20;
        
        let width = maxWidth;
        let height = maxWidth / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }
        
        doc.addImage(companySettings.logo, 'JPEG', 15, 15, width, height);
      } catch (error) {
        console.warn('Erro ao adicionar logo:', error);
      }
    }
    
    // Título do relatório
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, companySettings.logo ? 50 : 20, 22);
    
    // Informações da empresa
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.companyName, companySettings.logo ? 50 : 20, 30);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`CNPJ: ${companySettings.cnpj}`, companySettings.logo ? 50 : 20, 36);
    doc.text(`Email: ${companySettings.email}`, companySettings.logo ? 50 : 20, 42);
    
  } else {
    // Fallback se não houver configurações
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 25);
  }
  
  // Data de geração do relatório
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 50);
  
  // Linha separadora
  doc.line(15, 55, 195, 55);
  
  return 65; // Retorna a posição Y onde o conteúdo deve começar
};

export const generateOrdersReportPDF = (orders: Order[], filters: any) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  let currentY = addReportHeader(doc, 'RELATÓRIO DE PEDIDOS');
  
  // Informações dos filtros aplicados
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FILTROS APLICADOS:', 20, currentY);
  currentY += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  if (filters.clientId !== 'all') {
    const client = storage.getClients().find(c => c.id === filters.clientId);
    doc.text(`Cliente: ${client?.name || 'N/A'}`, 20, currentY);
    currentY += 4;
  }
  
  if (filters.city !== 'all') {
    doc.text(`Cidade: ${filters.city}`, 20, currentY);
    currentY += 4;
  }
  
  if (filters.state !== 'all') {
    const states = storage.getStates();
    const selectedState = states.find(s => s.code === filters.state);
    doc.text(`Estado: ${selectedState ? `${selectedState.name} (${selectedState.code})` : filters.state}`, 20, currentY);
    currentY += 4;
  }
  
  if (filters.status !== 'all') {
    const statusLabels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    doc.text(`Status: ${statusLabels[filters.status as keyof typeof statusLabels] || filters.status}`, 20, currentY);
    currentY += 4;
  }

  if (filters.startDate) {
    doc.text(`Período: ${format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR })} até ${filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'hoje'}`, 20, currentY);
    currentY += 4;
  }
  
  currentY += 6;
  
  // Cabeçalho da tabela
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Pedido', 20, currentY);
  doc.text('Cliente', 50, currentY);
  doc.text('Data', 100, currentY);
  doc.text('Status', 130, currentY);
  doc.text('Valor', 165, currentY);
  
  doc.line(20, currentY + 1, 190, currentY + 1);
  currentY += 6;
  
  // Dados dos pedidos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  
  let totalValue = 0;
  
  orders.forEach((order) => {
    // Verificar se há espaço na página
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
    
    const orderDate = order.completedAt || order.createdAt;
    
    // Status em português
    const statusLabels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    
    // Quebrar texto longo
    const clientName = doc.splitTextToSize(order.client.name, 45);
    
    doc.text(order.number, 20, currentY);
    doc.text(clientName, 50, currentY);
    doc.text(format(orderDate, 'dd/MM/yyyy', { locale: ptBR }), 100, currentY);
    doc.text(statusLabels[order.status] || order.status, 130, currentY);
    doc.text(formatCurrency(order.total), 165, currentY);
    
    totalValue += order.total;
    currentY += Math.max(clientName.length * 3, 6);
  });
  
  // Total geral
  currentY += 10;
  doc.line(20, currentY, 190, currentY);
  currentY += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`VALOR TOTAL DOS PEDIDOS: ${formatCurrency(totalValue)}`, 20, currentY);
  
  // Estatísticas
  currentY += 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTATÍSTICAS:', 20, currentY);
  currentY += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Total de pedidos: ${orders.length}`, 20, currentY);
  currentY += 4;
  doc.text(`Total de itens: ${orders.reduce((sum, order) => sum + order.services.length + order.products.length, 0)}`, 20, currentY);
  currentY += 4;
  doc.text(`Valor médio por pedido: ${formatCurrency(totalValue / orders.length)}`, 20, currentY);
  
  // Download
  doc.save(`relatorio-pedidos-${format(new Date(), 'yyyy-MM-dd', { locale: ptBR })}.pdf`);
};

export const generateClientsReportPDF = (clients: Client[], filters: any) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Ordenar clientes alfabeticamente
  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  
  let currentY = addReportHeader(doc, 'RELATÓRIO DE CLIENTES');
  
  // Informações dos filtros aplicados
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FILTROS APLICADOS:', 20, currentY);
  currentY += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  if (filters.city !== 'all') {
    doc.text(`Cidade: ${filters.city}`, 20, currentY);
    currentY += 4;
  }
  
  if (filters.state !== 'all') {
    const states = storage.getStates();
    const selectedState = states.find(s => s.code === filters.state);
    doc.text(`Estado: ${selectedState ? `${selectedState.name} (${selectedState.code})` : filters.state}`, 20, currentY);
    currentY += 4;
  }
  
  currentY += 6;
  
  // Cabeçalho da tabela
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Nome/Razão Social', 20, currentY);
  doc.text('Tipo', 80, currentY);
  doc.text('CPF/CNPJ', 100, currentY);
  doc.text('Telefone', 130, currentY);
  doc.text('Cidade/UF', 160, currentY);
  
  doc.line(20, currentY + 1, 190, currentY + 1);
  currentY += 6;
  
  // Dados dos clientes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  
  sortedClients.forEach((client) => {
    // Verificar se há espaço na página
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
    
    const clientName = doc.splitTextToSize(client.name, 55);
    const location = `${client.city || 'N/A'}/${client.state || 'N/A'}`;
    
    doc.text(clientName, 20, currentY);
    doc.text(client.type === 'fisica' ? 'PF' : 'PJ', 80, currentY);
    doc.text(client.document, 100, currentY);
    doc.text(client.phone, 130, currentY);
    doc.text(location, 160, currentY);
    
    currentY += Math.max(clientName.length * 3, 6);
  });
  
  // Estatísticas
  currentY += 10;
  doc.line(20, currentY, 190, currentY);
  currentY += 6;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTATÍSTICAS:', 20, currentY);
  currentY += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  const pessoasFisicas = clients.filter(c => c.type === 'fisica').length;
  const pessoasJuridicas = clients.filter(c => c.type === 'juridica').length;
  
  doc.text(`Total de clientes: ${clients.length}`, 20, currentY);
  currentY += 4;
  doc.text(`Pessoas Físicas: ${pessoasFisicas}`, 20, currentY);
  currentY += 4;
  doc.text(`Pessoas Jurídicas: ${pessoasJuridicas}`, 20, currentY);
  
  // Download
  doc.save(`relatorio-clientes-${format(new Date(), 'yyyy-MM-dd', { locale: ptBR })}.pdf`);
};

export const generateClientOrdersReportPDF = (orders: Order[], filters: any) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  let currentY = addReportHeader(doc, 'RELATÓRIO DE PEDIDOS POR CLIENTE');
  
  // Informações dos filtros aplicados
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FILTROS APLICADOS:', 20, currentY);
  currentY += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  if (filters.clientId !== 'all') {
    const client = storage.getClients().find(c => c.id === filters.clientId);
    doc.text(`Cliente: ${client?.name || 'N/A'}`, 20, currentY);
    currentY += 4;
  }
  
  if (filters.city !== 'all') {
    doc.text(`Cidade: ${filters.city}`, 20, currentY);
    currentY += 4;
  }
  
  if (filters.state !== 'all') {
    const states = storage.getStates();
    const selectedState = states.find(s => s.code === filters.state);
    doc.text(`Estado: ${selectedState ? `${selectedState.name} (${selectedState.code})` : filters.state}`, 20, currentY);
    currentY += 4;
  }
  
  currentY += 6;
  
  // Agrupar pedidos por cliente
  const ordersByClient = orders.reduce((acc, order) => {
    const clientId = order.clientId;
    if (!acc[clientId]) {
      acc[clientId] = {
        client: order.client,
        orders: []
      };
    }
    acc[clientId].orders.push(order);
    return acc;
  }, {} as Record<string, { client: Client; orders: Order[] }>);
  
  let grandTotal = 0;
  
  // Renderizar cada cliente e seus pedidos
  Object.values(ordersByClient).forEach((clientData) => {
    // Verificar se há espaço na página
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    // Nome do cliente
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`CLIENTE: ${clientData.client.name}`, 20, currentY);
    currentY += 6;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${clientData.client.type === 'fisica' ? 'CPF' : 'CNPJ'}: ${clientData.client.document}`, 20, currentY);
    doc.text(`${clientData.client.city || 'N/A'}/${clientData.client.state || 'N/A'}`, 120, currentY);
    currentY += 8;
    
    // Cabeçalho da tabela de pedidos
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('Pedido', 25, currentY);
    doc.text('Data', 50, currentY);
    doc.text('Serviços', 75, currentY);
    doc.text('Produtos', 120, currentY);
    doc.text('Valor', 165, currentY);
    
    doc.line(25, currentY + 1, 185, currentY + 1);
    currentY += 5;
    
    // Pedidos do cliente
    doc.setFont('helvetica', 'normal');
    let clientTotal = 0;
    
    clientData.orders.forEach((order) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      
      const orderDate = order.completedAt || order.createdAt;
      const servicesCount = order.services.length;
      const productsCount = order.products.length;
      
      doc.text(order.number, 25, currentY);
      doc.text(format(orderDate, 'dd/MM/yyyy', { locale: ptBR }), 50, currentY);
      doc.text(servicesCount.toString(), 75, currentY);
      doc.text(productsCount.toString(), 120, currentY);
      doc.text(formatCurrency(order.total), 165, currentY);
      
      clientTotal += order.total;
      currentY += 4;
    });
    
    // Subtotal do cliente
    currentY += 2;
    doc.line(25, currentY, 185, currentY);
    currentY += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal ${clientData.client.name}: ${formatCurrency(clientTotal)}`, 25, currentY);
    doc.text(`Pedidos: ${clientData.orders.length}`, 120, currentY);
    
    grandTotal += clientTotal;
    currentY += 10;
  });
  
  // Total geral
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  currentY += 5;
  doc.line(20, currentY, 190, currentY);
  currentY += 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`VALOR TOTAL GERAL: ${formatCurrency(grandTotal)}`, 20, currentY);
  
  // Download
  doc.save(`relatorio-servicos-${format(new Date(), 'yyyy-MM-dd', { locale: ptBR })}.pdf`);
};