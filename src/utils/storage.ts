import { Client, Quote, Order, CompanySettings, State, City } from '../types';
import type { User, AuthSession } from '../types/auth';
import { authService } from './auth';

const STORAGE_KEYS = {
  CLIENTS: 'clients',
  QUOTES: 'quotes',
  ORDERS: 'orders',
  COUNTERS: 'counters',
  COMPANY_SETTINGS: 'company_settings',
  STATES: 'states',
  CITIES: 'cities'
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
  initializeDefaultUser: () => authService.initializeDefaultUser(),

  // States
  getStates: (): State[] => {
    const data = localStorage.getItem(STORAGE_KEYS.STATES);
    const states = data ? JSON.parse(data) : [];
    return states.map((state: any) => ({
      ...state,
      createdAt: new Date(state.createdAt)
    }));
  },

  saveStates: (states: State[]): void => {
    localStorage.setItem(STORAGE_KEYS.STATES, JSON.stringify(states));
  },

  addState: (state: State): void => {
    const states = storage.getStates();
    states.push(state);
    storage.saveStates(states);
  },

  updateState: (id: string, updatedState: State): void => {
    const states = storage.getStates();
    const index = states.findIndex(s => s.id === id);
    if (index !== -1) {
      states[index] = updatedState;
      storage.saveStates(states);
    }
  },

  deleteState: (id: string): void => {
    const states = storage.getStates().filter(s => s.id !== id);
    storage.saveStates(states);
  },

  isStateCodeUnique: (code: string, excludeId?: string): boolean => {
    const states = storage.getStates();
    return !states.some(state => 
      state.code.toLowerCase() === code.toLowerCase() && state.id !== excludeId
    );
  },

  isStateNameUnique: (name: string, excludeId?: string): boolean => {
    const states = storage.getStates();
    return !states.some(state => 
      state.name.toLowerCase() === name.toLowerCase() && state.id !== excludeId
    );
  },

  // Cities
  getCities: (): City[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CITIES);
    const cities = data ? JSON.parse(data) : [];
    const states = storage.getStates();
    
    return cities.map((city: any) => ({
      ...city,
      createdAt: new Date(city.createdAt),
      state: states.find(s => s.id === city.stateId)
    }));
  },

  saveCities: (cities: City[]): void => {
    localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(cities));
  },

  addCity: (city: City): void => {
    const cities = storage.getCities();
    cities.push(city);
    storage.saveCities(cities);
  },

  updateCity: (id: string, updatedCity: City): void => {
    const cities = storage.getCities();
    const index = cities.findIndex(c => c.id === id);
    if (index !== -1) {
      cities[index] = updatedCity;
      storage.saveCities(cities);
    }
  },

  deleteCity: (id: string): void => {
    const cities = storage.getCities().filter(c => c.id !== id);
    storage.saveCities(cities);
  },

  isCityNameUnique: (name: string, stateId: string, excludeId?: string): boolean => {
    const cities = storage.getCities();
    return !cities.some(city => 
      city.name.toLowerCase() === name.toLowerCase() && 
      city.stateId === stateId && 
      city.id !== excludeId
    );
  },

  // Initialize default states and cities
  initializeDefaultLocations: (): void => {
    const states = storage.getStates();
    const cities = storage.getCities();
    
    if (states.length === 0) {
      const defaultStates: State[] = [
        { id: crypto.randomUUID(), name: 'São Paulo', code: 'SP', createdAt: new Date() },
        { id: crypto.randomUUID(), name: 'Rio de Janeiro', code: 'RJ', createdAt: new Date() },
        { id: crypto.randomUUID(), name: 'Minas Gerais', code: 'MG', createdAt: new Date() },
        { id: crypto.randomUUID(), name: 'Paraná', code: 'PR', createdAt: new Date() },
        { id: crypto.randomUUID(), name: 'Rio Grande do Sul', code: 'RS', createdAt: new Date() }
      ];
      storage.saveStates(defaultStates);
    }
    
    if (cities.length === 0) {
      const loadedStates = storage.getStates();
      const spState = loadedStates.find(s => s.code === 'SP');
      const rjState = loadedStates.find(s => s.code === 'RJ');
      const mgState = loadedStates.find(s => s.code === 'MG');
      
      if (spState && rjState && mgState) {
        const defaultCities: City[] = [
          { id: crypto.randomUUID(), name: 'São Paulo', stateId: spState.id, createdAt: new Date() },
          { id: crypto.randomUUID(), name: 'Campinas', stateId: spState.id, createdAt: new Date() },
          { id: crypto.randomUUID(), name: 'Santos', stateId: spState.id, createdAt: new Date() },
          { id: crypto.randomUUID(), name: 'Rio de Janeiro', stateId: rjState.id, createdAt: new Date() },
          { id: crypto.randomUUID(), name: 'Niterói', stateId: rjState.id, createdAt: new Date() },
          { id: crypto.randomUUID(), name: 'Belo Horizonte', stateId: mgState.id, createdAt: new Date() },
          { id: crypto.randomUUID(), name: 'Uberlândia', stateId: mgState.id, createdAt: new Date() }
        ];
        storage.saveCities(defaultCities);
      }
    }
  }
};