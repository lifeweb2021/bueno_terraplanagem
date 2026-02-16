import React, { useState, useEffect } from 'react';
import { Client, Quote, Service, Product } from '../types';
import { storage } from '../utils/storage';
import { Save, X, Plus, Trash2, Calculator } from 'lucide-react';
import { formatCurrency } from '../utils/validators';

interface QuoteFormProps {
  quote?: Quote;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ quote, onSave, onCancel }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    clientId: quote?.clientId || '',
    services: quote?.services || [] as Service[],
    products: quote?.products || [] as Product[],
    discount: quote?.discount || 0,
    validUntil: quote?.validUntil ? quote.validUntil.toISOString().split('T')[0] : '',
    notes: quote?.notes || ''
  });

  useEffect(() => {
    setClients(storage.getClients());
    if (!quote && !formData.validUntil) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setFormData(prev => ({ ...prev, validUntil: futureDate.toISOString().split('T')[0] }));
    }
  }, [quote]);

  const addService = () => {
    const newService: Service = {
      id: crypto.randomUUID(),
      description: '',
      hours: 0,
      hourlyRate: 0,
      total: 0
    };
    setFormData(prev => ({ ...prev, services: [...prev.services, newService] }));
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(service => {
        if (service.id === id) {
          const updated = { ...service, ...updates };
          updated.total = updated.hours * updated.hourlyRate;
          return updated;
        }
        return service;
      })
    }));
  };

  const removeService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== id)
    }));
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 0,
      unitPrice: 0,
      total: 0
    };
    setFormData(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(product => {
        if (product.id === id) {
          const updated = { ...product, ...updates };
          updated.total = updated.quantity * updated.unitPrice;
          return updated;
        }
        return product;
      })
    }));
  };

  const removeProduct = (id: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(product => product.id !== id)
    }));
  };

  const calculateTotals = () => {
    const servicesTotal = formData.services.reduce((sum, service) => sum + service.total, 0);
    const productsTotal = formData.products.reduce((sum, product) => sum + product.total, 0);
    const subtotal = servicesTotal + productsTotal;
    const total = subtotal - formData.discount;
    return { subtotal, total };
  };

  const { subtotal, total } = calculateTotals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      alert('Selecione um cliente');
      return;
    }

    if (formData.services.length === 0 && formData.products.length === 0) {
      alert('Adicione pelo menos um serviço ou produto');
      return;
    }

    const client = clients.find(c => c.id === formData.clientId)!;
    const counters = storage.getCounters();
    const quoteNumber = quote?.number || `ORÇ${String(counters.quote).padStart(4, '0')}`;

    const quoteData: Quote = {
      id: quote?.id || crypto.randomUUID(),
      clientId: formData.clientId,
      client,
      number: quoteNumber,
      services: formData.services,
      products: formData.products,
      subtotal,
      discount: formData.discount,
      total,
      status: quote?.status || 'draft',
      validUntil: new Date(formData.validUntil),
      notes: formData.notes,
      createdAt: quote?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (!quote) {
      storage.incrementCounter('quote');
    }

    onSave(quoteData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {quote ? 'Editar Orçamento' : 'Novo Orçamento'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.document}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Válido até</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Serviços</h3>
              <button
                type="button"
                onClick={addService}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <Plus size={16} className="mr-1" />
                Adicionar
              </button>
            </div>

            <div className="space-y-4">
              {formData.services.map((service, index) => (
                <div key={service.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição do Serviço
                      </label>
                      <input
                        type="text"
                        value={service.description}
                        onChange={(e) => updateService(service.id, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Desenvolvimento de website"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Horas</label>
                      <input
                        type="number"
                        step="0.5"
                        value={service.hours}
                        onChange={(e) => updateService(service.id, { hours: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor/Hora</label>
                      <input
                        type="number"
                        step="0.01"
                        value={service.hourlyRate}
                        onChange={(e) => updateService(service.id, { hourlyRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium text-gray-700">Total</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(service.total)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeService(service.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Produtos</h3>
              <button
                type="button"
                onClick={addProduct}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <Plus size={16} className="mr-1" />
                Adicionar
              </button>
            </div>

            <div className="space-y-4">
              {formData.products.map((product, index) => (
                <div key={product.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição do Produto
                      </label>
                      <input
                        type="text"
                        value={product.description}
                        onChange={(e) => updateProduct(product.id, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Licença de software"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => updateProduct(product.id, { quantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor Unitário</label>
                      <input
                        type="number"
                        step="0.01"
                        value={product.unitPrice}
                        onChange={(e) => updateProduct(product.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium text-gray-700">Total</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(product.total)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desconto</label>
              <input
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center justify-center bg-blue-50 p-4 rounded-lg">
              <Calculator className="mr-3 text-blue-600" size={24} />
              <div>
                <div className="text-sm text-gray-600">Subtotal: {formatCurrency(subtotal)}</div>
                <div className="text-lg font-bold text-blue-600">Total: {formatCurrency(total)}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Observações adicionais sobre o orçamento..."
            />
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Save size={20} className="mr-2" />
              Salvar Orçamento
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