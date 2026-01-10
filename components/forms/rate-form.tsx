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
  FormDescription,
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
import { Currency, RateType } from '@prisma/client';
import { createRate, updateRate } from '@/lib/server/rates';
import { useTranslations } from '@/lib/i18n/context';
import { toast } from 'sonner';
import { Decimal } from '@prisma/client/runtime/library';
import { getCurrencyDisplay, getCurrencySymbol } from '@/lib/utils';

const formSchema = z.object({
  fromCurrency: z.nativeEnum(Currency),
  toCurrency: z.nativeEnum(Currency),
  rate: z.string().min(1, 'Rate is required'),
  rateType: z.nativeEnum(RateType),
  effectiveDate: z.string().min(1, 'Date is required'),
  source: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RateFormProps {
  rate?: {
    id: string;
    fromCurrency: Currency;
    toCurrency: Currency;
    rate: Decimal;
    rateType: RateType;
    effectiveDate: Date;
    source: string | null;
  };
  onSuccess?: () => void;
}

export function RateForm({ rate, onSuccess }: RateFormProps) {
  const t = useTranslations('rates');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromCurrency: rate?.fromCurrency ?? Currency.USD,
      toCurrency: rate?.toCurrency ?? Currency.CRC,
      rate: rate ? rate.rate.toString() : '',
      rateType: rate?.rateType ?? RateType.BUY,
      effectiveDate: rate ? new Date(rate.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      source: rate?.source ?? 'manual',
    },
  });

  // Watch form values for the preview
  const watchedFromCurrency = form.watch('fromCurrency');
  const watchedToCurrency = form.watch('toCurrency');
  const watchedRate = form.watch('rate');
  const watchedRateType = form.watch('rateType');

  // Format rate for preview (remove trailing zeros)
  const formatRatePreview = (rateStr: string) => {
    const num = parseFloat(rateStr);
    if (isNaN(num)) return '';
    return num % 1 === 0 ? num.toString() : parseFloat(num.toFixed(4)).toString();
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data = {
        fromCurrency: values.fromCurrency,
        toCurrency: values.toCurrency,
        rate: parseFloat(values.rate),
        rateType: values.rateType,
        effectiveDate: values.effectiveDate,
        source: values.source || null,
      };

      if (rate) {
        await updateRate(rate.id, data);
      } else {
        await createRate(data);
      }

      toast.success(t('saved'));
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fromCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('from')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Currency).map((curr) => (
                      <SelectItem key={curr} value={curr}>{getCurrencyDisplay(curr)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('to')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Currency).map((curr) => (
                      <SelectItem key={curr} value={curr}>{getCurrencyDisplay(curr)}</SelectItem>
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
          name="rateType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rateType')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={RateType.BUY}>{t('buy')} (Compra)</SelectItem>
                  <SelectItem value={RateType.SELL}>{t('sell')} (Venta)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {watchedRateType === RateType.BUY 
                  ? t('buyDescription') 
                  : t('sellDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rate')}</FormLabel>
              <FormControl>
                <Input type="number" step="0.000001" min="0" placeholder="505.50" {...field} />
              </FormControl>
              {watchedRate && parseFloat(watchedRate) > 0 && (
                <p className="text-sm text-muted-foreground">
                  {getCurrencySymbol(watchedFromCurrency)}1 = {getCurrencySymbol(watchedToCurrency)}{formatRatePreview(watchedRate)}
                  {' '}({watchedRateType === RateType.BUY ? t('buy') : t('sell')})
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="effectiveDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('effectiveDate')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('source')}</FormLabel>
              <FormControl>
                <Input placeholder="manual, BCCR, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {rate ? tCommon('save') : t('add')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
