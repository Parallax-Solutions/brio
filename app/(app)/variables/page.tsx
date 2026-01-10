'use client';

import { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { CrudPage } from '@/components/shared';
import { createSortableColumn } from '@/components/shared/data-table';
import { useTranslations } from '@/lib/i18n/context';
import { formatMoney } from '@/lib/utils/money';
import { BillTypeForm } from '@/components/forms/bill-type-form';
import { deleteBillType } from '@/lib/server/variables';
import { Currency } from '@prisma/client';
import { getCurrencyDisplay } from '@/lib/utils';

interface VariableBillEntry {
  id: string;
  month: Date;
  amount: number;
  currency: Currency;
  paidAt: Date | null;
}

interface VariableBillType {
  id: string;
  name: string;
  category: string;
  currency: Currency;
  notes: string | null;
  entries: VariableBillEntry[];
}

const CATEGORIES = ['utilities', 'housing', 'transportation', 'insurance', 'other'] as const;

export default function VariablesPage() {
  const t = useTranslations('variables');

  const getCategoryBadge = useCallback((category: string) => {
    const colors: Record<string, string> = {
      utilities: 'bg-yellow-500/10 text-yellow-500',
      housing: 'bg-blue-500/10 text-blue-500',
      transportation: 'bg-green-500/10 text-green-500',
      insurance: 'bg-purple-500/10 text-purple-500',
      other: 'bg-gray-500/10 text-gray-500',
    };
    return <Badge variant="secondary" className={colors[category] || colors.other}>{t(category)}</Badge>;
  }, [t]);

  const columns = useMemo<ColumnDef<VariableBillType, unknown>[]>(() => [
    createSortableColumn<VariableBillType>('name', t('name')),
    {
      accessorKey: 'category',
      header: t('category'),
      cell: ({ row }) => getCategoryBadge(row.original.category),
    },
    {
      accessorKey: 'currency',
      header: t('currency'),
      cell: ({ row }) => getCurrencyDisplay(row.original.currency),
    },
    {
      id: 'lastEntry',
      header: t('lastAmount'),
      cell: ({ row }) => {
        const entries = row.original.entries;
        if (!entries || entries.length === 0) return '—';
        const last = entries[0];
        return (
          <span className="font-medium tabular-nums">
            {formatMoney(last.amount, last.currency)}
          </span>
        );
      },
    },
    {
      id: 'entriesCount',
      header: t('entries'),
      cell: ({ row }) => row.original.entries?.length ?? 0,
    },
  ], [t, getCategoryBadge]);

  const filters = useMemo(() => [
    {
      key: 'category',
      placeholder: t('filterByCategory'),
      allLabel: t('allCategories'),
      options: CATEGORIES.map((cat) => ({ value: cat, label: t(cat) })),
    },
  ], [t]);

  return (
    <CrudPage<VariableBillType>
      translationNamespace="variables"
      apiEndpoint="/api/variables"
      deleteAction={deleteBillType}
      columns={columns}
      searchField="name"
      filters={filters}
      renderForm={({ item, onSuccess }) => (
        <BillTypeForm billType={item} onSuccess={onSuccess} />
      )}
    />
  );
}
