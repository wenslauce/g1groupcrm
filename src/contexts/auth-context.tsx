'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthUser, authClient } from '@/lib/auth-client'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: {
    email: string
    password: string
    name: string
    role: string
    department?: string
  }) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    // Get initial session with caching
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          if (session?.user) {
            const authUser = await authClient.getCurrentUser()
            setUser(authUser)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes with debouncing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user })
        if (!mounted) return

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('User signed in, fetching user profile...')
            const authUser = await authClient.getCurrentUser()
            console.log('User profile fetched:', authUser)
            setUser(authUser)
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out')
            setUser(null)
          }
          setLoading(false)
        } catch (error) {
          console.error('Error handling auth state change:', error)
          if (mounted) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext signIn called with:', { email, password: password ? '***' : 'empty' })
    setLoading(true)
    try {
      console.log('Calling authClient.signIn...')
      await authClient.signIn({ email, password })
      console.log('authClient.signIn completed successfully')
      // User state will be updated by the auth state change listener
      // Don't set loading to false here - let the auth state change listener handle it
    } catch (error) {
      console.error('AuthContext signIn error:', error)
      setLoading(false)
      throw error
    }
  }

  const signUp = async (data: {
    email: string
    password: string
    name: string
    role: string
    department?: string
  }) => {
    setLoading(true)
    try {
      await authClient.signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role as any,
        department: data.department
      })
      // User state will be updated by the auth state change listener
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authClient.signOut()
      setUser(null)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const updateProfile = async (updates: any) => {
    if (!user) throw new Error('No authenticated user')
    
    try {
      const updatedProfile = await authClient.updateProfile(updates)
      setUser({
        ...user,
        profile: updatedProfile
      })
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for checking permissions
export function usePermissions() {
  const { user } = useAuth()
  
  const hasRole = (allowedRoles: string[]) => {
    if (!user?.profile) return false
    return allowedRoles.includes(user.profile.role)
  }

  const canViewClients = () => hasRole(['admin', 'finance', 'operations', 'compliance'])
  const canManageClients = () => hasRole(['admin', 'finance'])
  const canViewSKRs = () => hasRole(['admin', 'finance', 'operations', 'compliance'])
  const canCreateSKRs = () => hasRole(['admin', 'finance', 'operations'])
  const canManageFinance = () => hasRole(['admin', 'finance'])
  const canViewCompliance = () => hasRole(['admin', 'compliance'])
  const canManageUsers = () => hasRole(['admin'])
  const canViewAuditLogs = () => hasRole(['admin', 'compliance'])

  return {
    hasRole,
    canViewClients,
    canManageClients,
    canViewSKRs,
    canCreateSKRs,
    canManageFinance,
    canViewCompliance,
    canManageUsers,
    canViewAuditLogs
  }
}