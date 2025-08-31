import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please check your .env file or click "Connect to Supabase" button.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase.auth.session',
    storage: localStorage
  }
});

export type Profile = Database['public']['Tables']['users_profile']['Row'];

export const initializeAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};