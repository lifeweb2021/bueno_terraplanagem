import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { storage } from '../utils/storage';
import { User, Building2, Mail, Phone, Edit, Trash2, Plus, Search } from 'lucide-react';
import { ClientForm } from './ClientForm';

export const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.document.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const loadClients = () => {
    const loadedClients = storage.getClients();
    setClients(loadedClients);
  };

  const handleSaveClient = (client: Client) => {
    if (editingClient) {
      storage.updateClient(client.id, client);
    } else {
      storage.addClient(client);
    }
    loadClients();
    setShowForm(false);
    setEditingClient(undefined);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      storage.deleteClient(id);
      loadClients();
    }
  };

  const handleNewClient = () => {
    setEditingClient(undefined);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
        <button
          onClick={handleNewClient}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Novo Cliente
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {client.type === 'fisica' ? (
                  <User className="text-blue-600 mr-2" size={20} />
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
                  {client.city}/{client.state}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
};