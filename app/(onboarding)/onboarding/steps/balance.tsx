'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PiggyBank, CheckCircle2 } from 'lucide-react';
import { Currency } from '@prisma/client';

import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from '@/lib/i18n/context';
import { addOnboardingBalance } from '@/lib/server/onboarding';
import { toast } from 'sonner';
import { getCurrencyDisplay } from '@/lib/utils/money';

interface BalanceStepProps {
  onComplete: () => void;
  isCompleting?: boolean;
}

const CURRENCIES: Currency[] = ['CRC', 'USD', 'CAD'];
const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT', 'OTHER'];

const formSchema = z.object({
  accountType: z.string().min(1, 'Account type is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.nativeEnum(Currency),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function BalanceStep({ onComplete, isCompleting }: BalanceStepProps) {
  const t = useTranslations('onboarding');
  const tSavings = useTranslations('savings');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountType: 'CHECKING',
      amount: '',
      currency: 'CRC',
      notes: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const result = await addOnboardingBalance({
      accountType: data.accountType,
      amount: parseFloat(data.amount),
      currency: data.currency,
      notes: data.notes,
    });
    setIsSubmitting(false);

    if (result.success) {
      onComplete();
    } else {
      toast.error(result.error || 'Failed to add balance');
    }
  };

  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
          <PiggyBank className="h-8 w-8 text-blue-500" />
        </div>
        <CardTitle className="text-2xl">{t('addBalance')}</CardTitle>
        <CardDescription>{t('addBalanceDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tSavings('accountType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(type.toLowerCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('currentBalance')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tSavings('currency')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {getCurrencyDisplay(currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notes')} ({t('optional')})</FormLabel>
                  <FormControl>
                    <Input placeholder={t('notesPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isSubmitting || isCompleting} 
              className="w-full" 
              size="lg"
            >
              {isSubmitting || isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCompleting ? t('completing') : t('saving')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('completeSetup')}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  );
}
