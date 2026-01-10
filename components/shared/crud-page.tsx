'use client';

import { useState, useMemo, useEffect, useCallback, ReactNode } from 'react';
import { Plus, Trash2, MoreHorizontal, Pencil, Pause, Play } from 'lucide-react';
import { ColumnDef, RowSelectionState, PaginationState } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable, createSelectColumn } from '@/components/shared/data-table';
import { PageTransition } from '@/components/shared/animations';
import { useTranslations } from '@/lib/i18n/context';
import { toast } from 'sonner';

// Base interface for items with id
interface BaseItem {
  id: string;
}

// Filter option configuration
interface FilterOption {
  value: string;
  label: string;
}

// Filter configuration
interface FilterConfig {
  key: string;
  placeholder: string;
  options: FilterOption[];
  allLabel: string;
}

// Action result type
interface ActionResult {
  success?: boolean;
  error?: string;
}

// Props for the CRUD page component
export interface CrudPageProps<T extends BaseItem> {
  // Translation namespace
  translationNamespace: string;
  
  // API endpoint for fetching data
  apiEndpoint: string;
  
  // Delete action (can return void or { success, error })
  deleteAction: (id: string) => Promise<void | ActionResult>;
  
  // Toggle active action (optional - for items with active/paused state)
  toggleActiveAction?: (id: string) => Promise<void | ActionResult>;
  
  // Columns definition (without select and actions columns - they're added automatically)
  columns: ColumnDef<T, unknown>[];
  
  // Form component render prop
  renderForm: (props: { item?: T; onSuccess: () => void }) => ReactNode;
  
  // Filter configuration
  filters?: FilterConfig[];
  
  // Search field key (which field to search on)
  searchField: keyof T;
  
  // Filter function (custom filtering logic)
  filterFn?: (item: T, filters: Record<string, string>) => boolean;
  
  // Whether items have active/paused state
  hasActiveState?: boolean;
  
  // Active field key (if hasActiveState is true)
  activeField?: keyof T;
  
  // Custom row actions (in addition to edit/delete)
  customActions?: (item: T) => ReactNode;
  
  // Dialog max width
  dialogMaxWidth?: string;
}

export function CrudPage<T extends BaseItem>({
  translationNamespace,
  apiEndpoint,
  deleteAction,
  toggleActiveAction,
  columns: baseColumns,
  renderForm,
  filters = [],
  searchField,
  filterFn,
  hasActiveState = false,
  activeField = 'active' as keyof T,
  customActions,
  dialogMaxWidth = 'sm:max-w-[500px]',
}: CrudPageProps<T>) {
  const t = useTranslations(translationNamespace);
  const tCommon = useTranslations('common');

  // Data state
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    filters.reduce((acc, f) => ({ ...acc, [f.key]: 'all' }), {})
  );
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [deletingItem, setDeletingItem] = useState<T | null>(null);

  // Fetch data
  const fetchData = useCallback(() => {
    setIsLoading(true);
    fetch(apiEndpoint)
      .then((res) => res.json())
      .then(setData)
      .catch(() => toast.error('Error loading data'))
      .finally(() => setIsLoading(false));
  }, [apiEndpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      const searchValue = String(item[searchField] || '').toLowerCase();
      const matchesSearch = searchValue.includes(search.toLowerCase());
      
      // Custom filter function
      if (filterFn) {
        return matchesSearch && filterFn(item, filterValues);
      }
      
      // Default filter by filterValues
      const matchesFilters = Object.entries(filterValues).every(([key, value]) => {
        if (value === 'all') return true;
        const itemValue = item[key as keyof T];
        if (typeof itemValue === 'boolean') {
          return value === 'active' ? itemValue : !itemValue;
        }
        return itemValue === value;
      });
      
      return matchesSearch && matchesFilters;
    });
  }, [data, search, searchField, filterValues, filterFn]);

  // Delete handler for single item
  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const result = await deleteAction(deletingItem.id);
      // Check if action returned an error
      if (result && 'success' in result && !result.success) {
        toast.error(result.error || tCommon('error'));
        return;
      }
      setData((prev) => prev.filter((item) => item.id !== deletingItem.id));
      toast.success(t('deleted'));
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setDeletingItem(null);
    }
  };

  // Batch delete state and handler
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  const handleBatchDelete = async () => {
    setIsBatchDeleting(true);
    try {
      const idsToDelete = Object.keys(selectedRows).filter((id) => selectedRows[id]);
      let successCount = 0;
      let errorCount = 0;
      
      for (const id of idsToDelete) {
        try {
          const result = await deleteAction(id);
          if (result && 'success' in result && !result.success) {
            errorCount++;
          } else {
            successCount++;
          }
        } catch {
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setData((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
        toast.success(`${successCount} ${t('deleted')}`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} failed to delete`);
      }
      
      setSelectedRows({});
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsBatchDeleting(false);
      setShowBatchDeleteConfirm(false);
    }
  };

  // Toggle active handler
  const handleToggleActive = useCallback(async (item: T) => {
    if (!toggleActiveAction) return;
    try {
      const result = await toggleActiveAction(item.id);
      // Check if action returned an error
      if (result && 'success' in result && !result.success) {
        toast.error(result.error || tCommon('error'));
        return;
      }
      setData((prev) => prev.map((i) => 
        i.id === item.id ? { ...i, [activeField]: !(i[activeField]) } : i
      ));
      const isActive = item[activeField];
      toast.success(isActive ? t('paused') : t('resumed'));
    } catch {
      toast.error(tCommon('error'));
    }
  }, [toggleActiveAction, activeField, t, tCommon]);

  // Form success handler
  const handleFormSuccess = useCallback(() => {
    setIsAddDialogOpen(false);
    setEditingItem(null);
    fetchData();
  }, [fetchData]);

  // Actions column
  const actionsColumn: ColumnDef<T, unknown> = useMemo(() => ({
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditingItem(row.original)}>
            <Pencil className="mr-2 h-4 w-4" />
            {tCommon('edit')}
          </DropdownMenuItem>
          
          {hasActiveState && toggleActiveAction && (
            <DropdownMenuItem onClick={() => handleToggleActive(row.original)}>
              {row.original[activeField] ? (
                <><Pause className="mr-2 h-4 w-4" />{t('pause')}</>
              ) : (
                <><Play className="mr-2 h-4 w-4" />{t('resume')}</>
              )}
            </DropdownMenuItem>
          )}
          
          {customActions?.(row.original)}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setDeletingItem(row.original)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tCommon('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  }), [tCommon, t, hasActiveState, toggleActiveAction, activeField, handleToggleActive, customActions]);

  // Complete columns with select and actions
  const columns = useMemo<ColumnDef<T, unknown>[]>(() => [
    createSelectColumn<T>(),
    ...baseColumns,
    actionsColumn,
  ], [baseColumns, actionsColumn]);

  const selectedIds = Object.keys(selectedRows).filter((id) => selectedRows[id]);

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('description')}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('add')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        
        {filters.map((filter) => (
          <Select 
            key={filter.key}
            value={filterValues[filter.key]} 
            onValueChange={(value) => setFilterValues((prev) => ({ ...prev, [filter.key]: value }))}
          >
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.allLabel}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {selectedIds.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full sm:w-auto"
            onClick={() => setShowBatchDeleteConfirm(true)}
            disabled={isBatchDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tCommon('delete')} ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowSelection={selectedRows}
        onRowSelectionChange={setSelectedRows}
        getRowId={(row) => row.id}
        emptyMessage={t('noItems')}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || !!editingItem} onOpenChange={(open) => {
        if (!open) { setIsAddDialogOpen(false); setEditingItem(null); }
      }}>
        <DialogContent className={dialogMaxWidth}>
          <DialogHeader>
            <DialogTitle>{editingItem ? t('edit') : t('add')}</DialogTitle>
            <DialogDescription>
              {editingItem ? t('editDescription') : t('addDescription')}
            </DialogDescription>
          </DialogHeader>
          {renderForm({ item: editingItem || undefined, onSuccess: handleFormSuccess })}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{tCommon('deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={showBatchDeleteConfirm} onOpenChange={setShowBatchDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('deleteWarning')} ({selectedIds.length} items)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDeleting}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBatchDelete} 
              disabled={isBatchDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBatchDeleting ? 'Deleting...' : `${tCommon('delete')} (${selectedIds.length})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
