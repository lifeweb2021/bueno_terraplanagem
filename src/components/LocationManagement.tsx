import React, { useState, useEffect } from 'react';
import { State, City } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckCircle,
  Search,
  Building,
  Map
} from 'lucide-react';

export const LocationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'states' | 'cities'>('states');
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredStates, setFilteredStates] = useState<State[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStateForm, setShowStateForm] = useState(false);
  const [showCityForm, setShowCityForm] = useState(false);
  const [editingState, setEditingState] = useState<State | undefined>();
  const [editingCity, setEditingCity] = useState<City | undefined>();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'state' | 'city'; item: State | City } | null>(null);

  const [stateFormData, setStateFormData] = useState({
    name: '',
    code: ''
  });

  const [cityFormData, setCityFormData] = useState({
    name: '',
    stateId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'states') {
      const filtered = states.filter(state => 
        state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStates(filtered);
    } else {
      const filtered = cities.filter(city => 
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (city.state?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
      setFilteredCities(filtered);
    }
  }, [states, cities, searchTerm, activeTab]);

  const loadData = () => {
    loadDataAsync();
  };

  const loadDataAsync = async () => {
    const loadedStates = await supabaseStorage.getStates();
    const loadedCities = await supabaseStorage.getCities();
    setStates(loadedStates);
    setCities(loadedCities);
  };

  const resetStateForms = () => {
    setStateFormData({ name: '', code: '' });
    setErrors({});
  };

  const resetCityForms = () => {
    setCityFormData({ name: '', stateId: '' });
    setErrors({});
  };

  const validateStateForm = async () => {
    const newErrors: Record<string, string> = {};

    if (!stateFormData.name.trim()) newErrors.name = 'Nome do estado é obrigatório';
    if (!stateFormData.code.trim()) newErrors.code = 'Código UF é obrigatório';
    
    if (stateFormData.code && stateFormData.code.length !== 2) {
      newErrors.code = 'Código UF deve ter 2 caracteres';
    }

    if (stateFormData.name && !(await supabaseStorage.isStateNameUnique(stateFormData.name, editingState?.id))) {
      newErrors.name = 'Este nome de estado já existe';
    }

    if (stateFormData.code && !(await supabaseStorage.isStateCodeUnique(stateFormData.code, editingState?.id))) {
      newErrors.code = 'Este código UF já existe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCityForm = async () => {
    const newErrors: Record<string, string> = {};

    if (!cityFormData.name.trim()) newErrors.name = 'Nome da cidade é obrigatório';
    if (!cityFormData.stateId) newErrors.stateId = 'Estado é obrigatório';

    if (cityFormData.name && cityFormData.stateId && !(await supabaseStorage.isCityNameUnique(cityFormData.name, cityFormData.stateId, editingCity?.id))) {
      newErrors.name = 'Esta cidade já existe neste estado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateStateForm())) return;

    try {
      const stateData: State = {
        id: editingState?.id || crypto.randomUUID(),
        name: stateFormData.name.trim(),
        code: stateFormData.code.trim().toUpperCase(),
        createdAt: editingState?.createdAt || new Date()
      };

      if (editingState) {
        await supabaseStorage.updateState(stateData.id, stateData);
        setSuccessMessage('Estado atualizado com sucesso!');
      } else {
        await supabaseStorage.addState(stateData);
        setSuccessMessage('Estado cadastrado com sucesso!');
      }

      loadData();
      setShowStateForm(false);
      setEditingState(undefined);
      resetStateForms();
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao salvar estado:', error);
      alert('Erro ao salvar estado. Tente novamente.');
    }
  };

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateCityForm())) return;

    try {
      const cityData: City = {
        id: editingCity?.id || crypto.randomUUID(),
        name: cityFormData.name.trim(),
        stateId: cityFormData.stateId,
        createdAt: editingCity?.createdAt || new Date()
      };

      if (editingCity) {
        await supabaseStorage.updateCity(cityData.id, cityData);
        setSuccessMessage('Cidade atualizada com sucesso!');
      } else {
        await supabaseStorage.addCity(cityData);
        setSuccessMessage('Cidade cadastrada com sucesso!');
      }

      loadData();
      setShowCityForm(false);
      setEditingCity(undefined);
      resetCityForms();
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao salvar cidade:', error);
      alert('Erro ao salvar cidade. Tente novamente.');
    }
  };

  const handleEditState = (state: State) => {
    setEditingState(state);
    setStateFormData({
      name: state.name,
      code: state.code
    });
    setShowStateForm(true);
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityFormData({
      name: city.name,
      stateId: city.stateId
    });
    setShowCityForm(true);
  };

  const handleDelete = (type: 'state' | 'city', item: State | City) => {
    setItemToDelete({ type, item });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'state') {
        // Verificar se há cidades vinculadas
        const loadedCities = await supabaseStorage.getCities();
        const linkedCities = loadedCities.filter(city => city.stateId === itemToDelete.item.id);
        if (linkedCities.length > 0) {
          alert(`Não é possível excluir este estado pois há ${linkedCities.length} cidade(s) vinculada(s) a ele.`);
          setShowDeleteModal(false);
          setItemToDelete(null);
          return;
        }
        await supabaseStorage.deleteState(itemToDelete.item.id);
        setSuccessMessage('Estado excluído com sucesso!');
      } else {
        await supabaseStorage.deleteCity(itemToDelete.item.id);
        setSuccessMessage('Cidade excluída com sucesso!');
      }

      loadData();
      setShowDeleteModal(false);
      setItemToDelete(null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item. Tente novamente.');
    }
  };

  const renderStatesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Map className="text-blue-600 mr-2" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Estados</h3>
        </div>
        <button
          onClick={() => {
            setEditingState(undefined);
            resetStateForms();
            setShowStateForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Novo Estado
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar estados..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cidades
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStates.map((state) => {
                const cityCount = cities.filter(city => city.stateId === state.id).length;
                return (
                  <tr key={state.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{state.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{state.code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{cityCount} cidade(s)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditState(state)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete('state', state)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStates.length === 0 && (
        <div className="text-center py-12">
          <Map className="mx-auto text-gray-400 mb-4" size={48} />
          <div className="text-gray-400 mb-4">
            {searchTerm ? 'Nenhum estado encontrado' : 'Nenhum estado cadastrado'}
          </div>
        </div>
      )}
    </div>
  );

  const renderCitiesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Building className="text-green-600 mr-2" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Cidades</h3>
        </div>
        <button
          onClick={() => {
            setEditingCity(undefined);
            resetCityForms();
            setShowCityForm(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Nova Cidade
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar cidades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCities.map((city) => (
                <tr key={city.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{city.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{city.state?.name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{city.state?.code || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCity(city)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete('city', city)}
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

      {filteredCities.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto text-gray-400 mb-4" size={48} />
          <div className="text-gray-400 mb-4">
            {searchTerm ? 'Nenhuma cidade encontrada' : 'Nenhuma cidade cadastrada'}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Abas */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => {
                setActiveTab('states');
                setSearchTerm('');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'states'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Map size={20} className="inline mr-2" />
              Estados
            </button>
            <button
              onClick={() => {
                setActiveTab('cities');
                setSearchTerm('');
              }}
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

        <div className="p-6">
          {activeTab === 'states' ? renderStatesTab() : renderCitiesTab()}
        </div>
      </div>

      {/* Modal de Formulário de Estado */}
      {showStateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingState ? 'Editar Estado' : 'Novo Estado'}
              </h2>
              <button
                onClick={() => {
                  setShowStateForm(false);
                  setEditingState(undefined);
                  resetStateForms();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleStateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Estado
                </label>
                <input
                  type="text"
                  value={stateFormData.name}
                  onChange={(e) => setStateFormData({ ...stateFormData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: São Paulo"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código UF
                </label>
                <input
                  type="text"
                  value={stateFormData.code}
                  onChange={(e) => setStateFormData({ ...stateFormData, code: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: SP"
                  maxLength={2}
                />
                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Save size={20} className="mr-2" />
                  Salvar Estado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStateForm(false);
                    setEditingState(undefined);
                    resetStateForms();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Formulário de Cidade */}
      {showCityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCity ? 'Editar Cidade' : 'Nova Cidade'}
              </h2>
              <button
                onClick={() => {
                  setShowCityForm(false);
                  setEditingCity(undefined);
                  resetCityForms();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCitySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Cidade
                </label>
                <input
                  type="text"
                  value={cityFormData.name}
                  onChange={(e) => setCityFormData({ ...cityFormData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: São Paulo"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={cityFormData.stateId}
                  onChange={(e) => setCityFormData({ ...cityFormData, stateId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.stateId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um estado</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
                {errors.stateId && <p className="mt-1 text-sm text-red-600">{errors.stateId}</p>}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Save size={20} className="mr-2" />
                  Salvar Cidade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCityForm(false);
                    setEditingCity(undefined);
                    resetCityForms();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
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
      {showDeleteModal && itemToDelete && (
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
                Tem certeza que deseja excluir {itemToDelete.type === 'state' ? 'o estado' : 'a cidade'}:
              </p>
              <p className="font-semibold text-gray-900 mb-6">
                {itemToDelete.type === 'state' 
                  ? `${(itemToDelete.item as State).name} (${(itemToDelete.item as State).code})`
                  : (itemToDelete.item as City).name
                }?
              </p>
              <p className="text-sm text-red-600 mb-6">
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
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