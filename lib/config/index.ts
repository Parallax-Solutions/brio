// Configuration exports
export { db } from './db';
export { supabase, AVATARS_BUCKET, AVATARS_FOLDER, getAvatarUrl, isSupabaseConfigured } from './supabase';
// Note: auth exports need to be imported directly from './auth' due to NextAuth requirements
