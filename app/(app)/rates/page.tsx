'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Decimal } from '@prisma/client/runtime/library';

import { Badge } from '@/components/ui/badge';
import { CrudPage } from '@/components/shared';
import { useTranslations } from '@/lib/i18n/context';
import { RateForm } from '@/components/forms/rate-form';
import { deleteRate } from '@/lib/server/rates';
import { Currency, RateType } from '@prisma/client';
import { getCurrencyDisplay } from '@/lib/utils';

interface ExchangeRate {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: Decimal;
  rateType: RateType;
  effectiveDate: Date;
  source: string | null;
}

export default function RatesPage() {
  const t = useTranslations('rates');

  const columns = useMemo<ColumnDef<ExchangeRate, unknown>[]>(() => [
    {
      accessorKey: 'fromCurrency',
      header: t('from'),
      cell: ({ row }) => <Badge variant="outline">{getCurrencyDisplay(row.original.fromCurrency)}</Badge>,
    },
    {
      accessorKey: 'toCurrency',
      header: t('to'),
      cell: ({ row }) => <Badge variant="outline">{getCurrencyDisplay(row.original.toCurrency)}</Badge>,
    },
    {
      accessorKey: 'rateType',
      header: t('rateType'),
      cell: ({ row }) => (
        <Badge 
          variant={row.original.rateType === 'BUY' ? 'default' : 'secondary'}
          className={row.original.rateType === 'BUY' ? 'bg-emerald-600' : 'bg-amber-600'}
        >
          {row.original.rateType === 'BUY' ? t('buy') : t('sell')}
        </Badge>
      ),
    },
    {
      accessorKey: 'rate',
      header: t('rate'),
      cell: ({ row }) => {
        const rate = Number(row.original.rate);
        const formatted = rate % 1 === 0 
          ? rate.toString() 
          : parseFloat(rate.toFixed(4)).toString();
        return (
          <span className="font-medium tabular-nums">
            {formatted}
          </span>
        );
      },
    },
    {
      accessorKey: 'effectiveDate',
      header: t('effectiveDate'),
      cell: ({ row }) => new Date(row.original.effectiveDate).toLocaleDateString(),
    },
    {
      accessorKey: 'source',
      header: t('source'),
      cell: ({ row }) => row.original.source || '—',
    },
  ], [t]);

  const filters = useMemo(() => [
    {
      key: 'currency',
      placeholder: t('filterByCurrency'),
      allLabel: t('allCurrencies'),
      options: Object.values(Currency).map((curr) => ({ 
        value: curr, 
        label: getCurrencyDisplay(curr) 
      })),
    },
    {
      key: 'rateType',
      placeholder: t('filterByType'),
      allLabel: t('allTypes'),
      options: [
        { value: 'BUY', label: t('buy') },
        { value: 'SELL', label: t('sell') },
      ],
    },
  ], [t]);

  const filterFn = useMemo(() => (item: ExchangeRate, filterValues: Record<string, string>) => {
    const currencyFilter = filterValues.currency;
    const typeFilter = filterValues.rateType;
    
    const matchesCurrency = currencyFilter === 'all' || 
      item.fromCurrency === currencyFilter || 
      item.toCurrency === currencyFilter;
    
    const matchesType = typeFilter === 'all' || item.rateType === typeFilter;
    
    return matchesCurrency && matchesType;
  }, []);

  return (
    <CrudPage<ExchangeRate>
      translationNamespace="rates"
      apiEndpoint="/api/rates"
      deleteAction={deleteRate}
      columns={columns}
      searchField="source"
      filters={filters}
      filterFn={filterFn}
      renderForm={({ item, onSuccess }) => (
        <RateForm rate={item} onSuccess={onSuccess} />
      )}
    />
  );
}
