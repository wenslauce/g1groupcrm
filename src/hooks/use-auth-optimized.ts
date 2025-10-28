'use client'

import { useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { UserRole } from '@/types'

/**
 * Optimized auth hook with memoized values and callbacks
 * Reduces re-renders and improves performance
 */
export function useAuthOptimized() {
  const auth = useAuth()

  // Memoize user data to prevent unnecessary re-renders
  const user = useMemo(() => auth.user, [auth.user])
  const loading = useMemo(() => auth.loading, [auth.loading])

  // Memoize auth functions to prevent re-creation on every render
  const signIn = useCallback(auth.signIn, [auth.signIn])
  const signUp = useCallback(auth.signUp, [auth.signUp])
  const signOut = useCallback(auth.signOut, [auth.signOut])
  const updateProfile = useCallback(auth.updateProfile, [auth.updateProfile])

  // Memoize computed values
  const isAuthenticated = useMemo(() => !!user, [user])
  const userRole = useMemo(() => user?.profile?.role, [user?.profile?.role])
  const userName = useMemo(() => user?.profile?.full_name || user?.email, [user?.profile?.full_name, user?.email])

  // Memoize permission checks
  const permissions = useMemo(() => {
    if (!userRole) return {
      canViewClients: false,
      canManageClients: false,
      canViewSKRs: false,
      canCreateSKRs: false,
      canManageFinance: false,
      canViewCompliance: false,
      canManageUsers: false,
      canViewAuditLogs: false,
    }

    return {
      canViewClients: ['admin', 'finance', 'operations', 'compliance'].includes(userRole),
      canManageClients: ['admin', 'finance'].includes(userRole),
      canViewSKRs: ['admin', 'finance', 'operations', 'compliance'].includes(userRole),
      canCreateSKRs: ['admin', 'finance', 'operations'].includes(userRole),
      canManageFinance: ['admin', 'finance'].includes(userRole),
      canViewCompliance: ['admin', 'compliance'].includes(userRole),
      canManageUsers: userRole === 'admin',
      canViewAuditLogs: ['admin', 'compliance'].includes(userRole),
    }
  }, [userRole])

  return {
    user,
    loading,
    isAuthenticated,
    userRole,
    userName,
    permissions,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }
}

/**
 * Hook for checking specific permissions
 * Returns a memoized function that checks if user has required role
 */
export function usePermissionCheck() {
  const { userRole } = useAuthOptimized()

  return useCallback((allowedRoles: UserRole[]) => {
    if (!userRole) return false
    return allowedRoles.includes(userRole)
  }, [userRole])
}

/**
 * Hook for role-based UI rendering
 * Returns boolean values for common permission checks
 */
export function useRolePermissions() {
  const { permissions } = useAuthOptimized()
  return permissions
}
