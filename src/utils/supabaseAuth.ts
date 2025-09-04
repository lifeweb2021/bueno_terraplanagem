import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthSession {
  user: User;
  session: any;
}

export const supabaseAuth = {
  // Authenticate user against database
  async signIn(email: string, password: string) {
    try {
      console.log('Attempting login for:', email);
      
      // Query user from database
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Database query error:', error);
        throw new Error('Erro ao consultar usuário');
      }

      if (!users || users.length === 0) {
        console.log('User not found');
        throw new Error('Email ou senha incorretos');
      }

      const user = users[0];
      console.log('User found:', { id: user.id, email: user.email, name: user.name });

      // Simple password comparison (in production, use proper hashing)
      if (user.password !== password) {
        console.log('Password mismatch');
        throw new Error('Email ou senha incorretos');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      console.log('Login successful');
      return {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            name: user.name,
            username: user.username
          }
        },
        session: {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: {
              name: user.name,
              username: user.username
            }
          }
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Sign out user
  async signOut() {
    // Simple logout - just clear local session
    console.log('User signed out');
  },

  // Get current session
  async getSession() {
    // For now, return null as we're not using Supabase auth sessions
    return null;
  },

  // Get current user
  async getCurrentUser() {
    // For now, return null as we're not using Supabase auth
    return null;
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Not using Supabase auth state changes
    return { data: { subscription: null }, error: null };
  }
};