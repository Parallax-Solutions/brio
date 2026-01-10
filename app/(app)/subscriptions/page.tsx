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
import { SubscriptionForm } from '@/components/forms/subscription-form';
import { 
  deleteSubscription, 
  toggleSubscriptionActive,
  markSubscriptionAsPaid,
  unmarkSubscriptionAsPaid,
} from '@/lib/server/subscriptions';
import { toast } from 'sonner';
import { Currency, PaymentCadence } from '@prisma/client';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  cadence: PaymentCadence;
  dueDay: number | null;
  active: boolean;
  notes: string | null;
  createdAt: Date;
}

export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const tRecurring = useTranslations('recurring');
  const [isPending, startTransition] = useTransition();
  // Track paid IDs locally for optimistic updates
  const [paidOverrides, setPaidOverrides] = useState<Map<string, boolean>>(new Map());

  const handleTogglePaid = useCallback(async (subscription: Subscription) => {
    const currentlyPaid = paidOverrides.get(subscription.id);
    const isPaid = currentlyPaid ?? false;
    
    // Optimistic update
    setPaidOverrides(prev => {
      const next = new Map(prev);
      next.set(subscription.id, !isPaid);
      return next;
    });

    startTransition(async () => {
      try {
        const result = isPaid
          ? await unmarkSubscriptionAsPaid(subscription.id, subscription.cadence)
          : await markSubscriptionAsPaid(subscription.id, subscription.cadence, subscription.amount, subscription.currency);

        if (!result.success) {
          // Revert on error
          setPaidOverrides(prev => {
            const next = new Map(prev);
            next.delete(subscription.id);
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
          next.delete(subscription.id);
          return next;
        });
        toast.error(tCommon('error'));
      }
    });
  }, [paidOverrides, tDashboard, tCommon]);

  const getStatusBadge = useCallback((item: Subscription) => {
    if (!item.active) return <Badge variant="secondary">{t('paused')}</Badge>;
    return <Badge variant="default">{t('active')}</Badge>;
  }, [t]);

  const columns = useMemo<ColumnDef<Subscription, unknown>[]>(() => [
    createSortableColumn<Subscription>('name', t('name')),
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
      header: tRecurring('paid'),
      cell: ({ row }) => {
        const subscription = row.original;
        const isPaid = paidOverrides.get(subscription.id) ?? false;
        
        return (
          <Button
            size="sm"
            variant={isPaid ? "default" : "outline"}
            className={`h-8 gap-1 ${isPaid ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
            disabled={isPending || !subscription.active}
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePaid(subscription);
            }}
          >
            {isPaid ? (
              <>
                <Check className="h-3 w-3" />
                {tRecurring('paid')}
              </>
            ) : (
              <>
                <Circle className="h-3 w-3" />
                {tRecurring('markAsPaid')}
              </>
            )}
          </Button>
        );
      },
    },
  ], [t, tRecurring, getStatusBadge, paidOverrides, isPending, handleTogglePaid]);

  const filters = useMemo(() => [
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

  const filterFn = useCallback((item: Subscription, filterValues: Record<string, string>) => {
    const statusFilter = filterValues.active;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return item.active;
    if (statusFilter === 'paused') return !item.active;
    return true;
  }, []);

  const customActions = useCallback((subscription: Subscription) => {
    const isPaid = paidOverrides.get(subscription.id) ?? false;
    return (
      <DropdownMenuItem onClick={() => handleTogglePaid(subscription)}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {isPaid ? tDashboard('undo') : tRecurring('markAsPaid')}
      </DropdownMenuItem>
    );
  }, [handleTogglePaid, paidOverrides, tDashboard, tRecurring]);

  return (
    <CrudPage<Subscription>
      translationNamespace="subscriptions"
      apiEndpoint="/api/subscriptions"
      deleteAction={deleteSubscription}
      toggleActiveAction={toggleSubscriptionActive}
      columns={columns}
      searchField="name"
      filters={filters}
      filterFn={filterFn}
      hasActiveState
      activeField="active"
      customActions={customActions}
      renderForm={({ item, onSuccess }) => (
        <SubscriptionForm subscription={item} onSuccess={onSuccess} />
      )}
    />
  );
}
