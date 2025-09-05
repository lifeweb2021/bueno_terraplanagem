import React, { useState } from 'react';
import { User as UserIcon, Lock, Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { supabaseAuth } from '../utils/supabaseAuth';
import { supabaseStorage } from '../utils/supabaseStorage';

interface LoginFormProps {
  onLogin: (session: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [companySettings, setCompanySettings] = useState<any>(null);

  React.useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const settings = await supabaseStorage.getCompanySettings();
      setCompanySettings(settings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { user, session } = await supabaseAuth.signIn(formData.email, formData.password);
      
      if (user) {
        const sessionData = {
          userId: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          username: user.user_metadata?.username || user.email.split('@')[0],
          loginTime: new Date(),
          supabaseSession: session
        };
        
        onLogin(sessionData);
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Email ou senha incorretos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          {companySettings?.logo ? (
            <div className="mx-auto w-40 h-32 mb-4 flex items-center justify-center relative">
              <img 
                src={companySettings.logo} 
                alt="Logo da empresa" 
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  console.error('Erro ao carregar logo:', e);
                  const target = e.currentTarget as HTMLImageElement;
                  // Esconder a imagem e mostrar o fallback
                  target.parentElement!.innerHTML = `
                    <div class="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg class="text-white" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
          ) : (
            <div className="mx-auto w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="text-white" size={64} />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {companySettings?.companyName || 'Sistema de Orçamentos'}
          </h1>
          <p className="text-gray-600">
            Faça login para acessar o painel
          </p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                placeholder="Digite seu email"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                placeholder="Digite sua senha"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={20} className="mr-2" />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
