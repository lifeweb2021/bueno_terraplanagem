export interface User {
  id: string;
  username: string;
  password: string; // Em produção, seria hash
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthSession {
  userId: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  loginTime: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}