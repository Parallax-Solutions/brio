'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Mail, RefreshCw } from 'lucide-react';

import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/lib/i18n/context';
import { resendVerificationEmail } from '@/lib/server/onboarding';
import { verifyEmailCode } from '@/lib/server/email';
import { toast } from 'sonner';

interface VerifyEmailStepProps {
  onComplete: () => void;
}

export function VerifyEmailStep({ onComplete }: VerifyEmailStepProps) {
  const { update: updateSession } = useSession();
  const t = useTranslations('onboarding');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Send initial verification email only once
    if (!emailSent) {
      setEmailSent(true);
      handleResend(true);
    }
  }, [emailSent]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async (initial = false) => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    const result = await resendVerificationEmail();
    setIsResending(false);

    if (result.success) {
      if (!initial) {
        toast.success(t('codeSent'));
      }
      setResendCooldown(60);
    } else {
      toast.error(result.error || t('sendError'));
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      
      // Auto-submit if complete
      if (newCode.every(d => d !== '')) {
        handleVerify(newCode.join(''));
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if complete
    if (newCode.every(d => d !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeString?: string) => {
    const verificationCode = codeString || code.join('');
    if (verificationCode.length !== 6) return;

    setIsVerifying(true);
    const result = await verifyEmailCode(verificationCode);
    setIsVerifying(false);

    if (result.success) {
      toast.success(t('emailVerified'));
      // Trigger session update to reflect email verified status
      await updateSession();
      onComplete();
    } else {
      toast.error(result.error || t('invalidCode'));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t('verifyEmail')}</CardTitle>
        <CardDescription>{t('verifyEmailDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Code inputs */}
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-14 w-12 text-center text-2xl font-bold"
              disabled={isVerifying}
            />
          ))}
        </div>

        {/* Verify button */}
        <Button
          onClick={() => handleVerify()}
          disabled={code.some(d => !d) || isVerifying}
          className="w-full"
          size="lg"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('verifying')}
            </>
          ) : (
            t('verify')
          )}
        </Button>

        {/* Resend */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleResend()}
            disabled={resendCooldown > 0 || isResending}
          >
            {isResending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {resendCooldown > 0
              ? `${t('resendIn')} ${resendCooldown}s`
              : t('resendCode')}
          </Button>
        </div>
      </CardContent>
    </>
  );
}
