import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get user profile from Supabase
 */
export async function getProfile(supabase: SupabaseClient, userAddress: string): Promise<any[]> {
  const { data, error } = await supabase.from('users').select().eq('address', userAddress);

  if (error) {
    throw new Error(`Error fetching profile: ${error.message}`);
  }

  return data || [];
}

/**
 * Insert a new user profile into Supabase
 */
export async function insertProfile(
  supabase: SupabaseClient,
  userAddress: string,
  name: string
): Promise<void> {
  const { error } = await supabase.from('users').insert({ address: userAddress, name: name });

  if (error) {
    throw new Error(`Error inserting profile: ${error.message}`);
  }
}

/**
 * Update an existing user profile in Supabase
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userAddress: string,
  name: string
): Promise<void> {
  const { error } = await supabase.from('users').update({ name: name }).eq('address', userAddress);

  if (error) {
    throw new Error(`Error updating profile: ${error.message}`);
  }
}
