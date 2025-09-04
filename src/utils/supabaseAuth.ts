import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthSession {
  user: User;
  session: any;
}

export const supabaseAuth = {
  // Sign up new user
  async signUp(email: string, password: string, userData: { name: string; username: string; role?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          username: userData.username,
          role: userData.role || 'user'
        }
      }
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    return data;
  },

  // Sign in user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }

    return user;
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Initialize default admin user
  async initializeDefaultUser() {
    // Admin user should be created manually in Supabase dashboard
    // or through the user management interface after initial setup
    console.log('Admin user initialization skipped - use manual creation');
  },

  // Authenticate user against database
  async authenticateUser(email: string, password: string) {
    try {
      console.log('Attempting to authenticate:', email);
      
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Error fetching user:', error);
        throw new Error('Erro ao verificar credenciais');
      }

      console.log('Users found:', users);

      if (!users || users.length === 0) {
        throw new Error('Email ou senha incorretos');
      }

      const user = users[0];
      console.log('User data:', user);
      
      // Simple password verification - direct comparison
      const isPasswordValid = user.password === password;
      console.log('Password check:', { provided: password, stored: user.password, valid: isPasswordValid });

      if (!isPasswordValid) {
        throw new Error('Email ou senha incorretos');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Return user data in the expected format
      return {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            name: user.name,
            username: user.username,
            role: 'user'
          }
        },
        session: {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: {
              name: user.name,
              username: user.username,
              role: 'user'
            }
          }
        }
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }
};