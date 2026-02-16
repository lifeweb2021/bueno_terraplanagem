import React, { useState, useEffect } from 'react';
import { Quote, Order } from '../types';
import { storage } from '../utils/storage';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Check, 
  X, 
  Clock,
  Send,
  Edit,
  Trash2
} from 'lucide-react';
import { QuoteForm } from './QuoteForm';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const QuoteList: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    let filtered = quotes;
    
    if (searchTerm) {
      filtered = filtered.filter(quote => 
        quote.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }
    
    setFilteredQuotes(filtered);
  }, [quotes, searchTerm, statusFilter]);

  const loadQuotes = () => {
    const loadedQuotes = storage.getQuotes();
    setQuotes(loadedQuotes);
  };

  const handleSaveQuote = (quote: Quote) => {
    if (editingQuote) {
      storage.updateQuote(quote.id, quote);
    } else {
      storage.addQuote(quote);
    }
    loadQuotes();
    setShowForm(false);
    setEditingQuote(undefined);
  };

  const handleApproveQuote = (quote: Quote) => {
    const updatedQuote = { ...quote, status: 'approved' as const };
    storage.updateQuote(quote.id, updatedQuote);
    
    // Criar pedido
    const counters = storage.getCounters();
    const orderNumber = `PED${String(counters.order).padStart(4, '0')}`;
    
    const order: Order = {
      id: crypto.randomUUID(),
      quoteId: quote.id,
      clientId: quote.clientId,
      client: quote.client,
      number: orderNumber,
      services: quote.services,
      products: quote.products,
      total: quote.total,
      status: 'pending',
      createdAt: new Date()
    };

    storage.addOrder(order);
    storage.incrementCounter('order');
    loadQuotes();
    
    alert('Orçamento aprovado! Pedido criado com sucesso.');
  };

  const handleRejectQuote = (quote: Quote) => {
    const updatedQuote = { ...quote, status: 'rejected' as const };
    storage.updateQuote(quote.id, updatedQuote);
    loadQuotes();
  };

  const handleDeleteQuote = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      const updatedQuotes = quotes.filter(q => q.id !== id);
      storage.saveQuotes(updatedQuotes);
      loadQuotes();
    }
  };

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'sent': return 'Enviado';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Orçamentos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Novo Orçamento
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar orçamentos..."
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
          <option value="draft">Rascunho</option>
          <option value="sent">Enviado</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuotes.map((quote) => (
          <div key={quote.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="text-blue-600 mr-3" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{quote.number}</h3>
                  <p className="text-sm text-gray-600">{quote.client.name}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
                {getStatusLabel(quote.status)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Serviços:</span>
                <span className="font-medium">{quote.services.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Produtos:</span>
                <span className="font-medium">{quote.products.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Válido até:</span>
                <span className="font-medium">{format(quote.validUntil, 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span className="text-gray-900">Total:</span>
                <span className="text-green-600">R$ {quote.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => generateQuotePDF(quote)}
                className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center text-sm"
              >
                <Download size={16} className="mr-1" />
                PDF
              </button>

              {quote.status === 'draft' && (
                <button
                  onClick={() => {
                    const updatedQuote = { ...quote, status: 'sent' as const };
                    storage.updateQuote(quote.id, updatedQuote);
                    loadQuotes();
                  }}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                >
                  <Send size={16} className="mr-1" />
                  Enviar
                </button>
              )}

              {quote.status === 'sent' && (
                <>
                  <button
                    onClick={() => handleApproveQuote(quote)}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                  >
                    <Check size={16} className="mr-1" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleRejectQuote(quote)}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
                  >
                    <X size={16} className="mr-1" />
                    Rejeitar
                  </button>
                </>
              )}

              {quote.status !== 'approved' && (
                <button
                  onClick={() => {
                    setEditingQuote(quote);
                    setShowForm(true);
                  }}
                  className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm"
                >
                  <Edit size={16} className="mr-1" />
                  Editar
                </button>
              )}

              <button
                onClick={() => handleDeleteQuote(quote.id)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
              >
                <Trash2 size={16} className="mr-1" />
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredQuotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <div className="text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento criado'}
          </div>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Primeiro Orçamento
            </button>
          )}
        </div>
      )}

      {showForm && (
        <QuoteForm
          quote={editingQuote}
          onSave={handleSaveQuote}
          onCancel={() => {
            setShowForm(false);
            setEditingQuote(undefined);
          }}
        />
      )}
    </div>
  );
};