import React, { useState } from 'react';
import { Users, FileText, ShoppingCart, BarChart3, Settings, FileBarChart, LogOut, UserCog, Menu, X } from 'lucide-react';
import { ClientList } from './components/ClientList';
import { QuoteList } from './components/QuoteList';
import OrderList from './components/OrderList';
import { CompanySettings } from './components/CompanySettings';
import { ReportsList } from './components/ReportsList';
import { LoginForm } from './components/LoginForm';
import { supabaseStorage } from './utils/supabaseStorage';
import { supabaseAuth } from './utils/supabaseAuth';
import { formatCurrency } from './utils/validators';
import { dataManager } from './utils/dataManager';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'clients' | 'quotes' | 'orders' | 'dashboard' | 'settings' | 'reports' | 'users'>('dashboard');
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Usar dados reativos do dataManager
  const [clients, setClients] = useState<any[]>(dataManager.getData('clients') || []);
  const [quotes, setQuotes] = useState<any[]>(dataManager.getData('quotes') || []);
  const [orders, setOrders] = useState<any[]>(dataManager.getData('orders') || []);

  // Verificar sessão existente ao carregar
  React.useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    // Check for existing session
    try {
      const session = await supabaseAuth.getSession();
      if (session?.user) {
        const sessionData = {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          username: session.user.user_metadata?.username || session.user.email.split('@')[0],
          loginTime: new Date(),
          supabaseSession: session
        };
        setCurrentUser(sessionData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth session:', error);
    }

    // Load application data
    await loadAllDataReactive();
  };

  const loadAllDataReactive = async () => {
    try {
      // Carregar todos os dados usando o dataManager
      await Promise.all([
        dataManager.loadData('companySettings'),
        dataManager.loadData('clients'),
        dataManager.loadData('quotes'),
        dataManager.loadData('orders')
      ]);

      // Atualizar estados locais
      setCompanySettings(dataManager.getData('companySettings'));
      setClients(dataManager.getData('clients') || []);
      setQuotes(dataManager.getData('quotes') || []);
      setOrders(dataManager.getData('orders') || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Subscrever para mudanças nos dados
  React.useEffect(() => {
    const unsubscribeClients = dataManager.subscribe('clients', () => {
      setClients(dataManager.getData('clients') || []);
    });

    const unsubscribeQuotes = dataManager.subscribe('quotes', () => {
      setQuotes(dataManager.getData('quotes') || []);
    });

    const unsubscribeOrders = dataManager.subscribe('orders', () => {
      setOrders(dataManager.getData('orders') || []);
    });

    const unsubscribeSettings = dataManager.subscribe('companySettings', () => {
      setCompanySettings(dataManager.getData('companySettings'));
    });

    return () => {
      unsubscribeClients();
      unsubscribeQuotes();
      unsubscribeOrders();
      unsubscribeSettings();
    };
  }, []);

  // Atualizar configurações quando mudar de aba
  React.useEffect(() => {
    if (activeTab === 'settings') {
      dataManager.invalidateAndReload('companySettings');
    }
  }, [activeTab]);

  const handleLogin = (session: any) => {
    setCurrentUser(session);
    setIsAuthenticated(true);
    // Recarregar todos os dados após login
    loadAllDataReactive();
  };

  const handleLogout = () => {
    supabaseAuth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    // Limpar cache ao fazer logout
    dataManager.invalidateAll();
  };

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'quotes', label: 'Orçamentos', icon: FileText },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'reports', label: 'Relatórios', icon: FileBarChart },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ] as const;

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sistema de Gestão Comercial
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Gerencie clientes, crie orçamentos profissionais e controle pedidos de forma eficiente
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Como usar o sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <div className="flex items-center text-blue-600 font-medium">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>
              Cadastre Clientes
            </div>
            <p className="text-gray-600">
              Registre pessoas físicas ou jurídicas com todos os dados necessários para orçamentos.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-green-600 font-medium">
              <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
              Crie Orçamentos
            </div>
            <p className="text-gray-600">
              Monte orçamentos detalhados com serviços e produtos, gere PDFs profissionais.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-orange-600 font-medium">
              <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">3</span>
              Gerencie Pedidos
            </div>
            <p className="text-gray-600">
              Aprove orçamentos para gerar pedidos e emita recibos ao concluir os trabalhos.
            </p>
          </div>
        </div>
      </div>
<p> &nbsp;</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => setActiveTab('clients')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clientes</h3>
              <p className="text-gray-600">Gerencie seu cadastro de clientes</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{clients.length}</p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('quotes')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Orçamentos</h3>
              <p className="text-gray-600">Crie e gerencie orçamentos</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{quotes.length}</p>
            </div>
            <FileText className="text-green-600" size={32} />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('orders')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pedidos</h3>
              <p className="text-gray-600">Pedidos concluídos</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{orders.filter(order => order.status === 'completed').length}</p>
            </div>
            <ShoppingCart className="text-orange-600" size={32} />
          </div>
        </div>
      </div>

      {/* Boxes com Últimos Registros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimos Clientes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Últimos Clientes</h3>
            <Users className="text-blue-600" size={24} />
          </div>
          <div className="space-y-3">
            {clients
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((client) => (
                <div key={client.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    {client.type === 'fisica' ? (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    ) : (
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                        {client.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {client.type === 'fisica' ? 'PF' : 'PJ'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            {clients.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum cliente cadastrado</p>
            )}
          </div>
          {clients.length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setActiveTab('clients')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos os {clients.length} clientes
              </button>
            </div>
          )}
        </div>

        {/* Últimos Orçamentos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Últimos Orçamentos</h3>
            <FileText className="text-green-600" size={24} />
          </div>
          <div className="space-y-3">
            {quotes
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((quote) => (
                <div key={quote.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      quote.status === 'draft' ? 'bg-gray-400' :
                      quote.status === 'sent' ? 'bg-blue-500' :
                      quote.status === 'approved' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {quote.number}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-32">
                        {quote.client.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(quote.total)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            {quotes.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum orçamento criado</p>
            )}
          </div>
          {quotes.length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setActiveTab('quotes')}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Ver todos os {quotes.length} orçamentos
              </button>
            </div>
          )}
        </div>

        {/* Últimos Pedidos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Últimos Pedidos</h3>
            <ShoppingCart className="text-orange-600" size={24} />
          </div>
          <div className="space-y-3">
            {orders
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      order.status === 'pending' ? 'bg-yellow-500' :
                      order.status === 'in_progress' ? 'bg-blue-500' :
                      order.status === 'completed' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.number}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-32">
                        {order.client.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            {orders.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum pedido criado</p>
            )}
          </div>
          {orders.filter(order => order.status === 'completed').length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setActiveTab('orders')}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                Ver todos os {orders.filter(order => order.status === 'completed').length} pedidos concluídos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'clients':
        return <ClientList />;
      case 'quotes':
        return <QuoteList />;
      case 'orders':
        return <OrderList />;
      case 'reports':
        return <ReportsList />;
      case 'settings':
        return <CompanySettings />;
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center">
                {companySettings?.logo ? (
                  <img 
                    src={companySettings.logo} 
                    alt="Logo da empresa" 
                    className="w-24 h-16 sm:w-28 sm:h-20 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-16 sm:w-28 sm:h-20 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-white" size={32} />
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Desktop Logout */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} className="mr-1" />
                Sair
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={20} className="mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
                
                {/* Mobile Logout */}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={20} className="mr-3" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>

      {/* Rodapé */}
      <footer className="bg-gray-200 border-t border-gray-300 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Logo e Copyright */}
            <div className="flex items-center space-x-3">
              {companySettings?.logo ? (
                <img 
                  src={companySettings.logo} 
                  alt="Logo da empresa" 
                  className="w-16 h-12 object-contain rounded"
                />
              ) : (
                <div className="w-16 h-12 bg-blue-600 rounded flex items-center justify-center">
                  <BarChart3 className="text-white" size={32} />
                </div>
              )}
              <div className="text-sm text-gray-600">
                © 2025 Bueno Terraplanagem - Todos os direitos reservados.
              </div>
            </div>
            
            {/* Desenvolvido por */}
            <div className="text-sm text-gray-600">
              Desenvolvido pela <a href="https://lifeweb.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium">Lifeweb</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;