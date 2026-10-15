import { createClient } from '@supabase/supabase-js';

// Project Credentials provided by user
export const SUPABASE_PROJECT_ID = 'ojwrjvepkpjaumsdzgdm';
export const SUPABASE_DEFAULT_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_DEFAULT_KEY = 'sb_publishable_owB0t6la0Wk3k1nTbgrrlQ_vXs8Gw5y';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export type SupabaseConnectionStatus = 'connected' | 'checking' | 'tables_missing' | 'error';

/**
 * Health check to verify whether Supabase endpoint is live and if candidates table is reachable
 */
export async function checkSupabaseConnection(): Promise<{
  status: SupabaseConnectionStatus;
  message: string;
  tablesReady: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('id')
      .limit(1);

    if (error) {
      // PGRST205 indicates table does not exist in schema cache
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return {
          status: 'tables_missing',
          message: 'Supabase connected! PostgreSQL tables need to be created using the provided SQL script.',
          tablesReady: false
        };
      }
      return {
        status: 'error',
        message: `Supabase returned error: ${error.message} (${error.code})`,
        tablesReady: false
      };
    }

    return {
      status: 'connected',
      message: 'Supabase cloud database connected & synchronized in real-time.',
      tablesReady: true
    };
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'Could not reach Supabase endpoint',
      tablesReady: false
    };
  }
}
