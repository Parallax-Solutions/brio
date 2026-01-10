'use server';

import { Role } from '@prisma/client';
import { db } from '@/lib/config/db';
import { getServerAuthSession } from '@/lib/get-server-session';
import { hasPermission, canModifyUser, canDeleteUser, canChangeRole } from '@/lib/utils/permissions';

export async function getUsers() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', data: [] };
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !hasPermission(currentUser.role, 'users:view')) {
    return { success: false, error: 'Forbidden', data: [] };
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return { success: true, data: users };
}

export async function updateUser(
  userId: string,
  data: { name?: string; email?: string; role?: Role }
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!currentUser || !hasPermission(currentUser.role, 'users:edit')) {
    return { success: false, error: 'Forbidden' };
  }

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return { success: false, error: 'User not found' };
  }

  // Check if actor can modify this user
  if (!canModifyUser(currentUser.role, targetUser.role)) {
    return { success: false, error: 'Cannot modify this user' };
  }

  // If trying to change role, check permission
  if (data.role && data.role !== targetUser.role) {
    if (!canChangeRole(currentUser.role, targetUser.role, data.role)) {
      return { success: false, error: 'Cannot change user role' };
    }
  }

  // Prevent changing own role (safety measure)
  if (currentUser.id === userId && data.role) {
    return { success: false, error: 'Cannot change your own role' };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

export async function deleteUser(userId: string) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!currentUser || !hasPermission(currentUser.role, 'users:delete')) {
    return { success: false, error: 'Forbidden' };
  }

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return { success: false, error: 'User not found' };
  }

  // Cannot delete yourself
  if (currentUser.id === userId) {
    return { success: false, error: 'Cannot delete your own account' };
  }

  // Check if can delete this user
  if (!canDeleteUser(currentUser.role, targetUser.role)) {
    return { success: false, error: 'Cannot delete this user' };
  }

  try {
    await db.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function getCurrentUserRole() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role ?? null;
}
