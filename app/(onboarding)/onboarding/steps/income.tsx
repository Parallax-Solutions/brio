'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, DollarSign, ArrowRight } from 'lucide-react';
import { Currency, IncomeCadence } from '@prisma/client';

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
import { addOnboardingIncome } from '@/lib/server/onboarding';
import { toast } from 'sonner';
import { getCurrencyDisplay } from '@/lib/utils/money';

interface IncomeStepProps {
  onComplete: () => void;
}

const CURRENCIES: Currency[] = ['CRC', 'USD', 'CAD'];
const CADENCES: IncomeCadence[] = ['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ONE_TIME'];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.nativeEnum(Currency),
  cadence: z.nativeEnum(IncomeCadence),
  owner: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function IncomeStep({ onComplete }: IncomeStepProps) {
  const t = useTranslations('onboarding');
  const tIncome = useTranslations('income');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      amount: '',
      currency: 'CRC',
      cadence: 'MONTHLY',
      owner: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const result = await addOnboardingIncome({
      name: data.name,
      amount: parseFloat(data.amount),
      currency: data.currency,
      cadence: data.cadence,
      owner: data.owner,
    });
    setIsSubmitting(false);

    if (result.success) {
      onComplete();
    } else {
      toast.error(result.error || 'Failed to add income');
    }
  };

  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <DollarSign className="h-8 w-8 text-emerald-500" />
        </div>
        <CardTitle className="text-2xl">{t('addIncome')}</CardTitle>
        <CardDescription>{t('addIncomeDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tIncome('name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('incomeNamePlaceholder')} {...field} />
                  </FormControl>
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
                    <FormLabel>{tIncome('amount')}</FormLabel>
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
                    <FormLabel>{tIncome('currency')}</FormLabel>
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
              name="cadence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tIncome('cadence')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CADENCES.map((cadence) => (
                        <SelectItem key={cadence} value={cadence}>
                          {tIncome(cadence.toLowerCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tIncome('owner')} ({t('optional')})</FormLabel>
                  <FormControl>
                    <Input placeholder={t('ownerPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {t('continue')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  );
}
