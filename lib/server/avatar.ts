'use server';

import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { revalidatePath } from 'next/cache';
import { supabase, AVATARS_BUCKET, AVATARS_FOLDER, getAvatarUrl, isSupabaseConfigured } from '@/lib/config/supabase';

// Allowed file types for avatar upload
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadAvatar(formData: FormData) {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Avatar upload is not configured. Please set up Supabase.' };
  }

  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const file = formData.get('avatar') as File | null;
  
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File too large. Maximum size is 5MB.' };
  }

  try {
    // Get current user to check for existing avatar
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    // Delete existing avatar if present
    if (currentUser?.avatarUrl) {
      await supabase.storage
        .from(AVATARS_BUCKET)
        .remove([currentUser.avatarUrl]);
    }

    // Generate unique file path with folder
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${AVATARS_FOLDER}/${session.user.id}/${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return { success: false, error: 'Failed to upload avatar' };
    }

    // Update user's avatarUrl in database
    await db.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: fileName },
    });

    revalidatePath('/profile');
    
    return { 
      success: true, 
      avatarUrl: getAvatarUrl(fileName),
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return { success: false, error: 'Failed to upload avatar' };
  }
}

export async function deleteAvatar() {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Avatar management is not configured.' };
  }

  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get current user's avatar
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    if (!user?.avatarUrl) {
      return { success: true }; // No avatar to delete
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove([user.avatarUrl]);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      // Continue anyway to clear the database reference
    }

    // Clear avatarUrl in database
    await db.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: null },
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error('Avatar delete error:', error);
    return { success: false, error: 'Failed to delete avatar' };
  }
}
