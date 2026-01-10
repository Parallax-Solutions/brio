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
import { Currency, PaymentCadence } from '@prisma/client';
import { createRecurringPayment, updateRecurringPayment } from '@/lib/server/recurring-payments';
import { useTranslations } from '@/lib/i18n/context';
import { toast } from 'sonner';
import { getCurrencyDisplay, toStorageAmount, toDisplayAmount } from '@/lib/utils/money';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.nativeEnum(Currency),
  cadence: z.nativeEnum(PaymentCadence),
  dueDay: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORIES = ['housing', 'utilities', 'transportation', 'insurance', 'debt', 'other'] as const;

interface RecurringPaymentFormProps {
  payment?: {
    id: string;
    name: string;
    category: string;
    amount: number;
    currency: Currency;
    cadence: PaymentCadence;
    dueDay: number | null;
    active: boolean;
  };
  onSuccess?: () => void;
}

export function RecurringPaymentForm({ payment, onSuccess }: RecurringPaymentFormProps) {
  const t = useTranslations('recurring');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: payment?.name ?? '',
      category: payment?.category ?? '',
      amount: payment ? toDisplayAmount(payment.amount, payment.currency).toString() : '',
      currency: payment?.currency ?? Currency.CRC,
      cadence: payment?.cadence ?? PaymentCadence.MONTHLY,
      dueDay: payment?.dueDay?.toString() ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data = {
        name: values.name,
        category: values.category,
        amount: toStorageAmount(parseFloat(values.amount), values.currency),
        currency: values.currency,
        cadence: values.cadence,
        dueDay: values.dueDay ? parseInt(values.dueDay) : null,
        active: true,
      };

      if (payment) {
        await updateRecurringPayment(payment.id, data);
      } else {
        await createRecurringPayment(data);
      }

      toast.success(t('paymentSaved'));
      onSuccess?.();
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
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
                <Input placeholder="Rent, Electric Bill, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('category')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(cat)}
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
                    {Object.values(Currency).map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {getCurrencyDisplay(curr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                    {Object.values(PaymentCadence).map((cad) => (
                      <SelectItem key={cad} value={cad}>
                        {t(cad.toLowerCase())}
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
            name="dueDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('dueDay')}</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="31" placeholder="1-31" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {payment ? tCommon('save') : t('addPayment')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
