'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  User, 
  DollarSign, 
  PiggyBank, 
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslations } from '@/lib/i18n/context';
import { getOnboardingStatus, completeOnboarding } from '@/lib/server/onboarding';

import { VerifyEmailStep } from './steps/verify-email';
import { ProfileStep } from './steps/profile';
import { IncomeStep } from './steps/income';
import { BalanceStep } from './steps/balance';

const STEPS = [
  { id: 'verify-email', icon: Mail, label: 'Verify Email' },
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'income', icon: DollarSign, label: 'Income' },
  { id: 'balance', icon: PiggyBank, label: 'Balance' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const t = useTranslations('onboarding');
  const [currentStep, setCurrentStep] = useState<string>('verify-email');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const status = await getOnboardingStatus();
    if (status) {
      if (status.onboardingCompleted) {
        router.push('/dashboard');
        return;
      }
      setCurrentStep(status.currentStep);
    }
    setIsLoading(false);
  };

  const handleStepComplete = async () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    } else {
      // Complete onboarding
      setIsCompleting(true);
      const result = await completeOnboarding();
      if (result.success) {
        // Trigger session update to refresh the JWT token with onboardingCompleted: true
        await updateSession();
        // Use hard navigation to ensure proxy picks up the new token
        window.location.href = '/dashboard';
      } else {
        setIsCompleting(false);
      }
    }
  };

  const currentIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-3">
        <div className="flex justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isComplete = index < currentIndex;
            
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-primary' : isComplete ? 'text-primary/60' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isComplete
                        ? 'border-primary/60 bg-primary/20'
                        : 'border-muted'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.label}</span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            {currentStep === 'verify-email' && (
              <VerifyEmailStep onComplete={handleStepComplete} />
            )}
            {currentStep === 'profile' && (
              <ProfileStep onComplete={handleStepComplete} />
            )}
            {currentStep === 'income' && (
              <IncomeStep onComplete={handleStepComplete} />
            )}
            {currentStep === 'balance' && (
              <BalanceStep onComplete={handleStepComplete} isCompleting={isCompleting} />
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
