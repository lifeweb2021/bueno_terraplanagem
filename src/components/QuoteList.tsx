import React, { useState, useEffect } from 'react';
import { Quote, Order } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import {
  FileText, 
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
  Grid
} from 'lucide-react';
import { QuoteForm } from './QuoteForm';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { sendQuoteByEmail } from '../utils/emailService';
import { formatCurrency } from '../utils/validators';
import { dataManager } from '../utils/dataManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const QuoteList: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [quoteToApprove, setQuoteToApprove] = useState<Quote | null>(null);

  useEffect(() => {
    loadQuotesReactive();
  }, []);

  const loadQuotesReactive = async () => {
    try {
      await dataManager.loadData('quotes');
      setQuotes(dataManager.getData('quotes') || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    }
  };

  // Subscrever para mudanças nos orçamentos
  useEffect(() => {
    const unsubscribe = dataManager.subscribe('quotes', () => {
      setQuotes(dataManager.getData('quotes') || []);
    });

    return unsubscribe;
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

  const handleSaveQuote = async (quote: Quote) => {
    const isEditing = !!editingQuote;
    try {
      if (editingQuote) {
        await supabaseStorage.updateQuote(quote.id, quote);
        dataManager.updateLocalData('quotes', 'update', quote, quote.id);
      } else {
        await supabaseStorage.addQuote(quote);
        dataManager.updateLocalData('quotes', 'add', quote);
        await supabaseStorage.incrementCounter('quote');
      }
      
      // Forçar atualização dos dados locais
      await dataManager.invalidateAndReload('quotes');
      
      setShowForm(false);
      setEditingQuote(undefined);
      
      setSuccessMessage(isEditing ? 'Orçamento atualizado com sucesso!' : 'Orçamento cadastrado com sucesso!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      alert('Erro ao salvar orçamento. Tente novamente.');
    }
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setShowForm(true);
  };

  const handleDeleteQuote = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await supabaseStorage.deleteQuote(id);
        dataManager.updateLocalData('quotes', 'delete', null, id);
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error);
        alert('Erro ao excluir orçamento. Tente novamente.');
      }
    }
  };

  const handleNewQuote = () => {
    setEditingQuote(undefined);
    setShowForm(true);
  };

  const handleApproveQuote = (quote: Quote) => {
    setQuoteToApprove(quote);
    setShowApproveModal(true);
  };

  const confirmApproval = async () => {
    if (!quoteToApprove) return;

    // Atualizar status do orçamento
    const updatedQuote = { ...quoteToApprove, status: 'approved' as const };
    await supabaseStorage.updateQuote(quoteToApprove.id, updatedQuote);

    // Incrementar contador e obter novo número
    const newOrderCounter = await supabaseStorage.incrementCounter('order');
    const orderNumber = `PED${String(newOrderCounter).padStart(4, '0')}`;
    
    // Criar pedido
    const order: Order = {
      id: crypto.randomUUID(),
      quoteId: quoteToApprove.id,
      clientId: quoteToApprove.clientId,
      client: quoteToApprove.client,
      number: orderNumber,
      services: quoteToApprove.services,
      products: quoteToApprove.products,
      total: quoteToApprove.total,
      status: 'pending',
      createdAt: new Date(),
      isFromQuote: true
    };

    await supabaseStorage.addOrder(order);
    
    // Atualizar dados localmente
    dataManager.updateLocalData('quotes', 'update', updatedQuote, quoteToApprove.id);
    dataManager.updateLocalData('orders', 'add', order);
    
    setShowApproveModal(false);
    setQuoteToApprove(null);
    setSuccessMessage(`Orçamento aprovado! Pedido ${orderNumber} criado com sucesso.`);
    setShowSuccessModal(true);
  };

  const handleSendEmail = async (quote: Quote) => {
    try {
      const success = await sendQuoteByEmail(quote);
      if (success) {
        const updatedQuote = { ...quote, status: 'sent' as const };
        await supabaseStorage.updateQuote(quote.id, updatedQuote);
        dataManager.updateLocalData('quotes', 'update', updatedQuote, quote.id);
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      alert('Erro ao enviar email. Tente novamente.');
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

  const getStatusIcon = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return <Edit size={16} />;
      case 'sent': return <Mail size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const renderCardsView = () => (
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(quote.status)}`}>
              {getStatusIcon(quote.status)}
              <span className="ml-1">{getStatusLabel(quote.status)}</span>
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Data:</span>
              <span className="font-medium">{format(quote.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Válido até:</span>
              <span className="font-medium">{format(quote.validUntil, 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Serviços:</span>
              <span className="font-medium">{quote.services.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Produtos:</span>
              <span className="font-medium">{quote.products.length}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span className="text-gray-900">Total:</span>
              <span className="text-green-600">{formatCurrency(quote.total)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quote.status !== 'approved' && (
              <button
                onClick={() => handleEditQuote(quote)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <Edit size={16} className="mr-1" />
                Editar
              </button>
            )}

            <button
              onClick={() => generateQuotePDF(quote)}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
            >
              <Download size={16} className="mr-1" />
              PDF
            </button>

            {quote.status !== 'approved' && (
              <button
                onClick={() => handleSendEmail(quote)}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm"
              >
                <Mail size={16} className="mr-1" />
                Enviar
              </button>
            )}

            {(quote.status === 'draft' || quote.status === 'sent') && (
              <button
                onClick={() => handleApproveQuote(quote)}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <CheckCircle size={16} className="mr-1" />
                Aprovar
              </button>
            )}

            {quote.status !== 'approved' && (
              <button
                onClick={() => handleDeleteQuote(quote.id)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
              >
                <Trash2 size={16} className="mr-1" />
                Excluir
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
                Orçamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Validade
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
            {filteredQuotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="text-blue-600 mr-2" size={16} />
                    <span className="text-sm font-medium text-gray-900">{quote.number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{quote.client.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {format(quote.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {format(quote.validUntil, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(quote.total)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${getStatusColor(quote.status)}`}>
                    {getStatusIcon(quote.status)}
                    <span className="ml-1">{getStatusLabel(quote.status)}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {quote.status !== 'approved' && (
                      <button
                        onClick={() => handleEditQuote(quote)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => generateQuotePDF(quote)}
                      className="text-green-600 hover:text-green-900"
                      title="Baixar PDF"
                    >
                      <Download size={16} />
                    </button>
                    {quote.status !== 'approved' && (
                      <button
                        onClick={() => handleSendEmail(quote)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Enviar por Email"
                      >
                        <Mail size={16} />
                      </button>
                    )}
                    {(quote.status === 'draft' || quote.status === 'sent') && (
                      <button
                        onClick={() => handleApproveQuote(quote)}
                        className="text-green-600 hover:text-green-900"
                        title="Aprovar"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {quote.status !== 'approved' && (
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
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
        <h2 className="text-2xl font-bold text-gray-900">Orçamentos</h2>
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
            onClick={handleNewQuote}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Novo Orçamento
          </button>
        </div>
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

      {viewMode === 'cards' ? renderCardsView() : renderListView()}

      {filteredQuotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <div className="text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento criado ainda'}
          </div>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={handleNewQuote}
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

      {/* Modal de Confirmação de Aprovação */}
      {showApproveModal && quoteToApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmar Aprovação
              </h3>
              <p className="text-gray-600 mb-2">
                Tem certeza que deseja aprovar o orçamento:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-blue-900 mb-1">
                  {quoteToApprove.number}
                </p>
                <p className="text-sm text-blue-800 mb-1">
                  Cliente: {quoteToApprove.client.name}
                </p>
                <p className="text-sm text-blue-800">
                  Valor: {formatCurrency(quoteToApprove.total)}
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Esta ação irá gerar automaticamente um pedido e não pode ser desfeita.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setQuoteToApprove(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmApproval}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Aprovar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};