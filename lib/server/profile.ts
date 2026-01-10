'use server';

import { z } from 'zod';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { revalidatePath } from 'next/cache';
import { Currency, Theme } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getAvatarUrl } from '@/lib/config/supabase';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

const updatePreferencesSchema = z.object({
  theme: z.nativeEnum(Theme),
  accentColor: z.enum(['blue', 'emerald', 'violet', 'rose', 'amber', 'coral']),
  locale: z.enum(['en', 'es']),
  baseCurrency: z.nativeEnum(Currency),
});

// Password must be 8+ chars with uppercase, lowercase, and special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{8,}$/;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export async function updateProfile(data: UpdateProfileInput) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    });

    revalidatePath('/profile');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update profile' };
  }
}

export async function updatePreferences(data: UpdatePreferencesInput) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updatePreferencesSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        theme: parsed.data.theme,
        accentColor: parsed.data.accentColor,
        locale: parsed.data.locale,
        baseCurrency: parsed.data.baseCurrency,
      },
    });

    revalidatePath('/profile');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update preferences' };
  }
}

export async function changePassword(data: ChangePasswordInput) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // OAuth users don't have a password - use setPassword instead
    if (!user.passwordHash) {
      return { success: false, error: 'Use "Set Password" to add a password to your OAuth account' };
    }

    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to change password' };
  }
}

const setPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

/**
 * Set password for OAuth users who don't have one yet.
 * This allows them to also sign in with email/password.
 */
export async function setPassword(data: SetPasswordInput) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = setPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Only allow setting password if user doesn't already have one
    if (user.passwordHash) {
      return { success: false, error: 'You already have a password. Use "Change Password" instead.' };
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to set password' };
  }
}

export async function getUserProfile() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      image: true, // Google OAuth profile image
      passwordHash: true, // To check if OAuth user
      baseCurrency: true,
      theme: true,
      accentColor: true,
      locale: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  // Priority: Custom avatar > Google image > null
  const avatarPublicUrl = getAvatarUrl(user.avatarUrl) || user.image || null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    avatarPublicUrl,
    baseCurrency: user.baseCurrency,
    theme: user.theme,
    accentColor: user.accentColor,
    locale: user.locale,
    createdAt: user.createdAt,
    isOAuthUser: !user.passwordHash, // True if originally signed up via OAuth (no password set)
    hasPassword: !!user.passwordHash, // True if user has a password (can sign in with email/password)
  };
}

const updateLocaleSchema = z.object({
  locale: z.enum(['en', 'es']),
});

export type UpdateLocaleInput = z.infer<typeof updateLocaleSchema>;

export async function updateLocale(data: UpdateLocaleInput) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updateLocaleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { locale: parsed.data.locale },
    });

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update locale' };
  }
}

const updateThemeSchema = z.object({
  theme: z.nativeEnum(Theme),
});

export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;

export async function updateTheme(data: UpdateThemeInput) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updateThemeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { theme: parsed.data.theme },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update theme' };
  }
}

const updateAccentColorSchema = z.object({
  accentColor: z.enum(['blue', 'emerald', 'violet', 'rose', 'amber', 'coral']),
});

export type UpdateAccentColorInput = z.infer<typeof updateAccentColorSchema>;

export async function updateAccentColor(data: UpdateAccentColorInput) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updateAccentColorSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { accentColor: parsed.data.accentColor },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update accent color' };
  }
}
