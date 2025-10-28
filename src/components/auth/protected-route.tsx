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
    console.log('ProtectedRoute useEffect:', { user, loading, requiredRoles })
    if (!loading) {
      // Not authenticated
      if (!user) {
        console.log('No user found, redirecting to login')
        router.push(fallbackUrl)
        return
      }

      console.log('User authenticated:', user)

      // Check role requirements
      if (requiredRoles.length > 0 && user.profile) {
        const hasRequiredRole = requiredRoles.includes(user.profile.role)
        console.log('Role check:', { userRole: user.profile.role, requiredRoles, hasRequiredRole })
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-g1-primary" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Authenticating...</p>
            <p className="text-xs text-muted-foreground">Please wait while we verify your credentials</p>
          </div>
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