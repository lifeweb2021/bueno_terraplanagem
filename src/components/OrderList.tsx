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
  X
} from 'lucide-react';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import { formatCurrency } from '../utils/validators';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
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

  const loadOrders = () => {
    const loadedOrders = storage.getOrders();
    setOrders(loadedOrders);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrder = {
      ...order,
      status,
      completedAt: status === 'completed' ? new Date() : order.completedAt
    };

    storage.updateOrder(orderId, updatedOrder);
    loadOrders();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
        <div className="text-sm text-gray-600">
          Total de pedidos: {orders.length}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
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
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <CheckCircle size={16} className="mr-1" />
                  Concluir
                </button>
              )}

              {(order.status === 'pending' || order.status === 'in_progress') && (
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

      {filteredOrders.length === 0 && (
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
    </div>
  );
};