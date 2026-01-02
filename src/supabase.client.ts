import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Default Kleo Protocol Supabase credentials
 * These are bundled with the SDK - users don't need to configure anything
 */
const KLEO_SUPABASE_URL = 'https://kxtetanstdiiodlztvfe.supabase.co';
const KLEO_SUPABASE_ANON_KEY = 'sb_publishable_7RmWogQzwj_X5K2YWtAGRQ_KAFhj5s3';

/**
 * Create a Supabase client with the provided credentials or SDK defaults
 * @param url - Supabase project URL (defaults to Kleo's Supabase)
 * @param anonKey - Supabase anonymous key (defaults to Kleo's key)
 * @returns SupabaseClient instance
 */
export function createSupabaseClient(
  url?: string,
  anonKey?: string
): SupabaseClient {
  const supabaseUrl = url || KLEO_SUPABASE_URL;
  const supabaseAnonKey = anonKey || KLEO_SUPABASE_ANON_KEY;

  return createClient(supabaseUrl, supabaseAnonKey);
}