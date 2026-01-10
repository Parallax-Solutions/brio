import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase client - may be null if environment variables are not configured
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => supabase !== null;

// Storage bucket name and folder for avatars
export const AVATARS_BUCKET = 'Our App';
export const AVATARS_FOLDER = 'budget-images';

/**
 * Get the public URL for an avatar
 * @param path - The file path in the avatars bucket
 * @returns The public URL for the avatar, or null if Supabase is not configured
 */
export function getAvatarUrl(path: string | null): string | null {
  if (!path || !supabase) return null;
  
  const { data } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(path);
  
  return data.publicUrl;
}
