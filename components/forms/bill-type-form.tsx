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
import { Currency } from '@prisma/client';
import { createBillType, updateBillType, createBillEntry } from '@/lib/server/variables';
import { useTranslations } from '@/lib/i18n/context';
import { toast } from 'sonner';
import { getCurrencyDisplay, toStorageAmount } from '@/lib/utils';

const CATEGORIES = ['utilities', 'housing', 'transportation', 'insurance', 'other'] as const;

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  currency: z.nativeEnum(Currency),
  notes: z.string().optional(),
  // Optional first entry amount (only for new bill types)
  amount: z.string().optional(),
  entryMonth: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BillTypeFormProps {
  billType?: {
    id: string;
    name: string;
    category: string;
    currency: Currency;
    notes: string | null;
  };
  onSuccess?: () => void;
}

export function BillTypeForm({ billType, onSuccess }: BillTypeFormProps) {
  const t = useTranslations('variables');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current month as default
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: billType?.name ?? '',
      category: billType?.category ?? 'utilities',
      currency: billType?.currency ?? Currency.CRC,
      notes: billType?.notes ?? '',
      amount: '',
      entryMonth: currentMonth,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data = {
        name: values.name,
        category: values.category,
        currency: values.currency,
        notes: values.notes || null,
      };

      if (billType) {
        // Update existing bill type
        await updateBillType(billType.id, data);
      } else {
        // Create new bill type
        await createBillType(data);
        
        // If amount is provided, create an entry for the current month
        if (values.amount && parseFloat(values.amount) > 0) {
          // We need to get the newly created bill type ID
          // For now, fetch it by name (since name is unique per user)
          const response = await fetch('/api/variables');
          const billTypes = await response.json();
          const newBillType = billTypes.find((bt: { name: string }) => bt.name === values.name);
          
          if (newBillType) {
            const month = values.entryMonth ? new Date(values.entryMonth + '-01') : new Date();
            await createBillEntry({
              variableBillTypeId: newBillType.id,
              month: month.toISOString(),
              amount: toStorageAmount(parseFloat(values.amount), values.currency),
              currency: values.currency,
              notes: null,
            });
          }
        }
      }

      toast.success(t('saved'));
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : tCommon('error');
      toast.error(message);
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
                <Input placeholder="Water, Electric, Internet, etc." {...field} />
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
                    <SelectItem key={cat} value={cat}>{t(cat)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {/* Only show amount fields for new bill types */}
        {!billType && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('amount')} ({t('optional')})</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>{t('firstEntryAmount')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entryMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('month')}</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('notes')}</FormLabel>
              <FormControl>
                <Input placeholder={t('notesPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {billType ? tCommon('save') : t('add')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
