import React, { useState } from 'react';
import { Users, FileText, ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { ClientList } from './components/ClientList';
import { QuoteList } from './components/QuoteList';
import { OrderList } from './components/OrderList';
import { CompanySettings } from './components/CompanySettings';

function App() {
  const [activeTab, setActiveTab] = useState<'clients' | 'quotes' | 'orders' | 'dashboard' | 'settings'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'quotes', label: 'Orçamentos', icon: FileText },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => setActiveTab('clients')}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clientes</h3>
              <p className="text-gray-600">Gerencie seu cadastro de clientes</p>
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
              <p className="text-gray-600">Acompanhe pedidos aprovados</p>
            </div>
            <ShoppingCart className="text-orange-600" size={32} />
          </div>
        </div>
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
      case 'dashboard':
      case 'settings':
        return <CompanySettings />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
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
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;