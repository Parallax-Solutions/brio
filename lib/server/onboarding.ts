'use server';

import { Currency } from '@prisma/client';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { toStorageAmount } from '@/lib/utils/money';

interface OnboardingProfileData {
  name: string;
  baseCurrency: Currency;
  enabledCurrencies: Currency[];
}

interface OnboardingIncomeData {
  name: string;
  amount: number;
  currency: Currency;
  cadence: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY' | 'ONE_TIME';
  owner?: string;
}

interface OnboardingBalanceData {
  accountType: string;
  amount: number;
  currency: Currency;
  notes?: string;
}

/**
 * Get user's onboarding status
 */
export async function getOnboardingStatus() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      emailVerified: true,
      onboardingCompleted: true,
      name: true,
      baseCurrency: true,
      enabledCurrencies: true,
      _count: {
        select: {
          incomes: true,
          balanceSnapshots: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    emailVerified: !!user.emailVerified,
    profileComplete: !!user.name,
    hasIncome: user._count.incomes > 0,
    hasBalance: user._count.balanceSnapshots > 0,
    onboardingCompleted: user.onboardingCompleted,
    currentStep: !user.emailVerified
      ? 'verify-email'
      : !user.name
        ? 'profile'
        : user._count.incomes === 0
          ? 'income'
          : user._count.balanceSnapshots === 0
            ? 'balance'
            : 'complete',
  };
}

/**
 * Update user profile during onboarding
 */
export async function updateOnboardingProfile(data: OnboardingProfileData) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        baseCurrency: data.baseCurrency,
        enabledCurrencies: data.enabledCurrencies,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Add income during onboarding
 */
export async function addOnboardingIncome(data: OnboardingIncomeData) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const storageAmount = toStorageAmount(data.amount, data.currency);

    await db.income.create({
      data: {
        userId: session.user.id,
        name: data.name,
        amount: storageAmount,
        currency: data.currency,
        cadence: data.cadence,
        owner: data.owner || null,
        active: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding income:', error);
    return { success: false, error: 'Failed to add income' };
  }
}

/**
 * Add balance during onboarding
 */
export async function addOnboardingBalance(data: OnboardingBalanceData) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const storageAmount = toStorageAmount(data.amount, data.currency);

    await db.balanceSnapshot.create({
      data: {
        userId: session.user.id,
        accountType: data.accountType,
        amount: storageAmount,
        currency: data.currency,
        notes: data.notes || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding balance:', error);
    return { success: false, error: 'Failed to add balance' };
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify all requirements are met
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      emailVerified: true,
      name: true,
      _count: {
        select: {
          incomes: true,
          balanceSnapshots: true,
        },
      },
    },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (!user.emailVerified) {
    return { success: false, error: 'Email not verified' };
  }

  if (!user.name) {
    return { success: false, error: 'Profile not complete' };
  }

  if (user._count.incomes === 0) {
    return { success: false, error: 'At least one income required' };
  }

  if (user._count.balanceSnapshots === 0) {
    return { success: false, error: 'At least one balance required' };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { success: false, error: 'Failed to complete onboarding' };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, emailVerified: true },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.emailVerified) {
    return { success: false, error: 'Email already verified' };
  }

  // Import dynamically to avoid circular dependency
  const { sendVerificationEmail } = await import('./email');
  return sendVerificationEmail(user.email, session.user.id, user.name);
}
