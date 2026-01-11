'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { ColumnDef, RowSelectionState, PaginationState } from '@tanstack/react-table';
import { Trash2, MoreHorizontal, Pencil, Shield, ShieldCheck, User as UserIcon, CheckCircle, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Role } from '@prisma/client';
import { deleteUser, getCurrentUserRole } from '@/lib/server/users';
import { UserForm } from '@/components/forms/user-form';
import { hasPermission, canModifyUser, canDeleteUser } from '@/lib/utils/permissions';
import { formatDate } from '@/lib/utils/dates';
import { getAvatarUrl } from '@/lib/config/supabase';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  avatarUrl: string | null;
  image: string | null;
  emailVerified: string | Date | null;
  onboardingCompleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const ROLES: Role[] = ['ADMIN', 'MOD', 'USER'];

function getRoleIcon(role: Role) {
  switch (role) {
    case 'ADMIN':
      return <ShieldCheck className="h-3 w-3" />;
    case 'MOD':
      return <Shield className="h-3 w-3" />;
    default:
      return <UserIcon className="h-3 w-3" />;
  }
}

function getRoleVariant(role: Role): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (role) {
    case 'ADMIN':
      return 'destructive';
    case 'MOD':
      return 'default';
    default:
      return 'secondary';
  }
}

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');

  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Fetch current user role
  useEffect(() => {
    getCurrentUserRole().then(setCurrentUserRole);
  }, []);

  // Fetch users - only run once on mount
  useEffect(() => {
    let mounted = true;
    
    setIsLoading(true);
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) throw new Error('Forbidden');
        return res.json();
      })
      .then((users) => {
        if (mounted) setData(users);
      })
      .catch(() => {
        if (mounted) toast.error('Access denied');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    
    return () => { mounted = false; };
  }, []);

  // Refetch function for after mutations
  const fetchData = useCallback(() => {
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) throw new Error('Forbidden');
        return res.json();
      })
      .then(setData)
      .catch(() => {});
  }, []);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((user) => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [data, search, roleFilter]);

  const canDelete = currentUserRole && hasPermission(currentUserRole, 'users:delete');

  // Delete handler
  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      const result = await deleteUser(deletingUser.id);
      if (result.success) {
        setData((prev) => prev.filter((user) => user.id !== deletingUser.id));
        toast.success(t('deleted'));
      } else {
        toast.error(result.error || tCommon('error'));
      }
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setDeletingUser(null);
    }
  };

  // Form success handler
  const handleFormSuccess = useCallback(() => {
    setEditingUser(null);
    fetchData();
  }, [fetchData]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Columns
  const columns = useMemo<ColumnDef<User, unknown>[]>(() => [
    createSelectColumn<User>(),
    {
      accessorKey: 'name',
      header: t('name'),
      cell: ({ row }) => {
        const avatarUrl = getAvatarUrl(row.original.avatarUrl) || row.original.image;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={row.original.name || 'User'} />}
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.name || '—'}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: t('role'),
      cell: ({ row }) => (
        <Badge variant={getRoleVariant(row.original.role)} className="gap-1">
          {getRoleIcon(row.original.role)}
          {t(row.original.role.toLowerCase())}
        </Badge>
      ),
    },
    {
      accessorKey: 'emailVerified',
      header: t('emailVerified'),
      cell: ({ row }) => {
        const verified = row.original.emailVerified;
        return verified ? (
          <div className="flex items-center gap-1.5 text-emerald-500">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">{t('verified')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs">{t('pending')}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'onboardingCompleted',
      header: t('onboarding'),
      cell: ({ row }) => {
        const completed = row.original.onboardingCompleted;
        return completed ? (
          <div className="flex items-center gap-1.5 text-emerald-500">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">{t('completed')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-500">
            <Clock className="h-4 w-4" />
            <span className="text-xs">{t('inProgress')}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('createdAt'),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        const canModify = currentUserRole && canModifyUser(currentUserRole, user.role);
        const canDeleteThis = currentUserRole && canDeleteUser(currentUserRole, user.role);

        if (!canModify && !canDeleteThis) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canModify && (
                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {tCommon('edit')}
                </DropdownMenuItem>
              )}
              {canModify && canDeleteThis && <DropdownMenuSeparator />}
              {canDeleteThis && (
                <DropdownMenuItem 
                  onClick={() => setDeletingUser(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tCommon('delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [t, tCommon, currentUserRole]);

  const selectedIds = Object.keys(selectedRows).filter((id) => selectedRows[id]);

  if (!currentUserRole || !hasPermission(currentUserRole, 'users:view')) {
    return (
      <PageTransition className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">{t('forbidden')}</h2>
          <p className="text-muted-foreground">{t('noPermission')}</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{t('description')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
            <SelectValue placeholder={t('filterByRole')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRoles')}</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>{t(role.toLowerCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedIds.length > 0 && canDelete && (
          <Button variant="destructive" size="sm" className="w-full sm:w-auto">
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
        emptyMessage={t('noUsers')}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('edit')}</DialogTitle>
            <DialogDescription>{t('editDescription')}</DialogDescription>
          </DialogHeader>
          {editingUser && currentUserRole && (
            <UserForm 
              user={editingUser} 
              currentUserRole={currentUserRole}
              onSuccess={handleFormSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteWarning', { name: deletingUser?.name || deletingUser?.email || '' })}
            </AlertDialogDescription>
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
    </PageTransition>
  );
}
