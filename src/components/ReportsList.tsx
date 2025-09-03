import React, { useState, useEffect } from 'react';
import { Client, Order } from '../types';
import { storage } from '../utils/storage';
import { 
  FileBarChart, 
  Users, 
  ShoppingCart, 
  Download, 
  Calendar,
  MapPin,
  Filter,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import { generateOrdersReportPDF, generateClientsReportPDF, generateClientOrdersReportPDF } from '../utils/reportGenerator';
import { formatCurrency } from '../utils/validators';

export const ReportsList: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'services' | 'clients' | 'client-orders'>('services');
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Filtros para relatório de serviços
  const [servicesFilters, setServicesFilters] = useState({
    clientId: 'all',
    city: 'all',
    state: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  // Filtros para relatório de clientes
  const [clientsFilters, setClientsFilters] = useState({
    city: 'all',
    state: 'all'
  });

  // Filtros para relatório de pedidos por cliente
  const [clientOrdersFilters, setClientOrdersFilters] = useState({
    clientId: 'all',
    city: 'all',
    state: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedClients = storage.getClients();
    const loadedOrders = storage.getOrders();
    const quotes = storage.getQuotes();
    
    // Incluir pedidos de orçamentos aprovados
    const approvedQuotes = quotes.filter(quote => quote.status === 'approved');
    const ordersFromQuotes: Order[] = approvedQuotes
      .filter(quote => !loadedOrders.some(order => order.quoteId === quote.id))
      .map(quote => ({
        id: `temp-${quote.id}`,
        quoteId: quote.id,
        clientId: quote.clientId,
        client: quote.client,
        number: `PED${String(storage.getCounters().order).padStart(4, '0')}`,
        services: quote.services,
        products: quote.products,
        total: quote.total,
        status: 'completed' as const, // Orçamentos aprovados são considerados concluídos para estatísticas
        createdAt: quote.createdAt,
        isFromQuote: true
      }));
    
    const allOrders = [...loadedOrders, ...ordersFromQuotes];
    
    setClients(loadedClients);
    setOrders(allOrders);
  };

  // Obter cidades únicas
  const getUniqueCities = () => {
    const cities = clients
      .map(client => client.city)
      .filter(city => city && city.trim() !== '')
      .filter((city, index, array) => array.indexOf(city) === index)
      .sort();
    return cities;
  };

  // Obter estados únicos
  const getUniqueStates = () => {
    const states = clients
      .map(client => client.state)
      .filter(state => state && state.trim() !== '')
      .filter((state, index, array) => array.indexOf(state) === index)
      .sort();
    return states;
  };

  const generateServicesReport = () => {
    let filteredOrders = [...orders];

    // Aplicar filtros
    if (servicesFilters.clientId !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.clientId === servicesFilters.clientId);
    }

    if (servicesFilters.city !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.client.city === servicesFilters.city);
    }

    if (servicesFilters.state !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.client.state === servicesFilters.state);
    }

    if (servicesFilters.status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === servicesFilters.status);
    }

    if (servicesFilters.startDate) {
      const startDate = new Date(servicesFilters.startDate);
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = order.completedAt || order.createdAt;
        return orderDate >= startDate;
      });
    }

    if (servicesFilters.endDate) {
      const endDate = new Date(servicesFilters.endDate);
      endDate.setHours(23, 59, 59, 999); // Incluir todo o dia final
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = order.completedAt || order.createdAt;
        return orderDate <= endDate;
      });
    }

    if (filteredOrders.length === 0) {
      setErrorMessage('Nenhum serviço encontrado com os filtros aplicados');
      setShowErrorModal(true);
      return;
    }

    generateOrdersReportPDF(filteredOrders, servicesFilters);
  };

  const generateClientsReport = () => {
    let filteredClients = [...clients];

    // Aplicar filtros
    if (clientsFilters.city !== 'all') {
      filteredClients = filteredClients.filter(client => client.city === clientsFilters.city);
    }

    if (clientsFilters.state !== 'all') {
      filteredClients = filteredClients.filter(client => client.state === clientsFilters.state);
    }

    if (filteredClients.length === 0) {
      setErrorMessage('Nenhum cliente encontrado com os filtros aplicados');
      setShowErrorModal(true);
      return;
    }

    generateClientsReportPDF(filteredClients, clientsFilters);
  };

  const generateClientOrdersReport = () => {
    let filteredOrders = orders.filter(order => order.status === 'completed');

    // Aplicar filtros
    if (clientOrdersFilters.clientId !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.clientId === clientOrdersFilters.clientId);
    }

    if (clientOrdersFilters.city !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.client.city === clientOrdersFilters.city);
    }

    if (clientOrdersFilters.state !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.client.state === clientOrdersFilters.state);
    }

    if (filteredOrders.length === 0) {
      setErrorMessage('Nenhum pedido encontrado com os filtros aplicados');
      setShowErrorModal(true);
      return;
    }

    generateClientOrdersReportPDF(filteredOrders, clientOrdersFilters);
  };

  const renderServicesReport = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <ShoppingCart className="text-blue-600 mr-3" size={24} />
        <h3 className="text-xl font-semibold text-gray-900">Relatório de Pedidos</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
          <select
            value={servicesFilters.clientId}
            onChange={(e) => setServicesFilters({ ...servicesFilters, clientId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
          <select
            value={servicesFilters.city}
            onChange={(e) => setServicesFilters({ ...servicesFilters, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as cidades</option>
            {getUniqueCities().map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={servicesFilters.state}
            onChange={(e) => setServicesFilters({ ...servicesFilters, state: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os estados</option>
            {getUniqueStates().map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={servicesFilters.status}
            onChange={(e) => setServicesFilters({ ...servicesFilters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
          <input
            type="date"
            value={servicesFilters.startDate}
            onChange={(e) => setServicesFilters({ ...servicesFilters, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
          <input
            type="date"
            value={servicesFilters.endDate}
            onChange={(e) => setServicesFilters({ ...servicesFilters, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={generateServicesReport}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <Download size={20} className="mr-2" />
        Gerar Relatório de Pedidos
      </button>
    </div>
  );

  const renderClientsReport = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Users className="text-green-600 mr-3" size={24} />
        <h3 className="text-xl font-semibold text-gray-900">Relatório de Clientes</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
          <select
            value={clientsFilters.city}
            onChange={(e) => setClientsFilters({ ...clientsFilters, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as cidades</option>
            {getUniqueCities().map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={clientsFilters.state}
            onChange={(e) => setClientsFilters({ ...clientsFilters, state: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os estados</option>
            {getUniqueStates().map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={generateClientsReport}
        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
      >
        <Download size={20} className="mr-2" />
        Gerar Relatório de Clientes
      </button>
    </div>
  );

  const renderClientOrdersReport = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <FileText className="text-purple-600 mr-3" size={24} />
        <h3 className="text-xl font-semibold text-gray-900">Relatório de Pedidos por Cliente</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
          <select
            value={clientOrdersFilters.clientId}
            onChange={(e) => setClientOrdersFilters({ ...clientOrdersFilters, clientId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
          <select
            value={clientOrdersFilters.city}
            onChange={(e) => setClientOrdersFilters({ ...clientOrdersFilters, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as cidades</option>
            {getUniqueCities().map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={clientOrdersFilters.state}
            onChange={(e) => setClientOrdersFilters({ ...clientOrdersFilters, state: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os estados</option>
            {getUniqueStates().map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={generateClientOrdersReport}
        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
      >
        <Download size={20} className="mr-2" />
        Gerar Relatório de Pedidos por Cliente
      </button>
    </div>
  );

  const reports = [
    { 
      id: 'orders',
      label: 'Relatório de Pedidos',
      icon: ShoppingCart,
      description: 'Relatório detalhado de todos os pedidos com filtros por cliente, localização, status e período'
    },
    { 
      id: 'client-orders',
      label: 'Pedidos por Cliente',
      icon: FileText,
      description: 'Relatório de todos os pedidos agrupados por cliente'
    },
    { 
      id: 'clients',
      label: 'Relatório de Clientes',
      icon: Users,
      description: 'Lista completa de clientes cadastrados com filtros por localização'
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
        <div className="flex items-center text-sm text-gray-600">
          <FileBarChart size={20} className="mr-2" />
          Sistema de Relatórios
        </div>
      </div>

      {/* Seletor de Relatórios */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                    activeReport === report.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} className="mr-2" />
                  {report.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600">
              {reports.find(r => r.id === activeReport)?.description}
            </p>
          </div>

          {activeReport === 'services' && renderServicesReport()}
          {activeReport === 'orders' && renderServicesReport()}
          {activeReport === 'client-orders' && renderClientOrdersReport()}
          {activeReport === 'clients' && renderClientsReport()}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total de Clientes</h3>
              <p className="text-3xl font-bold text-blue-600">{clients.length}</p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pedidos Concluídos</h3>
              <p className="text-3xl font-bold text-green-600">
                {orders.filter(order => order.status === 'completed').length}
              </p>
            </div>
            <ShoppingCart className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Faturamento Total</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  orders
                    .filter(order => order.status === 'completed')
                    .reduce((sum, order) => sum + order.total, 0)
                )}
              </p>
            </div>
            <FileBarChart className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Informações sobre Relatórios */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Filter className="text-blue-600 mr-3 mt-1" size={20} />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Como usar os relatórios:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Relatório de Pedidos:</strong> Mostra todos os pedidos com valores, datas e status</li>
              <li>• <strong>Relatório de Clientes:</strong> Lista completa dos clientes cadastrados</li>
              <li>• <strong>Pedidos por Cliente:</strong> Histórico de pedidos agrupados por cliente</li>
              <li>• Use os filtros para personalizar os dados que aparecem no relatório</li>
              <li>• Todos os relatórios são gerados em PDF para impressão ou envio</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de Erro */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum Resultado Encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dicas:</strong><br/>
                  • Verifique se os filtros estão corretos<br/>
                  • Tente expandir o período de datas<br/>
                  • Remova alguns filtros para ampliar a busca<br/>
                  • Certifique-se de que há dados cadastrados
                </p>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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