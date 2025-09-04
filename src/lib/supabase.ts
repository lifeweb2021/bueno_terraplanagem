import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          password: string;
          name: string;
          email: string;
          role: 'admin' | 'user';
          is_active: boolean;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
          name: string;
          email: string;
          role?: 'admin' | 'user';
          is_active?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
          name?: string;
          email?: string;
          role?: 'admin' | 'user';
          is_active?: boolean;
          created_at?: string;
          last_login?: string | null;
        };
      };
      company_settings: {
        Row: {
          id: string;
          company_name: string;
          cnpj: string;
          address: string;
          neighborhood: string;
          city: string;
          state: string;
          zip_code: string;
          phone: string;
          whatsapp: string;
          email: string;
          logo: string;
          email_settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          cnpj: string;
          address?: string;
          neighborhood?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          phone: string;
          whatsapp?: string;
          email: string;
          logo?: string;
          email_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          cnpj?: string;
          address?: string;
          neighborhood?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          phone?: string;
          whatsapp?: string;
          email?: string;
          logo?: string;
          email_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      states: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
        };
      };
      cities: {
        Row: {
          id: string;
          name: string;
          state_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          state_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          state_id?: string;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          type: 'fisica' | 'juridica';
          name: string;
          document: string;
          email: string;
          phone: string;
          address: string;
          number: string;
          neighborhood: string;
          city: string;
          state: string;
          zip_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'fisica' | 'juridica';
          name: string;
          document: string;
          email: string;
          phone: string;
          address?: string;
          number?: string;
          neighborhood?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'fisica' | 'juridica';
          name?: string;
          document?: string;
          email?: string;
          phone?: string;
          address?: string;
          number?: string;
          neighborhood?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          created_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          client_id: string;
          number: string;
          services: any;
          products: any;
          subtotal: number;
          discount: number;
          total: number;
          status: 'draft' | 'sent' | 'approved' | 'rejected';
          valid_until: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          number: string;
          services?: any;
          products?: any;
          subtotal: number;
          discount?: number;
          total: number;
          status?: 'draft' | 'sent' | 'approved' | 'rejected';
          valid_until: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          number?: string;
          services?: any;
          products?: any;
          subtotal?: number;
          discount?: number;
          total?: number;
          status?: 'draft' | 'sent' | 'approved' | 'rejected';
          valid_until?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          quote_id: string | null;
          client_id: string;
          number: string;
          services: any;
          products: any;
          total: number;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          created_at: string;
          completed_at: string | null;
          is_from_quote: boolean;
        };
        Insert: {
          id?: string;
          quote_id?: string | null;
          client_id: string;
          number: string;
          services?: any;
          products?: any;
          total: number;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          completed_at?: string | null;
          is_from_quote?: boolean;
        };
        Update: {
          id?: string;
          quote_id?: string | null;
          client_id?: string;
          number?: string;
          services?: any;
          products?: any;
          total?: number;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          completed_at?: string | null;
          is_from_quote?: boolean;
        };
      };
      counters: {
        Row: {
          id: string;
          quote_counter: number;
          order_counter: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_counter?: number;
          order_counter?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_counter?: number;
          order_counter?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}