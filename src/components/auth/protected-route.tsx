'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  fallbackUrl?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallbackUrl = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user) {
        router.push(fallbackUrl)
        return
      }

      // Check role requirements
      if (requiredRoles.length > 0 && user.profile) {
        const hasRequiredRole = requiredRoles.includes(user.profile.role)
        if (!hasRequiredRole) {
          router.push('/dashboard/unauthorized')
          return
        }
      }
    }
  }, [user, loading, requiredRoles, router, fallbackUrl])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated or doesn't have required role
  if (!user) {
    return null
  }

  if (requiredRoles.length > 0 && user.profile) {
    const hasRequiredRole = requiredRoles.includes(user.profile.role)
    if (!hasRequiredRole) {
      return null
    }
  }

  return <>{children}</>
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}