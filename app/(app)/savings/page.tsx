'use client';

import { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { CrudPage } from '@/components/shared';
import { createSortableColumn } from '@/components/shared/data-table';
import { useTranslations } from '@/lib/i18n/context';
import { formatMoney, getCurrencySymbol } from '@/lib/utils/money';
import { SavingsForm } from '@/components/forms/savings-form';
import { createBalance, updateBalance, deleteBalance } from '@/lib/server/savings';
import { Currency } from '@prisma/client';
import { 
  Wallet, 
  PiggyBank, 
  Banknote, 
  TrendingUp, 
  Bitcoin,
  HelpCircle 
} from 'lucide-react';

interface Balance {
  id: string;
  currency: Currency;
  amount: number;
  accountType: string | null;
  notes: string | null;
  snapshotDate: Date;
}

const ACCOUNT_TYPES = ['checking', 'savings', 'cash', 'investment', 'crypto', 'other'];

const ACCOUNT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: Wallet,
  savings: PiggyBank,
  cash: Banknote,
  investment: TrendingUp,
  crypto: Bitcoin,
  other: HelpCircle,
};

export default function SavingsPage() {
  const t = useTranslations('savings');
  const tCommon = useTranslations('common');

  const columns = useMemo<ColumnDef<Balance, unknown>[]>(() => [
    {
      accessorKey: 'accountType',
      header: t('accountType'),
      cell: ({ row }) => {
        const accountType = row.original.accountType || 'other';
        const Icon = ACCOUNT_ICONS[accountType] || HelpCircle;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{t(accountType)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: tCommon('amount'),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatMoney(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'currency',
      header: tCommon('currency'),
      cell: ({ row }) => (
        <Badge variant="outline">
          {getCurrencySymbol(row.original.currency)} {row.original.currency}
        </Badge>
      ),
    },
    createSortableColumn<Balance>('snapshotDate', t('lastUpdated'), ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {new Date(row.original.snapshotDate).toLocaleDateString('es-CR', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </span>
    )),
    {
      accessorKey: 'notes',
      header: tCommon('notes'),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm truncate max-w-[150px] block">
          {row.original.notes || '—'}
        </span>
      ),
    },
  ], [t, tCommon]);

  const filters = useMemo(() => [
    {
      key: 'currency',
      placeholder: tCommon('filterByCurrency'),
      allLabel: tCommon('allCurrencies'),
      options: [
        { value: 'CRC', label: '₡ CRC' },
        { value: 'USD', label: '$ USD' },
        { value: 'CAD', label: '$ CAD' },
      ],
    },
    {
      key: 'accountType',
      placeholder: t('filterByAccount'),
      allLabel: t('allAccounts'),
      options: ACCOUNT_TYPES.map((type) => ({ 
        value: type, 
        label: t(type === 'savings' ? 'savingsAccount' : type) 
      })),
    },
  ], [t, tCommon]);

  const filterFn = useCallback((item: Balance, filterValues: Record<string, string>) => {
    const currencyFilter = filterValues.currency;
    const accountFilter = filterValues.accountType;
    
    const matchesCurrency = currencyFilter === 'all' || item.currency === currencyFilter;
    const matchesAccount = accountFilter === 'all' || item.accountType === accountFilter;
    
    return matchesCurrency && matchesAccount;
  }, []);

  return (
    <CrudPage<Balance>
      translationNamespace="savings"
      apiEndpoint="/api/savings"
      columns={columns}
      filters={filters}
      filterFn={filterFn}
      searchField="accountType"
      renderForm={({ item, onSuccess }) => (
        <SavingsForm
          initialData={item}
          onSubmit={async (data) => {
            if (item) {
              await updateBalance(item.id, data);
            } else {
              await createBalance(data);
            }
            onSuccess();
          }}
          onCancel={onSuccess}
        />
      )}
      deleteAction={deleteBalance}
    />
  );
}
