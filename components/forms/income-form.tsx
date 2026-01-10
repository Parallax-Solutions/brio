'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

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
import { Currency, IncomeCadence } from '@prisma/client';
import { getCurrencyDisplay, toDisplayAmount } from '@/lib/utils/money';
import { createIncome, updateIncome } from '@/lib/server/incomes';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.nativeEnum(Currency),
  cadence: z.nativeEnum(IncomeCadence),
  owner: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Income {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  cadence: IncomeCadence;
  owner: string | null;
  active: boolean;
}

interface IncomeFormProps {
  income?: Income;
  onSuccess?: () => void;
}

const CADENCES: IncomeCadence[] = ['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ONE_TIME'];
const CURRENCIES: Currency[] = ['CRC', 'USD', 'CAD'];

export function IncomeForm({ income, onSuccess }: IncomeFormProps) {
  const t = useTranslations('income');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: income?.name || '',
      amount: income ? toDisplayAmount(income.amount, income.currency).toString() : '',
      currency: income?.currency || 'CRC',
      cadence: income?.cadence || 'MONTHLY',
      owner: income?.owner || '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      const payload = {
        name: data.name,
        amount: parseFloat(data.amount),
        currency: data.currency,
        cadence: data.cadence,
        owner: data.owner || null,
      };

      const result = income 
        ? await updateIncome(income.id, payload)
        : await createIncome(payload);

      if (result.success) {
        toast.success(t('saved'));
        onSuccess?.();
      } else {
        toast.error(result.error || tCommon('error'));
      }
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('namePlaceholder')} {...field} />
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
                <FormLabel>{t('amount')}</FormLabel>
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
                <FormLabel>{t('currency')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCurrency')} />
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
              <FormLabel>{t('cadence')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCadence')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CADENCES.map((cadence) => (
                    <SelectItem key={cadence} value={cadence}>
                      {t(cadence.toLowerCase())}
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
              <FormLabel>{t('owner')}</FormLabel>
              <FormControl>
                <Input placeholder={t('ownerPlaceholder')} {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">{t('ownerHint')}</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon('save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
