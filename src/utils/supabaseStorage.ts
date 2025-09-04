import { supabase } from '../lib/supabase';
import { Client, Quote, Order, CompanySettings, State, City } from '../types';
import type { User, AuthSession } from '../types/auth';

export interface Counters {
  quote: number;
  order: number;
}

export const supabaseStorage = {
  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return data.map(user => ({
      ...user,
      role: user.role as 'admin' | 'user',
      isActive: user.is_active,
      createdAt: new Date(user.created_at),
      lastLogin: user.last_login ? new Date(user.last_login) : undefined
    }));
  },

  async addUser(user: User): Promise<void> {
    const { error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        username: user.username,
        password: user.password,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.isActive,
        created_at: user.createdAt.toISOString(),
        last_login: user.lastLogin?.toISOString()
      });
    
    if (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  },

  async updateUser(id: string, user: User): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        username: user.username,
        password: user.password,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.isActive,
        last_login: user.lastLogin?.toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Company Settings
  async getCompanySettings(): Promise<CompanySettings | null> {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle();
       // .single();
      
     /* if (error) {
        throw error;
      }*/

      if (error) {
  console.error("Error fetching company settings:", error);
  return null;
}

if (!data) {
  console.warn("Nenhum company_settings encontrado.");
  return null; // ou um objeto default
}
      
      return {
        id: data.id,
        companyName: data.company_name,
        cnpj: data.cnpj,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        logo: data.logo,
        emailSettings: data.email_settings
      };
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching company settings:', error);
      return null;
    }
  },

  async saveCompanySettings(settings: CompanySettings): Promise<void> {
    const { error } = await supabase
      .from('company_settings')
      .upsert({
        id: settings.id,
        company_name: settings.companyName,
        cnpj: settings.cnpj,
        address: settings.address,
        neighborhood: settings.neighborhood,
        city: settings.city,
        state: settings.state,
        zip_code: settings.zipCode,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        logo: settings.logo,
        email_settings: settings.emailSettings,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving company settings:', error);
      throw error;
    }
  },

  // States
  async getStates(): Promise<State[]> {
    const { data, error } = await supabase
      .from('states')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching states:', error);
      return [];
    }
    
    return data.map(state => ({
      ...state,
      createdAt: new Date(state.created_at)
    }));
  },

  async addState(state: State): Promise<void> {
    const { error } = await supabase
      .from('states')
      .insert({
        id: state.id,
        name: state.name,
        code: state.code,
        created_at: state.createdAt.toISOString()
      });
    
    if (error) {
      console.error('Error adding state:', error);
      throw error;
    }
  },

  async updateState(id: string, state: State): Promise<void> {
    const { error } = await supabase
      .from('states')
      .update({
        name: state.name,
        code: state.code
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating state:', error);
      throw error;
    }
  },

  async deleteState(id: string): Promise<void> {
    const { error } = await supabase
      .from('states')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting state:', error);
      throw error;
    }
  },

  // Cities
  async getCities(): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select(`
        *,
        states (
          id,
          name,
          code
        )
      `)
      .order('name');
    
    if (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
    
    return data.map(city => ({
      id: city.id,
      name: city.name,
      stateId: city.state_id,
      state: city.states ? {
        id: city.states.id,
        name: city.states.name,
        code: city.states.code,
        createdAt: new Date()
      } : undefined,
      createdAt: new Date(city.created_at)
    }));
  },

  async addCity(city: City): Promise<void> {
    const { error } = await supabase
      .from('cities')
      .insert({
        id: city.id,
        name: city.name,
        state_id: city.stateId,
        created_at: city.createdAt.toISOString()
      });
    
    if (error) {
      console.error('Error adding city:', error);
      throw error;
    }
  },

  async updateCity(id: string, city: City): Promise<void> {
    const { error } = await supabase
      .from('cities')
      .update({
        name: city.name,
        state_id: city.stateId
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating city:', error);
      throw error;
    }
  },

  async deleteCity(id: string): Promise<void> {
    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting city:', error);
      throw error;
    }
  },

  // Clients
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    
    return data.map(client => ({
      id: client.id,
      type: client.type as 'fisica' | 'juridica',
      name: client.name,
      document: client.document,
      email: client.email,
      phone: client.phone,
      address: client.address,
      number: client.number,
      neighborhood: client.neighborhood,
      city: client.city,
      state: client.state,
      zipCode: client.zip_code,
      createdAt: new Date(client.created_at)
    }));
  },

  async addClient(client: Client): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .insert({
        id: client.id,
        type: client.type,
        name: client.name,
        document: client.document,
        email: client.email,
        phone: client.phone,
        address: client.address,
        number: client.number,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        zip_code: client.zipCode,
        created_at: client.createdAt.toISOString()
      });
    
    if (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  },

  async updateClient(id: string, client: Client): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({
        type: client.type,
        name: client.name,
        document: client.document,
        email: client.email,
        phone: client.phone,
        address: client.address,
        number: client.number,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        zip_code: client.zipCode
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Quotes
  async getQuotes(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
    
    return data.map(quote => ({
      id: quote.id,
      clientId: quote.client_id,
      client: {
        id: quote.clients.id,
        type: quote.clients.type as 'fisica' | 'juridica',
        name: quote.clients.name,
        document: quote.clients.document,
        email: quote.clients.email,
        phone: quote.clients.phone,
        address: quote.clients.address,
        number: quote.clients.number,
        neighborhood: quote.clients.neighborhood,
        city: quote.clients.city,
        state: quote.clients.state,
        zipCode: quote.clients.zip_code,
        createdAt: new Date(quote.clients.created_at)
      },
      number: quote.number,
      services: quote.services || [],
      products: quote.products || [],
      subtotal: quote.subtotal,
      discount: quote.discount,
      total: quote.total,
      status: quote.status as 'draft' | 'sent' | 'approved' | 'rejected',
      validUntil: new Date(quote.valid_until),
      notes: quote.notes,
      createdAt: new Date(quote.created_at),
      updatedAt: new Date(quote.updated_at)
    }));
  },

  async addQuote(quote: Quote): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .insert({
        id: quote.id,
        client_id: quote.clientId,
        number: quote.number,
        services: quote.services,
        products: quote.products,
        subtotal: quote.subtotal,
        discount: quote.discount,
        total: quote.total,
        status: quote.status,
        valid_until: quote.validUntil.toISOString().split('T')[0],
        notes: quote.notes,
        created_at: quote.createdAt.toISOString(),
        updated_at: quote.updatedAt.toISOString()
      });
    
    if (error) {
      console.error('Error adding quote:', error);
      throw error;
    }
  },

  async updateQuote(id: string, quote: Quote): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({
        client_id: quote.clientId,
        number: quote.number,
        services: quote.services,
        products: quote.products,
        subtotal: quote.subtotal,
        discount: quote.discount,
        total: quote.total,
        status: quote.status,
        valid_until: quote.validUntil.toISOString().split('T')[0],
        notes: quote.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  },

  async deleteQuote(id: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    
    return data.map(order => ({
      id: order.id,
      quoteId: order.quote_id || '',
      clientId: order.client_id,
      client: {
        id: order.clients.id,
        type: order.clients.type as 'fisica' | 'juridica',
        name: order.clients.name,
        document: order.clients.document,
        email: order.clients.email,
        phone: order.clients.phone,
        address: order.clients.address,
        number: order.clients.number,
        neighborhood: order.clients.neighborhood,
        city: order.clients.city,
        state: order.clients.state,
        zipCode: order.clients.zip_code,
        createdAt: new Date(order.clients.created_at)
      },
      number: order.number,
      services: order.services || [],
      products: order.products || [],
      total: order.total,
      status: order.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      createdAt: new Date(order.created_at),
      completedAt: order.completed_at ? new Date(order.completed_at) : undefined,
      isFromQuote: order.is_from_quote
    }));
  },

  async addOrder(order: Order): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .insert({
        id: order.id,
        quote_id: order.quoteId || null,
        client_id: order.clientId,
        number: order.number,
        services: order.services,
        products: order.products,
        total: order.total,
        status: order.status,
        created_at: order.createdAt.toISOString(),
        completed_at: order.completedAt?.toISOString(),
        is_from_quote: order.isFromQuote || false
      });
    
    if (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  },

  async updateOrder(id: string, order: Order): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({
        quote_id: order.quoteId || null,
        client_id: order.clientId,
        number: order.number,
        services: order.services,
        products: order.products,
        total: order.total,
        status: order.status,
        completed_at: order.completedAt?.toISOString(),
        is_from_quote: order.isFromQuote || false
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Clients
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    
    return data.map(client => ({
      id: client.id,
      type: client.type as 'fisica' | 'juridica',
      name: client.name,
      document: client.document,
      email: client.email,
      phone: client.phone,
      address: client.address,
      number: client.number,
      neighborhood: client.neighborhood,
      city: client.city,
      state: client.state,
      zipCode: client.zip_code,
      createdAt: new Date(client.created_at)
    }));
  },

  async addClient(client: Client): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .insert({
        id: client.id,
        type: client.type,
        name: client.name,
        document: client.document,
        email: client.email,
        phone: client.phone,
        address: client.address,
        number: client.number,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        zip_code: client.zipCode,
        created_at: client.createdAt.toISOString()
      });
    
    if (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  },

  async updateClient(id: string, client: Client): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({
        type: client.type,
        name: client.name,
        document: client.document,
        email: client.email,
        phone: client.phone,
        address: client.address,
        number: client.number,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        zip_code: client.zipCode
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Counters
  async getCounters(): Promise<Counters> {
    try {
      const { data, error } = await supabase
        .from('counters')
        .select('*')
        .maybeSingle();
        //.single();
      
      if (error) {
        throw error;
      }
      
      return {
        quote: data.quote_counter,
        order: data.order_counter
      };
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        return { quote: 1, order: 1 };
      }
      console.error('Error fetching counters:', error);
      return { quote: 1, order: 1 };
    }
  },

  async incrementCounter(type: 'quote' | 'order'): Promise<number> {
    const counters = await this.getCounters();
    const newValue = counters[type] + 1;
    
    const updateField = type === 'quote' ? 'quote_counter' : 'order_counter';
    
    const { error } = await supabase
      .from('counters')
      .upsert({
        [updateField]: newValue,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error incrementing counter:', error);
      throw error;
    }
    
    return newValue;
  },

  // Validation methods
  async isDocumentUnique(document: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('clients')
      .select('id')
      .eq('document', document);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking document uniqueness:', error);
      return false;
    }
    
    return data.length === 0;
  },

  async isEmailUnique(email: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('clients')
      .select('id')
      .eq('email', email.toLowerCase());
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking email uniqueness:', error);
      return false;
    }
    
    return data.length === 0;
  },

  async isUsernameUnique(username: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase());
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking username uniqueness:', error);
      return false;
    }
    
    return data.length === 0;
  },

  async isUserEmailUnique(email: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase());
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking user email uniqueness:', error);
      return false;
    }
    
    return data.length === 0;
  },

  async isStateCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('states')
      .select('id')
      .eq('code', code.toUpperCase());
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking state code uniqueness:', error);
      return false;
    }
    
    return data.length === 0;
  },

  async isStateNameUnique(name: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('states')
      .select('id')
      .eq('name', name);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking state name uniqueness:', error);
      return false;
    }
    
    return data.length === 0;
  },

  async isCityNameUnique(name: string, stateId: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('cities')
      .select('id')
      .eq('name', name)
      .eq('state_id', stateId);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking city name uniqueness:', error);
      return false;
    }
    
    return data.length === 0;
  }
};