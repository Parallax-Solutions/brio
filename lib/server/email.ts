'use server';

import { Resend } from 'resend';
import { db } from '@/lib/config/db';
import { VerificationType } from '@prisma/client';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'Budget App <onboarding@resend.dev>';

/**
 * Generate a 6-digit verification code
 */
function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create and store a verification code for a user
 */
export async function createVerificationCode(
  userId: string,
  type: VerificationType,
  expiresInMinutes: number = 10
): Promise<string> {
  // Invalidate any existing unused codes of this type
  await db.verificationCode.updateMany({
    where: {
      userId,
      type,
      used: false,
    },
    data: {
      used: true,
    },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await db.verificationCode.create({
    data: {
      userId,
      code,
      type,
      expiresAt,
    },
  });

  return code;
}

/**
 * Verify a code and mark it as used
 */
export async function verifyCode(
  userId: string,
  code: string,
  type: VerificationType
): Promise<{ success: boolean; error?: string }> {
  const verificationCode = await db.verificationCode.findFirst({
    where: {
      userId,
      code,
      type,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verificationCode) {
    return { success: false, error: 'Invalid or expired code' };
  }

  // Mark as used
  await db.verificationCode.update({
    where: { id: verificationCode.id },
    data: { used: true },
  });

  return { success: true };
}

/**
 * Send email verification code
 */
export async function sendVerificationEmail(
  email: string,
  userId: string,
  userName?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const code = await createVerificationCode(userId, 'EMAIL_VERIFICATION', 15);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your email - Budget App',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111827; color: #ffffff; padding: 40px 20px; margin: 0;">
            <div style="max-width: 480px; margin: 0 auto; background: #1f2937; border-radius: 16px; padding: 40px; border: 1px solid #374151;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; display: inline-block; line-height: 64px; font-size: 28px;">
                  💰
                </div>
                <h1 style="margin: 16px 0 8px; font-size: 24px; font-weight: 700; color: #ffffff;">Budget App</h1>
                <p style="margin: 0; color: #9ca3af; font-size: 14px;">Costa Rica 🇨🇷</p>
              </div>
              
              <h2 style="margin: 0 0 16px; font-size: 20px; text-align: center; color: #ffffff;">Verify your email</h2>
              <p style="margin: 0 0 24px; color: #d1d5db; text-align: center; font-size: 14px;">
                ${userName ? `Hey ${userName}! ` : ''}Enter this code to verify your email address:
              </p>
              
              <div style="background: #ffffff; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace; color: #111827;">
                  ${code}
                </div>
              </div>
              
              <p style="margin: 0; color: #9ca3af; text-align: center; font-size: 12px;">
                This code expires in 15 minutes.<br>
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Email service unavailable' };
  }
}

/**
 * Send sign-in OTP code
 */
export async function sendSignInCode(
  email: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const code = await createVerificationCode(userId, 'SIGN_IN', 5);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your sign-in code - Budget App',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111827; color: #ffffff; padding: 40px 20px; margin: 0;">
            <div style="max-width: 480px; margin: 0 auto; background: #1f2937; border-radius: 16px; padding: 40px; border: 1px solid #374151;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; display: inline-block; line-height: 64px; font-size: 28px;">
                  💰
                </div>
                <h1 style="margin: 16px 0 8px; font-size: 24px; font-weight: 700; color: #ffffff;">Budget App</h1>
              </div>
              
              <h2 style="margin: 0 0 16px; font-size: 20px; text-align: center; color: #ffffff;">Your sign-in code</h2>
              <p style="margin: 0 0 24px; color: #d1d5db; text-align: center; font-size: 14px;">
                Enter this code to sign in to your account:
              </p>
              
              <div style="background: #ffffff; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace; color: #111827;">
                  ${code}
                </div>
              </div>
              
              <p style="margin: 0; color: #9ca3af; text-align: center; font-size: 12px;">
                This code expires in 5 minutes.<br>
                If you didn't request this, someone may be trying to access your account.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Email service unavailable' };
  }
}

/**
 * Verify email and mark user as verified (uses session for userId)
 */
export async function verifyEmailCode(
  code: string
): Promise<{ success: boolean; error?: string }> {
  const { getServerAuthSession } = await import('@/lib/get-server-session');
  const session = await getServerAuthSession();
  
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = session.user.id;
  const result = await verifyCode(userId, code, 'EMAIL_VERIFICATION');

  if (!result.success) {
    return result;
  }

  // Mark email as verified
  await db.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return { success: true };
}

/**
 * Verify sign-in code
 */
export async function verifySignInCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  return verifyCode(userId, code, 'SIGN_IN');
}
