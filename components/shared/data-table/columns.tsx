'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Creates a selection column with checkbox for row selection
 */
export function createSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Creates a sortable column header
 */
interface SortableHeaderProps {
  column: {
    getIsSorted: () => false | 'asc' | 'desc';
    toggleSorting: (desc?: boolean) => void;
  };
  title: string;
}

export function SortableHeader({ column, title }: SortableHeaderProps) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className="-ml-3 h-8"
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * Creates a sortable column definition
 */
export function createSortableColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  cell?: (props: { row: Row<TData> }) => React.ReactNode
): ColumnDef<TData> {
  return {
    accessorKey,
    header: ({ column }) => <SortableHeader column={column} title={header} />,
    cell: cell ?? (({ row }) => row.getValue(accessorKey)),
  };
}

/**
 * Creates a simple column definition
 */
export function createColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  cell?: (props: { row: Row<TData> }) => React.ReactNode
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    cell: cell ?? (({ row }) => row.getValue(accessorKey)),
  };
}

/**
 * Creates an actions column (for edit/delete buttons)
 */
export function createActionsColumn<TData>(
  cell: (props: { row: Row<TData> }) => React.ReactNode
): ColumnDef<TData> {
  return {
    id: 'actions',
    header: '',
    cell,
    enableSorting: false,
    enableHiding: false,
  };
}

