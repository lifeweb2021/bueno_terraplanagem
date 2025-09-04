import type { User, AuthSession, LoginCredentials } from '../types/auth';

const STORAGE_KEYS = {
  USERS: 'users',
  AUTH_SESSION: 'auth_session'
} as const;

// Hash simples para senhas (em produção usar bcrypt)
export const hashPassword = (password: string): string => {
  // Implementação básica - em produção usar biblioteca de hash segura
  return btoa(password + 'salt_key_2025');
};

export const verifyPassword = (password: string, hash: string): boolean => {
  const hashedInput = hashPassword(password);
  console.log('Verificando senha:', { password, hash, hashedInput, match: hashedInput === hash });
  return hashedInput === hash;
};

export const authService = {
  // Usuários
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = data ? JSON.parse(data) : [];
    return users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
    }));
  },

  saveUsers: (users: User[]): void => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  addUser: (user: User): void => {
    const users = authService.getUsers();
    // Hash da senha antes de salvar
    const hashedPassword = authService.hashPassword(user.password);
    console.log('Criando usuário:', { originalPassword: user.password, hashedPassword });
    const hashedUser = { ...user, password: hashedPassword };
    users.push(hashedUser);
    authService.saveUsers(users);
  },

  updateUser: (id: string, updatedUser: User): void => {
    const users = authService.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      // Se a senha foi alterada e não está hasheada, fazer hash
      if (updatedUser.password && updatedUser.password.length < 50) {
        updatedUser.password = authService.hashPassword(updatedUser.password);
      }
      users[index] = updatedUser;
      authService.saveUsers(users);
    }
  },

  deleteUser: (id: string): void => {
    const users = authService.getUsers().filter(u => u.id !== id);
    authService.saveUsers(users);
  },

  isUsernameUnique: (username: string, excludeId?: string): boolean => {
    const users = authService.getUsers();
    return !users.some(user => 
      user.username.toLowerCase() === username.toLowerCase() && user.id !== excludeId
    );
  },

  isUserEmailUnique: (email: string, excludeId?: string): boolean => {
    const users = authService.getUsers();
    return !users.some(user => 
      user.email.toLowerCase() === email.toLowerCase() && user.id !== excludeId
    );
  },

  // Autenticação
  authenticateUser: (credentials: LoginCredentials): User | null => {
    const users = authService.getUsers();
    console.log('Tentativa de login:', credentials);
    console.log('Usuários disponíveis:', users);
    
    const user = users.find(u => 
      u.username.toLowerCase() === credentials.username.toLowerCase() && 
      u.isActive
    );
    
    console.log('Usuário encontrado:', user);
    
    if (user && verifyPassword(credentials.password, user.password)) {
      // Atualizar último login
      const updatedUser = { ...user, lastLogin: new Date() };
      authService.updateUser(user.id, updatedUser);
      console.log('Login bem-sucedido');
      return updatedUser;
    }
    
    console.log('Login falhou - senha incorreta ou usuário não encontrado');
    return null;
  },

  // Sessão
  getAuthSession: (): AuthSession | null => {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!data) return null;
    
    const session = JSON.parse(data);
    return {
      ...session,
      loginTime: new Date(session.loginTime)
    };
  },

  saveAuthSession: (session: AuthSession): void => {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
  },

  clearAuthSession: (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  },

  // Verificar se sessão é válida (opcional - para timeout)
  isSessionValid: (session: AuthSession): boolean => {
    const now = new Date();
    const sessionTime = new Date(session.loginTime);
    const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
    
    // Sessão válida por 8 horas
    return hoursDiff < 8;
  },

  // Inicializar usuário admin padrão
  initializeDefaultUser: (): void => {
    const users = authService.getUsers();
    console.log('Usuários existentes:', users);
    
    // Sempre recriar o usuário admin se não existir ou se a senha estiver incorreta
    const adminUser = users.find(u => u.username === 'admin');
    const shouldRecreateAdmin = !adminUser || adminUser.password === 'admin123' || adminUser.password.length > 50;
    
    if (users.length === 0 || shouldRecreateAdmin) {
      console.log('Criando usuário padrão...');
      
      // Limpar usuário admin existente se houver problema
      if (adminUser) {
        console.log('Removendo usuário admin com problema...');
        authService.deleteUser(adminUser.id);
      }
      
      const defaultUser: User = {
        id: crypto.randomUUID(),
        username: 'admin',
        password: 'admin123', // Será hasheada no addUser
        name: 'Administrador',
        email: 'admin@sistema.com',
        role: 'admin',
        isActive: true,
        createdAt: new Date()
      };
      authService.addUser(defaultUser);
      console.log('Usuário padrão criado com sucesso');
    }
  },

  // Export hash functions for use in other modules
  hashPassword,
  verifyPassword
};