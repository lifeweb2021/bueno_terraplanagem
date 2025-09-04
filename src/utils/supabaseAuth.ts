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
    try {
      // Check if admin user exists
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'admin')
        .limit(1);

      if (!existingUsers || existingUsers.length === 0) {
        // Create admin user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: 'admin@sistema.com',
          password: 'admin123',
          options: {
            data: {
              name: 'Administrador',
              username: 'admin',
              role: 'admin'
            }
          }
        });

        if (authError) {
          console.error('Error creating admin user:', authError);
          return;
        }

        // Also create in users table
        if (authData.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              username: 'admin',
              password: 'hashed_admin123', // Placeholder since we use Supabase auth
              name: 'Administrador',
              email: 'admin@sistema.com',
              role: 'admin',
              is_active: true
            });

          if (userError) {
            console.error('Error creating user record:', userError);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing default user:', error);
    }
  }
};