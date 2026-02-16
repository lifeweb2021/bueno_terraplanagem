import React, { useState, useEffect } from 'react';
import { CompanySettings as CompanySettingsType } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import { Building2, Save, Upload, X, CheckCircle, Users, MapPin, UserCog } from 'lucide-react';
import { Building } from 'lucide-react';
import { validateCNPJ, formatDocument, formatPhone, formatZipCode } from '../utils/validators';
import { UserManagement } from './UserManagement';
import { LocationManagement } from './LocationManagement';
import { supabaseAuth } from '../utils/supabaseAuth';
import { dataManager } from '../utils/dataManager';

export const CompanySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'locations' | 'cities'>('company');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<Partial<CompanySettingsType>>({
    companyName: '',
    cnpj: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    whatsapp: '',
    email: '',
    logo: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadCompanySettingsReactive();
    loadCurrentUser();
    initializeLocations();
  }, []);

  const loadCompanySettingsReactive = async () => {
    try {
      await dataManager.loadData('companySettings');
      const existingSettings = dataManager.getData('companySettings');
      if (existingSettings) {
        setSettings(existingSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Subscrever para mudanças nas configurações
  useEffect(() => {
    const unsubscribe = dataManager.subscribe('companySettings', () => {
      const settings = dataManager.getData('companySettings');
      if (settings) {
        setSettings(settings);
      }
    });

    return unsubscribe;
  }, []);

  const initializeLocations = async () => {
    // Initialize default states if none exist
    const states = await supabaseStorage.getStates();
    if (states.length === 0) {
      const defaultStates = [
        { id: crypto.randomUUID(), name: 'São Paulo', code: 'SP', createdAt: new Date() },
        { id: crypto.randomUUID(), name: 'Rio de Janeiro', code: 'RJ', createdAt: new Date() },
        { id: crypto.randomUUID(), name: 'Minas Gerais', code: 'MG', createdAt: new Date() },
        { id: crypto.randomUUID(), name: 'Paraná', code: 'PR', createdAt: new Date() },
        { id: crypto.randomUUID(), name: 'Rio Grande do Sul', code: 'RS', createdAt: new Date() }
      ];
      
      for (const state of defaultStates) {
        try {
          await supabaseStorage.addState(state);
        } catch (error) {
          console.error('Error adding default state:', error);
        }
      }
    }
  };

  const loadCurrentUser = async () => {
    try {
      const session = await supabaseAuth.getSession();
      if (session?.user) {
        setCurrentUser({
          role: session.user.user_metadata?.role || 'user'
        });
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!settings.companyName?.trim()) newErrors.companyName = 'Razão social é obrigatória';
    if (!settings.cnpj?.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
    if (!settings.email?.trim()) newErrors.email = 'Email é obrigatório';
    if (!settings.phone?.trim()) newErrors.phone = 'Telefone é obrigatório';

    if (settings.cnpj && !validateCNPJ(settings.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido';
    } else if (settings.cnpj) {
      // Note: CNPJ uniqueness is handled by database constraints
    }

    if (settings.email && !/\S+@\S+\.\S+/.test(settings.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const settingsData: CompanySettingsType = {
        id: settings.id || crypto.randomUUID(),
        companyName: settings.companyName!,
        cnpj: settings.cnpj!,
        address: settings.address || '',
        neighborhood: settings.neighborhood || '',
        city: settings.city || '',
        state: settings.state || '',
        zipCode: settings.zipCode || '',
        phone: settings.phone!,
        whatsapp: settings.whatsapp || '',
        email: settings.email!,
        logo: settings.logo || ''
      };

      await supabaseStorage.saveCompanySettings(settingsData);
      dataManager.updateLocalData('companySettings', 'update', settingsData);
      
      // Forçar atualização dos dados locais
      await dataManager.invalidateAndReload('companySettings');
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    }
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatDocument(value, 'juridica');
    setSettings({ ...settings, cnpj: formatted });
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setSettings({ ...settings, phone: formatted });
  };

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatPhone(value);
    setSettings({ ...settings, whatsapp: formatted });
  };

  const handleZipCodeChange = (value: string) => {
    const formatted = formatZipCode(value);
    setSettings({ ...settings, zipCode: formatted });
  };


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({ ...settings, logo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const renderUserManagement = () => (
    <div>
      <div className="flex items-center mb-6">
        <UserCog className="text-blue-600 mr-3" size={32} />
        <h3 className="text-xl font-semibold text-gray-900">Gerenciamento de Usuários</h3>
      </div>
      <UserManagement />
    </div>
  );

  const renderLocationManagement = () => (
    <div>
      <div className="flex items-center mb-6">
        <MapPin className="text-blue-600 mr-3" size={32} />
        <h3 className="text-xl font-semibold text-gray-900">Estados</h3>
      </div>
      <LocationManagement activeTabProp="states" />
    </div>
  );

  const renderCityManagement = () => (
    <div>
      <div className="flex items-center mb-6">
        <Building className="text-green-600 mr-3" size={32} />
        <h3 className="text-xl font-semibold text-gray-900">Cidades</h3>
      </div>
      <LocationManagement activeTabProp="cities" />
    </div>
  );

  const renderCompanyForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center mb-6">
        <Building2 className="text-blue-600 mr-3" size={32} />
        <h3 className="text-xl font-semibold text-gray-900">Dados da Empresa</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Razão Social
          </label>
          <input
            type="text"
            value={settings.companyName || ''}
            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.companyName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Digite a razão social da empresa"
          />
          {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
          <input
            type="text"
            value={settings.cnpj || ''}
            onChange={(e) => handleCNPJChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.cnpj ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="00.000.000/0000-00"
          />
          {errors.cnpj && <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={settings.email || ''}
            onChange={(e) => setSettings({ ...settings, email: e.target.value.toLowerCase() })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="contato@empresa.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
          <input
            type="tel"
            value={settings.phone || ''}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="(11) 99999-9999"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
          <input
            type="tel"
            value={settings.whatsapp || ''}
            onChange={(e) => handleWhatsAppChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
        <input
          type="text"
          value={settings.address || ''}
          onChange={(e) => setSettings({ ...settings, address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Rua, número, complemento"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
        <input
          type="text"
          value={settings.neighborhood || ''}
          onChange={(e) => setSettings({ ...settings, neighborhood: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Digite o bairro"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
          <input
            type="text"
            value={settings.city || ''}
            onChange={(e) => setSettings({ ...settings, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite a cidade"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <input
            type="text"
            value={settings.state || ''}
            onChange={(e) => setSettings({ ...settings, state: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="UF"
            maxLength={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
          <input
            type="text"
            value={settings.zipCode || ''}
            onChange={(e) => handleZipCodeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="00000-000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logomarca</label>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="logo-upload"
          />
          <label
            htmlFor="logo-upload"
            className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center"
          >
            <Upload size={20} className="mr-2 text-gray-600" />
            <span className="text-gray-600">Selecionar imagem</span>
          </label>
          {settings.logo && (
            <div className="flex items-center">
              <img
                src={settings.logo}
                alt="Logo preview"
                className="w-16 h-16 object-contain border rounded"
              />
              <button
                type="button"
                onClick={() => setSettings({ ...settings, logo: '' })}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                Remover
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6">
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Save size={20} className="mr-2" />
          Salvar Dados da Empresa
        </button>
      </div>
    </form>
  );


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configurações da Empresa</h2>
      </div>

      {/* Abas */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('company')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'company'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 size={20} className="inline mr-2" />
              Dados da Empresa
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCog size={20} className="inline mr-2" />
                Usuários
              </button>
            )}
            <button
              onClick={() => setActiveTab('locations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'locations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin size={20} className="inline mr-2" />
              Estados
            </button>
            <button
              onClick={() => setActiveTab('cities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building size={20} className="inline mr-2" />
              Cidades
            </button>
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'company' && renderCompanyForm()}
          {activeTab === 'users' && currentUser?.role === 'admin' && renderUserManagement()}
          {activeTab === 'locations' && renderLocationManagement()}
          {activeTab === 'cities' && renderCityManagement()}
        </div>
      </div>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Configurações Salvas!
              </h3>
              <p className="text-gray-600 mb-6">
                Os dados da empresa foram cadastrados com sucesso.
              </p>
              <button
                onClick={closeSuccessModal}
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