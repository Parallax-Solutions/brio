'use client';

import { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { CrudPage } from '@/components/shared';
import { createSortableColumn } from '@/components/shared/data-table';
import { useTranslations } from '@/lib/i18n/context';
import { formatMoney } from '@/lib/utils/money';
import { ExpenseForm } from '@/components/forms/expense-form';
import { deleteExpense } from '@/lib/server/expenses';
import { Currency } from '@prisma/client';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  currency: Currency;
  date: Date;
  notes: string | null;
}

const CATEGORIES = ['food', 'shopping', 'entertainment', 'health', 'travel', 'other'] as const;

export default function ExpensesPage() {
  const t = useTranslations('expenses');

  const getCategoryBadge = useCallback((category: string) => {
    const colors: Record<string, string> = {
      food: 'bg-orange-500/10 text-orange-500',
      shopping: 'bg-pink-500/10 text-pink-500',
      entertainment: 'bg-purple-500/10 text-purple-500',
      health: 'bg-green-500/10 text-green-500',
      travel: 'bg-blue-500/10 text-blue-500',
      other: 'bg-gray-500/10 text-gray-500',
    };
    return <Badge variant="secondary" className={colors[category] || colors.other}>{t(category)}</Badge>;
  }, [t]);

  const columns = useMemo<ColumnDef<Expense, unknown>[]>(() => [
    {
      accessorKey: 'date',
      header: t('date'),
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },
    createSortableColumn<Expense>('description', t('description')),
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
    <CrudPage<Expense>
      translationNamespace="expenses"
      apiEndpoint="/api/expenses"
      deleteAction={deleteExpense}
      columns={columns}
      searchField="description"
      filters={filters}
      renderForm={({ item, onSuccess }) => (
        <ExpenseForm expense={item} onSuccess={onSuccess} />
      )}
    />
  );
}
