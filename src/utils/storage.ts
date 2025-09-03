import { Client, Quote, Order, CompanySettings } from '../types';
import type { User, AuthSession } from '../types/auth';
import { authService } from './auth';

const STORAGE_KEYS = {
  CLIENTS: 'clients',
  QUOTES: 'quotes',
  ORDERS: 'orders',
  COUNTERS: 'counters',
  COMPANY_SETTINGS: 'company_settings'
} as const;

export interface Counters {
  quote: number;
  order: number;
}

export const storage = {
  // Clients
  getClients: (): Client[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },

  saveClients: (clients: Client[]): void => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },

  addClient: (client: Client): void => {
    const clients = storage.getClients();
    clients.push(client);
    storage.saveClients(clients);
  },

  updateClient: (id: string, updatedClient: Client): void => {
    const clients = storage.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      clients[index] = updatedClient;
      storage.saveClients(clients);
    }
  },

  deleteClient: (id: string): void => {
    const clients = storage.getClients().filter(c => c.id !== id);
    storage.saveClients(clients);
  },

  // Validações de unicidade
  isDocumentUnique: (document: string, excludeId?: string): boolean => {
    const clients = storage.getClients();
    return !clients.some(client => 
      client.document === document && client.id !== excludeId
    );
  },

  isEmailUnique: (email: string, excludeId?: string): boolean => {
    const clients = storage.getClients();
    return !clients.some(client => 
      client.email.toLowerCase() === email.toLowerCase() && client.id !== excludeId
    );
  },

  // Quotes
  getQuotes: (): Quote[] => {
    const data = localStorage.getItem(STORAGE_KEYS.QUOTES);
    const quotes = data ? JSON.parse(data) : [];
    return quotes.map((quote: any) => ({
      ...quote,
      createdAt: new Date(quote.createdAt),
      updatedAt: new Date(quote.updatedAt),
      validUntil: new Date(quote.validUntil)
    }));
  },

  saveQuotes: (quotes: Quote[]): void => {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  },

  addQuote: (quote: Quote): void => {
    const quotes = storage.getQuotes();
    quotes.push(quote);
    storage.saveQuotes(quotes);
  },

  updateQuote: (id: string, updatedQuote: Quote): void => {
    const quotes = storage.getQuotes();
    const index = quotes.findIndex(q => q.id === id);
    if (index !== -1) {
      quotes[index] = updatedQuote;
      storage.saveQuotes(quotes);
    }
  },

  deleteQuote: (id: string): void => {
    const quotes = storage.getQuotes().filter(q => q.id !== id);
    storage.saveQuotes(quotes);
  },
  // Orders
  getOrders: (): Order[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const orders = data ? JSON.parse(data) : [];
    return orders.map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      completedAt: order.completedAt ? new Date(order.completedAt) : undefined
    }));
  },

  saveOrders: (orders: Order[]): void => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  addOrder: (order: Order): void => {
    const orders = storage.getOrders();
    orders.push(order);
    storage.saveOrders(orders);
  },

  updateOrder: (id: string, updatedOrder: Order): void => {
    const orders = storage.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = updatedOrder;
      storage.saveOrders(orders);
    }
  },

  // Counters
  getCounters: (): Counters => {
    const data = localStorage.getItem(STORAGE_KEYS.COUNTERS);
    return data ? JSON.parse(data) : { quote: 1, order: 1 };
  },

  saveCounters: (counters: Counters): void => {
    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
  },

  incrementCounter: (type: keyof Counters): number => {
    const counters = storage.getCounters();
    counters[type]++;
    storage.saveCounters(counters);
    return counters[type];
  },

  // Company Settings
  getCompanySettings: (): CompanySettings | null => {
    const data = localStorage.getItem(STORAGE_KEYS.COMPANY_SETTINGS);
    return data ? JSON.parse(data) : null;
  },

  saveCompanySettings: (settings: CompanySettings): void => {
    localStorage.setItem(STORAGE_KEYS.COMPANY_SETTINGS, JSON.stringify(settings));
  },

  // Validação de unicidade para empresa
  isCompanyCNPJUnique: (cnpj: string, excludeId?: string): boolean => {
    const settings = storage.getCompanySettings();
    if (!settings) return true;
    return settings.cnpj !== cnpj || settings.id === excludeId;
  },

  isCompanyEmailUnique: (email: string, excludeId?: string): boolean => {
    const settings = storage.getCompanySettings();
    if (!settings) return true;
    return settings.email.toLowerCase() !== email.toLowerCase() || settings.id === excludeId;
  },

  // Users
  // Delegação para authService
  getUsers: () => authService.getUsers(),
  saveUsers: (users: User[]) => authService.saveUsers(users),
  addUser: (user: User) => authService.addUser(user),
  updateUser: (id: string, user: User) => authService.updateUser(id, user),
  deleteUser: (id: string) => authService.deleteUser(id),
  isUsernameUnique: (username: string, excludeId?: string) => authService.isUsernameUnique(username, excludeId),
  isUserEmailUnique: (email: string, excludeId?: string) => authService.isUserEmailUnique(email, excludeId),
  getAuthSession: () => authService.getAuthSession(),
  saveAuthSession: (session: AuthSession) => authService.saveAuthSession(session),
  clearAuthSession: () => authService.clearAuthSession(),
  authenticateUser: (username: string, password: string) => authService.authenticateUser({ username, password }),
  initializeDefaultUser: () => authService.initializeDefaultUser()
};