'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from '@/lib/i18n/context';
import { Role } from '@prisma/client';
import { updateUser } from '@/lib/server/users';
import { toast } from 'sonner';
import { hasPermission } from '@/lib/utils/permissions';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  role: z.nativeEnum(Role),
});

type FormValues = z.infer<typeof formSchema>;

interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
}

interface UserFormProps {
  user: User;
  currentUserRole: Role;
  onSuccess?: () => void;
}

const ROLES: Role[] = ['ADMIN', 'MOD', 'USER'];

export function UserForm({ user, currentUserRole, onSuccess }: UserFormProps) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);

  const canChangeRole = hasPermission(currentUserRole, 'users:change_role');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
      role: user.role,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      const result = await updateUser(user.id, {
        name: data.name,
        email: data.email,
        role: canChangeRole ? data.role : undefined,
      });

      if (result.success) {
        toast.success(t('saved'));
        onSuccess?.();
      } else {
        toast.error(result.error || tCommon('error'));
      }
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('namePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {canChangeRole && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('role')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectRole')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(role.toLowerCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon('save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
