'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, ArrowRight } from 'lucide-react';
import { Currency } from '@prisma/client';

import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from '@/lib/i18n/context';
import { updateOnboardingProfile } from '@/lib/server/onboarding';
import { toast } from 'sonner';
import { getCurrencyDisplay } from '@/lib/utils/money';

interface ProfileStepProps {
  onComplete: () => void;
}

const CURRENCIES: Currency[] = ['CRC', 'USD', 'CAD'];

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  baseCurrency: z.nativeEnum(Currency),
  enabledCurrencies: z.array(z.nativeEnum(Currency)).min(1, 'Select at least one currency'),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileStep({ onComplete }: ProfileStepProps) {
  const t = useTranslations('onboarding');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      baseCurrency: 'CRC',
      enabledCurrencies: ['CRC'],
    },
  });

  const baseCurrency = form.watch('baseCurrency');
  const enabledCurrencies = form.watch('enabledCurrencies');

  // Ensure base currency is always in enabled currencies
  const handleBaseCurrencyChange = (value: Currency) => {
    form.setValue('baseCurrency', value);
    const current = form.getValues('enabledCurrencies');
    if (!current.includes(value)) {
      form.setValue('enabledCurrencies', [...current, value]);
    }
  };

  const handleCurrencyToggle = (currency: Currency, checked: boolean) => {
    const current = form.getValues('enabledCurrencies');
    if (checked) {
      form.setValue('enabledCurrencies', [...current, currency]);
    } else {
      // Don't allow removing base currency
      if (currency === baseCurrency) return;
      form.setValue('enabledCurrencies', current.filter(c => c !== currency));
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const result = await updateOnboardingProfile(data);
    setIsSubmitting(false);

    if (result.success) {
      onComplete();
    } else {
      toast.error(result.error || 'Failed to save profile');
    }
  };

  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t('setupProfile')}</CardTitle>
        <CardDescription>{t('setupProfileDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('displayName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('displayNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('baseCurrency')}</FormLabel>
                  <Select onValueChange={handleBaseCurrencyChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectBaseCurrency')} />
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
                  <FormDescription>{t('baseCurrencyHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enabledCurrencies"
              render={() => (
                <FormItem>
                  <FormLabel>{t('enabledCurrencies')}</FormLabel>
                  <FormDescription>{t('enabledCurrenciesHint')}</FormDescription>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {CURRENCIES.map((currency) => (
                      <div
                        key={currency}
                        className={`flex items-center space-x-2 rounded-lg border p-3 transition-colors ${
                          enabledCurrencies.includes(currency)
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <Checkbox
                          id={currency}
                          checked={enabledCurrencies.includes(currency)}
                          onCheckedChange={(checked) => handleCurrencyToggle(currency, !!checked)}
                          disabled={currency === baseCurrency}
                        />
                        <label
                          htmlFor={currency}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {getCurrencyDisplay(currency)}
                        </label>
                      </div>
                    ))}
                  </div>
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
