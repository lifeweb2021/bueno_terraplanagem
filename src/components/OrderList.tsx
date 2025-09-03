import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { storage } from '../utils/storage';
import { 
  ShoppingCart, 
  Search, 
  Download, 
  CheckCircle,
  Clock,
  Play,
  X,
  Eye,
  Package,
  Wrench,
  Grid,
  List
} from 'lucide-react';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import { sendCompletionEmail } from '../utils/emailService';
import { formatCurrency } from '../utils/validators';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;
    
    console.log('Filtering orders:', orders);
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    console.log('Filtered orders:', filtered);
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  // Aplicar ordenação aos pedidos filtrados
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // Se um está concluído e outro não, o não concluído vem primeiro
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    
    // Se ambos estão concluídos, ordenar pela data de conclusão (mais recente primeiro)
    if (a.status === 'completed' && b.status === 'completed') {
      const aCompletedAt = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bCompletedAt = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bCompletedAt - aCompletedAt;
    }
    
    // Se ambos não estão concluídos, ordenar por data de criação (mais recente primeiro)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const loadOrders = () => {
    const loadedOrders = storage.getOrders();
    const quotes = storage.getQuotes();
    
    console.log('=== DEBUG PEDIDOS ===');
    console.log('1. Pedidos salvos:', loadedOrders);
    console.log('2. Todos os orçamentos:', quotes);
    console.log('3. Orçamentos aprovados:', quotes.filter(quote => quote.status === 'approved'));
    
    // Converter orçamentos aprovados em pedidos temporários
    const approvedQuotes = quotes.filter(quote => quote.status === 'approved');
    console.log('4. Processando orçamentos aprovados:', approvedQuotes.length);
    
    const ordersFromQuotes: Order[] = [];
    
    approvedQuotes.forEach(quote => {
      // Verificar se já existe um pedido real para este orçamento
      const existingOrder = loadedOrders.find(order => order.quoteId === quote.id);
      console.log(`5. Orçamento ${quote.number} - Pedido existente:`, existingOrder);
      
      if (!existingOrder) {
        const counters = storage.getCounters();
        const orderNumber = `PED${String(counters.order).padStart(4, '0')}`;
        
        const tempOrder: Order = {
          id: `temp-${quote.id}`,
          quoteId: quote.id,
          clientId: quote.clientId,
          client: quote.client,
          number: orderNumber,
          services: quote.services,
          products: quote.products,
          total: quote.total,
          status: 'pending',
          createdAt: quote.createdAt,
          isFromQuote: true
        };
        
        console.log(`6. Criando pedido temporário:`, tempOrder);
        ordersFromQuotes.push(tempOrder);
      }
    });
    
    console.log('7. Pedidos temporários criados:', ordersFromQuotes);
    
    const allOrders = [...loadedOrders, ...ordersFromQuotes];
    console.log('8. Todos os pedidos combinados:', allOrders);
    console.log('=== FIM DEBUG ===');
    
    setOrders(allOrders);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    let order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Se é um pedido temporário de orçamento aprovado, criar pedido real
    if (order.id.startsWith('temp-')) {
      const counters = storage.getCounters();
      const orderNumber = `PED${String(counters.order).padStart(4, '0')}`;
      
      const realOrder: Order = {
        id: crypto.randomUUID(),
        quoteId: order.quoteId,
        clientId: order.clientId,
        client: order.client,
        number: orderNumber,
        services: order.services,
        products: order.products,
        total: order.total,
        status,
        createdAt: new Date(),
        completedAt: status === 'completed' ? new Date() : undefined
      };
      
      storage.addOrder(realOrder);
      storage.incrementCounter('order');
      loadOrders();
      
      let message = '';
      switch (status) {
        case 'in_progress':
          message = 'Pedido iniciado com sucesso!';
          break;
        case 'completed':
          message = 'Pedido concluído com sucesso!';
          break;
        case 'cancelled':
          message = 'Pedido cancelado com sucesso!';
          break;
        default:
          message = 'Pedido criado e atualizado com sucesso!';
      }
      
      setSuccessMessage(message);
      setShowSuccessModal(true);
      return;
    }

    const updatedOrder = {
      ...order,
      status,
      completedAt: status === 'completed' ? new Date() : order.completedAt
    };

    storage.updateOrder(orderId, updatedOrder);
    loadOrders();
    
    let message = '';
    switch (status) {
      case 'in_progress':
        message = 'Pedido iniciado com sucesso!';
        break;
      case 'completed':
        message = 'Pedido concluído com sucesso!';
        break;
      case 'cancelled':
        message = 'Pedido cancelado com sucesso!';
        break;
      default:
        message = 'Status do pedido atualizado com sucesso!';
    }
    
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const handleCompleteOrder = (order: Order) => {
    // Se é um pedido temporário, criar pedido real primeiro
    if (order.id.startsWith('temp-')) {
      updateOrderStatus(order.id, 'completed');
      return;
    }
    
    setOrderToComplete(order);
    setShowCompleteModal(true);
  };

  const confirmCompletion = () => {
    if (!orderToComplete) return;

    // Atualizar status do pedido
    updateOrderStatus(orderToComplete.id, 'completed');
    
    // Enviar email de conclusão
    sendCompletionEmail(orderToComplete);
    
    setShowCompleteModal(false);
    setOrderToComplete(null);
  };

  const handleViewItems = (order: Order) => {
    setSelectedOrder(order);
    setShowItemsModal(true);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'in_progress': return <Play size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <X size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const renderCardsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {sortedOrders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ShoppingCart className="text-green-600 mr-3" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{order.number}</h3>
                <p className="text-sm text-gray-600">{order.client.name}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-1">{getStatusLabel(order.status)}</span>
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Data do pedido:</span>
              <span className="font-medium">{format(order.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            {order.completedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Concluído em:</span>
                <span className="font-medium">{format(order.completedAt, 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Serviços:</span>
              <span className="font-medium">{order.services.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Produtos:</span>
              <span className="font-medium">{order.products.length}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span className="text-gray-900">Total:</span>
              <span className="text-green-600">{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleViewItems(order)}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm"
            >
              <Eye size={16} className="mr-1" />
              Ver Itens
            </button>

            {order.status === 'completed' && (
              <button
                onClick={() => generateReceiptPDF(order)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <Download size={16} className="mr-1" />
                Recibo
              </button>
            )}

            {order.status === 'pending' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'in_progress')}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <Play size={16} className="mr-1" />
                Iniciar
              </button>
            )}

            {order.status === 'in_progress' && (
              <button
                onClick={() => handleCompleteOrder(order)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <CheckCircle size={16} className="mr-1" />
                Concluir
              </button>
            )}

            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <button
                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
              >
                <X size={16} className="mr-1" />
                Cancelar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pedido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <ShoppingCart className="text-green-600 mr-2" size={16} />
                    <span className="text-sm font-medium text-gray-900">{order.number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{order.client.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(order.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                    {order.completedAt && (
                      <div className="text-xs text-gray-500">
                        Concluído: {format(order.completedAt, 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(order.total)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{getStatusLabel(order.status)}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewItems(order)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Ver Itens"
                    >
                      <Eye size={16} />
                    </button>
                    {order.status === 'completed' && (
                      <button
                        onClick={() => generateReceiptPDF(order)}
                        className="text-green-600 hover:text-green-900"
                        title="Baixar Recibo"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'in_progress')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Iniciar"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    {order.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteOrder(order)}
                        className="text-green-600 hover:text-green-900"
                        title="Concluir"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="text-red-600 hover:text-red-900"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'cards' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title="Visualização em Cards"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Total de pedidos: {orders.length}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="in_progress">Em Andamento</option>
          <option value="completed">Concluído</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {viewMode === 'cards' ? renderCardsView() : renderListView()}

      {sortedOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
          <div className="text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' ? 'Nenhum pedido encontrado' : 'Nenhum pedido criado ainda'}
          </div>
          {!searchTerm && statusFilter === 'all' && (
            <p className="text-gray-500">Os pedidos são criados automaticamente quando um orçamento é aprovado.</p>
          )}
        </div>
      )}

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sucesso!
              </h3>
              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Conclusão */}
      {showCompleteModal && orderToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmar Conclusão
              </h3>
              <p className="text-gray-600 mb-2">
                Tem certeza que deseja concluir o pedido:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-blue-900 mb-1">
                  {orderToComplete.number}
                </p>
                <p className="text-sm text-blue-800 mb-1">
                  Cliente: {orderToComplete.client.name}
                </p>
                <p className="text-sm text-blue-800">
                  Valor: {formatCurrency(orderToComplete.total)}
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Esta ação marcará o pedido como concluído e permitirá gerar o recibo de pagamento.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setOrderToComplete(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmCompletion}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Itens */}
      {showItemsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ShoppingCart className="text-green-600 mr-3" size={32} />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Itens do Pedido {selectedOrder.number}
                  </h2>
                  <p className="text-gray-600">Cliente: {selectedOrder.client.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowItemsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações do Pedido */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-900">Data do Pedido:</span>
                    <div className="text-blue-800">{format(selectedOrder.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Status:</span>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1">{getStatusLabel(selectedOrder.status)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Valor Total:</span>
                    <div className="text-lg font-bold text-green-600">{formatCurrency(selectedOrder.total)}</div>
                  </div>
                </div>
              </div>

              {/* Serviços */}
              {selectedOrder.services.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <Wrench className="text-blue-600 mr-2" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Serviços ({selectedOrder.services.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.services.map((service) => (
                      <div key={service.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <div className="font-medium text-gray-900 mb-1">
                              {service.description}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Horas:</span> {service.hours}h
                            <br />
                            <span className="font-medium">Valor/Hora:</span> {formatCurrency(service.hourlyRate)}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(service.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Produtos */}
              {selectedOrder.products.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <Package className="text-orange-600 mr-2" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Produtos ({selectedOrder.products.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.products.map((product) => (
                      <div key={product.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <div className="font-medium text-gray-900 mb-1">
                              {product.description}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Quantidade:</span> {product.quantity}
                            <br />
                            <span className="font-medium">Valor Unit.:</span> {formatCurrency(product.unitPrice)}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(product.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo Total */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Valor Total do Pedido:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => setShowItemsModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};