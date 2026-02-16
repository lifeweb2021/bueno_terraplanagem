import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthSession {
  user: User;
  session: any;
}

export const supabaseAuth = {
  // Sign up new user using Supabase Auth
  async signUp(email: string, password: string, metadata: any = {}) {
    try {
      console.log('Creating new user with Supabase Auth:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          data: {
            name: metadata.name || email.split('@')[0],
            username: metadata.username || email.split('@')[0],
            role: metadata.role || 'user'
          }
        }
      });

      if (error) {
        console.error('Supabase Auth signup error:', error);
        throw new Error(error.message);
      }

      console.log('User created successfully with Supabase Auth:', data);
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('SignUp error:', error);
      throw error;
    }
  },

  // Sign in user using Supabase Auth
  async signIn(email: string, password: string) {
    try {
      console.log('Attempting login with Supabase Auth for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      });

      if (error) {
        console.error('Supabase Auth signin error:', error);
        throw new Error('Email ou senha incorretos');
      }

      if (!data.user) {
        console.log('No user returned from Supabase Auth');
        throw new Error('Email ou senha incorretos');
      }

      console.log('Login successful with Supabase Auth:', data.user.email);
      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        throw error;
      }
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Signout error:', error);
      throw error;
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Get session error:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Get user error:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};