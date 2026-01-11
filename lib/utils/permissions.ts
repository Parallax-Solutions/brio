import { Role } from '@prisma/client';

// Define all available permissions
export type Permission =
  | 'users:view'
  | 'users:edit'
  | 'users:delete'
  | 'users:create'
  | 'users:change_role';

// Define permissions for each role
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'users:view',
    'users:edit',
    'users:delete',
    'users:create',
    'users:change_role',
  ],
  MOD: [
    'users:view',
    'users:edit',
  ],
  USER: [],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has all specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if a role can manage users (view users page)
 */
export function canManageUsers(role: Role): boolean {
  return hasPermission(role, 'users:view');
}

/**
 * Check if a role can modify another role
 * Admins can change any role, Mods can only edit Users (not change roles)
 */
export function canModifyUser(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === 'ADMIN') return true;
  if (actorRole === 'MOD') {
    // Mods can only edit regular users, not other mods or admins
    return targetRole === 'USER';
  }
  return false;
}

/**
 * Check if a role can delete a user with another role
 */
export function canDeleteUser(actorRole: Role, targetRole: Role): boolean {
  if (!hasPermission(actorRole, 'users:delete')) return false;
  // Admins can delete anyone, but can't delete other admins (protect admin accounts)
  if (actorRole === 'ADMIN') {
    return targetRole !== 'ADMIN';
  }
  return false;
}

/**
 * Get role display info
 */
export function getRoleInfo(role: Role): { color: string; level: number } {
  switch (role) {
    case 'ADMIN':
      return { color: 'destructive', level: 3 };
    case 'MOD':
      return { color: 'warning', level: 2 };
    case 'USER':
      return { color: 'default', level: 1 };
    default:
      return { color: 'secondary', level: 0 };
  }
}

/**
 * Check if actor can change target's role to a new role
 */
export function canChangeRole(actorRole: Role, targetRole: Role, newRole: Role): boolean {
  if (!hasPermission(actorRole, 'users:change_role')) return false;
  
  // Only admins can change roles
  if (actorRole !== 'ADMIN') return false;
  
  // Can't change another admin's role
  if (targetRole === 'ADMIN') return false;
  
  // Can't promote to admin (reserved)
  if (newRole === 'ADMIN') return false;
  
  return true;
}
