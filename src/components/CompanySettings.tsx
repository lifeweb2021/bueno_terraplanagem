import React, { useState, useEffect } from 'react';
import { CompanySettings as CompanySettingsType } from '../types';
import { storage } from '../utils/storage';
import { Building2, Save, Upload } from 'lucide-react';
import { validateCNPJ, formatDocument } from '../utils/validators';

export const CompanySettings: React.FC = () => {
  const [settings, setSettings] = useState<Partial<CompanySettingsType>>({
    companyName: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    whatsapp: '',
    email: '',
    logo: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existingSettings = storage.getCompanySettings();
    if (existingSettings) {
      setSettings(existingSettings);
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!settings.companyName?.trim()) newErrors.companyName = 'Razão social é obrigatória';
    if (!settings.cnpj?.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
    if (!settings.email?.trim()) newErrors.email = 'Email é obrigatório';
    if (!settings.phone?.trim()) newErrors.phone = 'Telefone é obrigatório';

    if (settings.cnpj && !validateCNPJ(settings.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido';
    }

    if (settings.email && !/\S+@\S+\.\S+/.test(settings.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const settingsData: CompanySettingsType = {
      id: settings.id || crypto.randomUUID(),
      companyName: settings.companyName!,
      cnpj: settings.cnpj!,
      address: settings.address || '',
      city: settings.city || '',
      state: settings.state || '',
      zipCode: settings.zipCode || '',
      phone: settings.phone!,
      whatsapp: settings.whatsapp || '',
      email: settings.email!,
      logo: settings.logo || ''
    };

    storage.saveCompanySettings(settingsData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatDocument(value, 'juridica');
    setSettings({ ...settings, cnpj: formatted });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configurações da Empresa</h2>
        {saved && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center">
            <Save size={16} className="mr-2" />
            Configurações salvas!
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
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
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
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
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
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
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
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
                onChange={(e) => setSettings({ ...settings, state: e.target.value })}
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
                onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
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
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};