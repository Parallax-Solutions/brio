'use client';

import { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { CrudPage } from '@/components/shared';
import { createSortableColumn } from '@/components/shared/data-table';
import { useTranslations } from '@/lib/i18n/context';
import { formatMoney } from '@/lib/utils/money';
import { IncomeForm } from '@/components/forms/income-form';
import { deleteIncome, toggleIncomeActive } from '@/lib/server/incomes';
import { Currency, IncomeCadence } from '@prisma/client';

interface Income {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  cadence: IncomeCadence;
  owner: string | null;
  active: boolean;
  createdAt: Date;
}

const CADENCES: IncomeCadence[] = ['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'ONE_TIME'];

export default function IncomePage() {
  const t = useTranslations('income');

  const columns = useMemo<ColumnDef<Income, unknown>[]>(() => [
    createSortableColumn<Income>('name', t('name')),
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
      cell: ({ row }) => (
        <Badge variant="outline">
          {t(row.original.cadence.toLowerCase())}
        </Badge>
      ),
    },
    {
      accessorKey: 'owner',
      header: t('owner'),
      cell: ({ row }) => row.original.owner || '—',
    },
    {
      accessorKey: 'active',
      header: t('status'),
      cell: ({ row }) => (
        <Badge variant={row.original.active ? 'default' : 'secondary'}>
          {row.original.active ? t('active') : t('pausedStatus')}
        </Badge>
      ),
    },
  ], [t]);

  const filters = useMemo(() => [
    {
      key: 'cadence',
      placeholder: t('filterByCadence'),
      allLabel: t('allCadences'),
      options: CADENCES.map((cadence) => ({ 
        value: cadence, 
        label: t(cadence.toLowerCase()) 
      })),
    },
    {
      key: 'active',
      placeholder: t('filterByStatus'),
      allLabel: t('allStatuses'),
      options: [
        { value: 'active', label: t('active') },
        { value: 'paused', label: t('pausedStatus') },
      ],
    },
  ], [t]);

  const filterFn = useCallback((item: Income, filterValues: Record<string, string>) => {
    const cadenceFilter = filterValues.cadence;
    const statusFilter = filterValues.active;
    
    const matchesCadence = cadenceFilter === 'all' || item.cadence === cadenceFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && item.active) ||
      (statusFilter === 'paused' && !item.active);
    
    return matchesCadence && matchesStatus;
  }, []);

  return (
    <CrudPage<Income>
      translationNamespace="income"
      apiEndpoint="/api/incomes"
      deleteAction={deleteIncome}
      toggleActiveAction={toggleIncomeActive}
      columns={columns}
      searchField="name"
      filters={filters}
      filterFn={filterFn}
      hasActiveState
      activeField="active"
      renderForm={({ item, onSuccess }) => (
        <IncomeForm income={item} onSuccess={onSuccess} />
      )}
    />
  );
}
