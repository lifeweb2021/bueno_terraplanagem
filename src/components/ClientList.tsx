import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import { User as UserIcon, Building2, Mail, Phone, Edit, Trash2, Plus, Search, Grid, List, CheckCircle } from 'lucide-react';
import { ClientForm } from './ClientForm';
import { dataManager } from '../utils/dataManager';

export const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    loadClientsReactive();
  }, []);

  const loadClientsReactive = async () => {
    try {
      await dataManager.loadData('clients');
      setClients(dataManager.getData('clients') || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  // Subscrever para mudanças nos clientes
  useEffect(() => {
    const unsubscribe = dataManager.subscribe('clients', () => {
      setClients(dataManager.getData('clients') || []);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.document.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const handleSaveClient = async (client: Client) => {
    const isEditing = !!editingClient;
    try {
      if (editingClient) {
        await supabaseStorage.updateClient(client.id, client);
        dataManager.updateLocalData('clients', 'update', client, client.id);
      } else {
        await supabaseStorage.addClient(client);
        dataManager.updateLocalData('clients', 'add', client);
      }
      
      // Forçar atualização dos dados locais
      await dataManager.invalidateAndReload('clients');
      
      setShowForm(false);
      setEditingClient(undefined);
      
      setSuccessMessage(isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente. Tente novamente.');
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      setClientToDelete(client);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      try {
        await supabaseStorage.deleteClient(clientToDelete.id);
        dataManager.updateLocalData('clients', 'delete', null, clientToDelete.id);
        setShowDeleteModal(false);
        setClientToDelete(null);
        setSuccessMessage('Cliente excluído com sucesso!');
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Erro ao excluir cliente. Tente novamente.');
      }
    }
  };

  const handleNewClient = () => {
    setEditingClient(undefined);
    setShowForm(true);
  };

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredClients.map((client) => (
        <div key={client.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {client.type === 'fisica' ? (
                <UserIcon className="text-blue-600 mr-2" size={20} />
              ) : (
                <Building2 className="text-green-600 mr-2" size={20} />
              )}
              <span className="text-sm font-medium text-gray-500 uppercase">
                {client.type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditClient(client)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDeleteClient(client.id)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">{client.name}</h3>
          
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <span className="text-sm">
                {client.type === 'fisica' ? 'CPF:' : 'CNPJ:'} {client.document}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Mail size={16} className="mr-2" />
              <span className="text-sm">{client.email}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Phone size={16} className="mr-2" />
              <span className="text-sm">{client.phone}</span>
            </div>
            
            {client.city && client.state && (
              <div className="text-sm text-gray-500">
                {client.neighborhood && `${client.neighborhood}, `}{client.city}/{client.state}
              </div>
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
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Endereço
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {client.type === 'fisica' ? (
                      <UserIcon className="text-blue-600 mr-2" size={16} />
                    ) : (
                      <Building2 className="text-green-600 mr-2" size={16} />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-xs text-gray-500">
                        {client.type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{client.document}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{client.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{client.phone}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {client.address || client.neighborhood || client.city ? 
                      `${client.address}${client.number ? `, ${client.number}` : ''}${client.neighborhood ? ` - ${client.neighborhood}` : ''}${client.city && client.state ? ` - ${client.city}/${client.state}` : ''}` 
                      : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClient(client)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
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
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
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
          <button
            onClick={handleNewClient}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {viewMode === 'cards' ? renderCardsView() : renderListView()}

      {filteredClients.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </div>
          {!searchTerm && (
            <button
              onClick={handleNewClient}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cadastrar Primeiro Cliente
            </button>
          )}
        </div>
      )}

      {showForm && (
        <ClientForm
          client={editingClient}
          onSave={handleSaveClient}
          onCancel={() => {
            setShowForm(false);
            setEditingClient(undefined);
          }}
        />
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

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && clientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-gray-600 mb-2">
                Tem certeza que deseja excluir o cliente:
              </p>
              <p className="font-semibold text-gray-900 mb-6">
                {clientToDelete.name}?
              </p>
              <p className="text-sm text-red-600 mb-6">
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setClientToDelete(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};