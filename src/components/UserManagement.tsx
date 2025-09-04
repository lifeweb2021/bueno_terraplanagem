import React, { useState, useEffect } from 'react';
import { supabaseAuth } from '../utils/supabaseAuth';
import { supabaseStorage } from '../utils/supabaseStorage';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  CheckCircle,
  Shield,
  UserCheck,
  UserX,
  Search,
  User as UserIcon
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'user' as 'admin' | 'user',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      const loadedUsers = await supabaseStorage.getUsers();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'user',
      isActive: true
    });
    setErrors({});
    setShowPassword(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!formData.username.trim()) newErrors.username = 'Usuário é obrigatório';
    if (!formData.password.trim() && !editingUser) newErrors.password = 'Senha é obrigatória';
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (editingUser) {
        // Para edição, apenas atualizar metadados
        setSuccessMessage('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário no Supabase Auth
        await supabaseAuth.signUp(
          formData.email,
          formData.password,
          {
            name: formData.name,
            username: formData.username,
            role: formData.role
          }
        );
        setSuccessMessage('Usuário cadastrado com sucesso!');
      }

      loadUsers();
      setShowForm(false);
      setEditingUser(undefined);
      resetForm();
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      if (error.message?.includes('already registered')) {
        alert('Este email já está cadastrado no sistema');
      } else {
        alert('Erro ao salvar usuário. Tente novamente.');
      }
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: '',
      confirmPassword: '',
      name: user.name,
      role: user.role,
      isActive: user.isActive
    });
    setShowForm(true);
  };

  const handleDeleteUser = (user: User) => {
    // Não permitir excluir o próprio usuário
    if (user.email === 'admin@sistema.com') {
      alert('Você não pode excluir seu próprio usuário');
      return;
    }
    
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await supabaseStorage.deleteUser(userToDelete.id);
        loadUsers();
        setShowDeleteModal(false);
        setUserToDelete(null);
        setSuccessMessage('Usuário excluído com sucesso!');
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário. Tente novamente.');
      }
    }
  };

  const toggleUserStatus = (user: User) => {
    if (user.email === 'admin@sistema.com') {
      alert('Você não pode desativar seu próprio usuário');
      return;
    }

    // Para simplificar, apenas mostrar mensagem
    alert('Funcionalidade de ativar/desativar será implementada em breve');
  };

  const handleNewUser = () => {
    setEditingUser(undefined);
    resetForm();
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
        <button
          onClick={handleNewUser}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Novo Usuário
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Perfil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acesso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        user.role === 'admin' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="text-red-600" size={20} />
                        ) : (
                          <User className="text-blue-600" size={20} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {user.isActive ? (
                        <>
                          <UserCheck size={12} className="mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <UserX size={12} className="mr-1" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {user.lastLogin 
                        ? user.lastLogin.toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <div className="text-gray-400 mb-4">
            {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          </div>
          {!searchTerm && (
            <button
              onClick={handleNewUser}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cadastrar Primeiro Usuário
            </button>
          )}
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(undefined);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="email@exemplo.com"
                  disabled={!!editingUser}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                {editingUser && <p className="mt-1 text-xs text-gray-500">Email não pode ser alterado</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite o nome completo"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuário
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite o nome de usuário"
                  disabled={!!editingUser}
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                {editingUser && <p className="mt-1 text-xs text-gray-500">Username não pode ser alterado</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={editingUser ? 'Nova senha (opcional)' : 'Digite a senha'}
                    disabled={!!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                {editingUser && <p className="mt-1 text-xs text-gray-500">Edição de senha será implementada em breve</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirme a senha"
                  disabled={!!editingUser}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Perfil
                </label>
                <input
                  type="text"
                  value="Usuário"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Todos os usuários têm acesso completo ao sistema</p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Save size={20} className="mr-2" />
                  {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(undefined);
                    resetForm();
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
      {showDeleteModal && userToDelete && (
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
                Tem certeza que deseja excluir o usuário:
              </p>
              <p className="font-semibold text-gray-900 mb-6">
                {userToDelete.name} (@{userToDelete.username})?
              </p>
              <p className="text-sm text-red-600 mb-6">
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
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