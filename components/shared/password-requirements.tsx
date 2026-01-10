'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTranslations } from '@/lib/i18n/context';

export interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasSpecialChar: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const validation = validatePassword(password);
  return Object.values(validation).every(Boolean);
}

interface PasswordRequirementsProps {
  password: string;
  className?: string;
  showOnlyWhenTyping?: boolean;
}

export function PasswordRequirements({ 
  password, 
  className,
  showOnlyWhenTyping = true 
}: PasswordRequirementsProps) {
  const t = useTranslations('auth');
  const validation = validatePassword(password);
  
  // Don't show if no password entered and showOnlyWhenTyping is true
  if (showOnlyWhenTyping && !password) {
    return null;
  }

  const requirements = [
    { key: 'minLength', label: t('passwordMinLength'), met: validation.minLength },
    { key: 'hasUppercase', label: t('passwordUppercase'), met: validation.hasUppercase },
    { key: 'hasLowercase', label: t('passwordLowercase'), met: validation.hasLowercase },
    { key: 'hasSpecialChar', label: t('passwordSpecialChar'), met: validation.hasSpecialChar },
  ];

  const allMet = requirements.every(r => r.met);

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      <p className="text-muted-foreground font-medium">{t('passwordRequirements')}:</p>
      <ul className="space-y-1.5">
        {requirements.map(({ key, label, met }) => (
          <li
            key={key}
            className={cn(
              'flex items-center gap-2 transition-colors duration-200',
              met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
            )}
          >
            <span className={cn(
              'flex h-4 w-4 items-center justify-center rounded-full transition-all duration-200',
              met 
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-muted text-muted-foreground'
            )}>
              {met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </span>
            <span className={cn(met && 'font-medium')}>{label}</span>
          </li>
        ))}
      </ul>
      {allMet && (
        <p className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 pt-1">
          <Check className="h-4 w-4" />
          {t('passwordStrong')}
        </p>
      )}
    </div>
  );
}
