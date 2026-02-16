import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { storage } from '../utils/storage';
import { User, Building2, Save, X } from 'lucide-react';
import { validateCPF, validateCNPJ, formatDocument, formatPhone } from '../utils/validators';

interface ClientFormProps {
  client?: Client;
  onSave: (client: Client) => void;
  onCancel: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    type: 'fisica',
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    ...client
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.document?.trim()) newErrors.document = 'CPF/CNPJ é obrigatório';
    if (!formData.email?.trim()) newErrors.email = 'Email é obrigatório';
    if (!formData.phone?.trim()) newErrors.phone = 'Telefone é obrigatório';

    if (formData.document) {
      const isValid = formData.type === 'fisica' 
        ? validateCPF(formData.document) 
        : validateCNPJ(formData.document);
      
      if (!isValid) {
        newErrors.document = formData.type === 'fisica' ? 'CPF inválido' : 'CNPJ inválido';
      }
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const clientData: Client = {
      id: client?.id || crypto.randomUUID(),
      type: formData.type!,
      name: formData.name!,
      document: formData.document!,
      email: formData.email!,
      phone: formData.phone!,
      address: formData.address || '',
      city: formData.city || '',
      state: formData.state || '',
      zipCode: formData.zipCode || '',
      createdAt: client?.createdAt || new Date()
    };

    onSave(clientData);
  };

  const handleDocumentChange = (value: string) => {
    const formatted = formatDocument(value, formData.type!);
    setFormData({ ...formData, document: formatted });
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setFormData({ ...formData, phone: formatted });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Cliente
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fisica"
                  checked={formData.type === 'fisica'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fisica' | 'juridica', document: '' })}
                  className="mr-2"
                />
                <User size={18} className="mr-1" />
                Pessoa Física
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="juridica"
                  checked={formData.type === 'juridica'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fisica' | 'juridica', document: '' })}
                  className="mr-2"
                />
                <Building2 size={18} className="mr-1" />
                Pessoa Jurídica
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'fisica' ? 'Nome Completo' : 'Razão Social'}
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.type === 'fisica' ? 'Digite o nome completo' : 'Digite a razão social'}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'fisica' ? 'CPF' : 'CNPJ'}
              </label>
              <input
                type="text"
                value={formData.document || ''}
                onChange={(e) => handleDocumentChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.document ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.type === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
              />
              {errors.document && <p className="mt-1 text-sm text-red-600">{errors.document}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="email@exemplo.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(11) 99999-9999"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite a cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="UF"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
              <input
                type="text"
                value={formData.zipCode || ''}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="00000-000"
              />
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Save size={20} className="mr-2" />
              Salvar Cliente
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};