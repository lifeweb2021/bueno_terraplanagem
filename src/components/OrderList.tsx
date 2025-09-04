import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Mail, 
  CheckCircle,
  Clock,
  XCircle,
  List,
  Grid,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import { sendCompletionEmail } from '../utils/emailService';
import { formatCurrency } from '../utils/validators';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { dataManager } from '../utils/dataManager';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);

  useEffect(() => {
    loadOrdersReactive();
  }, []);

  const loadOrdersReactive = async () => {
    try {
      await dataManager.loadData('orders');
      setOrders(dataManager.getData('orders') || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  // Subscrever para mudanças nos pedidos
  useEffect(() => {
    const unsubscribe = dataManager.subscribe('orders', () => {
      setOrders(dataManager.getData('orders') || []);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = orders;
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedOrder = {
        ...order,
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : order.completedAt
      };

      await supabaseStorage.updateOrder(orderId, updatedOrder);
      dataManager.updateLocalData('orders', 'update', updatedOrder, orderId);
      
      // Forçar atualização dos dados locais
      await dataManager.invalidateAndReload('orders');
      
      if (newStatus === 'completed') {
        setSuccessMessage('Pedido concluído com sucesso!');
        setShowSuccessModal(true);
        
        // Enviar email de conclusão
        try {
          await sendCompletionEmail(updatedOrder);
        } catch (emailError) {
          console.error('Erro ao enviar email de conclusão:', emailError);
        }
      } else {
        setSuccessMessage(`Status do pedido atualizado para ${getStatusLabel(newStatus)}!`);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      alert('Erro ao atualizar status do pedido. Tente novamente.');
    }
  };

  const handleCompleteOrder = (order: Order) => {
    setOrderToComplete(order);
    setShowCompleteModal(true);
  };

  const confirmComplete = () => {
    if (orderToComplete) {
      handleUpdateOrderStatus(orderToComplete.id, 'completed');
      setShowCompleteModal(false);
      setOrderToComplete(null);
    }
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
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const renderCardsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {filteredOrders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ShoppingCart className="text-orange-600 mr-3" size={24} />
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
              <span className="text-gray-600">Data:</span>
              <span className="font-medium">{format(order.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            {order.completedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Concluído:</span>
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
              <span className="text-orange-600">{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {order.status === 'pending' && (
              <button
                onClick={() => handleUpdateOrderStatus(order.id, 'in_progress')}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <Play size={16} className="mr-1" />
                Iniciar
              </button>
            )}

            {order.status === 'in_progress' && (
              <>
                <button
                  onClick={() => handleCompleteOrder(order)}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <CheckCircle size={16} className="mr-1" />
                  Concluir
                </button>
                <button
                  onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                  className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center text-sm"
                >
                  <Pause size={16} className="mr-1" />
                  Pausar
                </button>
              </>
            )}

            {order.status === 'completed' && (
              <button
                onClick={() => generateReceiptPDF(order)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <Download size={16} className="mr-1" />
                Recibo
              </button>
            )}

            {order.status !== 'cancelled' && order.status !== 'completed' && (
              <button
                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
              >
                <Square size={16} className="mr-1" />
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
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <ShoppingCart className="text-orange-600 mr-2" size={16} />
                    <span className="text-sm font-medium text-gray-900">{order.number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{order.client.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {format(order.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-orange-600">
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
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'in_progress')}
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
                    {order.status === 'completed' && (
                      <button
                        onClick={() => generateReceiptPDF(order)}
                        className="text-green-600 hover:text-green-900"
                        title="Baixar Recibo"
                      >
                        <Download size={16} />
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

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
          <div className="text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' ? 'Nenhum pedido encontrado' : 'Nenhum pedido criado ainda'}
          </div>
          {!searchTerm && statusFilter === 'all' && (
            <p className="text-gray-500 text-sm">
              Os pedidos são criados automaticamente quando orçamentos são aprovados
            </p>
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
                Esta ação irá gerar um recibo e enviar email de conclusão para o cliente.
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
                  onClick={confirmComplete}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;