'use client';

import { useMemo, useCallback, useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Circle, Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CrudPage } from '@/components/shared';
import { createSortableColumn } from '@/components/shared/data-table';
import { useTranslations } from '@/lib/i18n/context';
import { formatMoney } from '@/lib/utils/money';
import { RecurringPaymentForm } from '@/components/forms/recurring-payment-form';
import { 
  deleteRecurringPayment, 
  togglePaymentActive, 
  markPaymentAsPaid, 
  unmarkPaymentAsPaid,
} from '@/lib/server/recurring-payments';
import { toast } from 'sonner';
import { Currency, PaymentCadence } from '@prisma/client';

interface RecurringPayment {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: Currency;
  cadence: PaymentCadence;
  dueDay: number | null;
  active: boolean;
  createdAt: Date;
}

const CATEGORIES = ['housing', 'utilities', 'transportation', 'insurance', 'debt', 'other'] as const;

export default function RecurringPaymentsPage() {
  const t = useTranslations('recurring');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const [isPending, startTransition] = useTransition();
  // Track paid IDs locally for optimistic updates
  const [paidOverrides, setPaidOverrides] = useState<Map<string, boolean>>(new Map());

  const handleTogglePaid = useCallback(async (payment: RecurringPayment) => {
    const currentlyPaid = paidOverrides.get(payment.id);
    const isPaid = currentlyPaid ?? false;
    
    // Optimistic update
    setPaidOverrides(prev => {
      const next = new Map(prev);
      next.set(payment.id, !isPaid);
      return next;
    });

    startTransition(async () => {
      try {
        const result = isPaid
          ? await unmarkPaymentAsPaid(payment.id, payment.cadence)
          : await markPaymentAsPaid(payment.id, payment.cadence, payment.amount, payment.currency);

        if (!result.success) {
          // Revert on error
          setPaidOverrides(prev => {
            const next = new Map(prev);
            next.delete(payment.id);
            return next;
          });
          toast.error(result.error);
        } else {
          toast.success(isPaid ? tDashboard('markedUnpaid') : tDashboard('markedPaid'));
        }
      } catch {
        // Revert on error
        setPaidOverrides(prev => {
          const next = new Map(prev);
          next.delete(payment.id);
          return next;
        });
        toast.error(tCommon('error'));
      }
    });
  }, [paidOverrides, tDashboard, tCommon]);

  const getStatusBadge = useCallback((payment: RecurringPayment) => {
    if (!payment.active) {
      return <Badge variant="secondary">{t('paused')}</Badge>;
    }
    
    const today = new Date().getDate();
    if (payment.dueDay && today > payment.dueDay) {
      return <Badge variant="destructive">{t('overdue')}</Badge>;
    }
    if (payment.dueDay && payment.dueDay - today <= 3) {
      return <Badge variant="outline" className="border-amber-500 text-amber-500">{t('pending')}</Badge>;
    }
    return <Badge variant="default">{t('active')}</Badge>;
  }, [t]);

  const getCategoryBadge = useCallback((category: string) => {
    const colors: Record<string, string> = {
      housing: 'bg-blue-500/10 text-blue-500',
      utilities: 'bg-yellow-500/10 text-yellow-500',
      transportation: 'bg-green-500/10 text-green-500',
      insurance: 'bg-purple-500/10 text-purple-500',
      debt: 'bg-red-500/10 text-red-500',
      other: 'bg-gray-500/10 text-gray-500',
    };
    return (
      <Badge variant="secondary" className={colors[category] || colors.other}>
        {t(category)}
      </Badge>
    );
  }, [t]);

  const columns = useMemo<ColumnDef<RecurringPayment, unknown>[]>(() => [
    createSortableColumn<RecurringPayment>('name', t('name')),
    {
      accessorKey: 'category',
      header: t('category'),
      cell: ({ row }) => getCategoryBadge(row.original.category),
    },
    {
      accessorKey: 'amount',
      header: t('amount'),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatMoney(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'cadence',
      header: t('cadence'),
      cell: ({ row }) => t(row.original.cadence.toLowerCase()),
    },
    {
      accessorKey: 'dueDay',
      header: t('dueDay'),
      cell: ({ row }) => row.original.dueDay ?? '—',
    },
    {
      accessorKey: 'active',
      header: t('status'),
      cell: ({ row }) => getStatusBadge(row.original),
    },
    {
      id: 'paidThisMonth',
      header: t('paid'),
      cell: ({ row }) => {
        const payment = row.original;
        const isPaid = paidOverrides.get(payment.id) ?? false;
        
        return (
          <Button
            size="sm"
            variant={isPaid ? "default" : "outline"}
            className={`h-8 gap-1 ${isPaid ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
            disabled={isPending || !payment.active}
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePaid(payment);
            }}
          >
            {isPaid ? (
              <>
                <Check className="h-3 w-3" />
                {t('paid')}
              </>
            ) : (
              <>
                <Circle className="h-3 w-3" />
                {t('markAsPaid')}
              </>
            )}
          </Button>
        );
      },
    },
  ], [t, getCategoryBadge, getStatusBadge, paidOverrides, isPending, handleTogglePaid]);

  const filters = useMemo(() => [
    {
      key: 'category',
      placeholder: t('filterByCategory'),
      allLabel: t('allCategories'),
      options: CATEGORIES.map((cat) => ({ value: cat, label: t(cat) })),
    },
    {
      key: 'active',
      placeholder: t('filterByStatus'),
      allLabel: t('allStatuses'),
      options: [
        { value: 'active', label: t('active') },
        { value: 'paused', label: t('paused') },
      ],
    },
  ], [t]);

  const filterFn = useCallback((item: RecurringPayment, filterValues: Record<string, string>) => {
    const categoryFilter = filterValues.category;
    const statusFilter = filterValues.active;
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && item.active) ||
      (statusFilter === 'paused' && !item.active);
    
    return matchesCategory && matchesStatus;
  }, []);

  const customActions = useCallback((payment: RecurringPayment) => {
    const isPaid = paidOverrides.get(payment.id) ?? false;
    return (
      <DropdownMenuItem onClick={() => handleTogglePaid(payment)}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {isPaid ? tDashboard('undo') : t('markAsPaid')}
      </DropdownMenuItem>
    );
  }, [handleTogglePaid, paidOverrides, t, tDashboard]);

  return (
    <CrudPage<RecurringPayment>
      translationNamespace="recurring"
      apiEndpoint="/api/recurring-payments"
      deleteAction={deleteRecurringPayment}
      toggleActiveAction={togglePaymentActive}
      columns={columns}
      searchField="name"
      filters={filters}
      filterFn={filterFn}
      hasActiveState
      activeField="active"
      customActions={customActions}
      renderForm={({ item, onSuccess }) => (
        <RecurringPaymentForm payment={item} onSuccess={onSuccess} />
      )}
    />
  );
}
