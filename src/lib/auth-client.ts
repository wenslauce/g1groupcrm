import { createClient } from '@/lib/supabase/client'
import { UserRole, UserProfile } from '@/types'

export interface AuthUser {
  id: string
  email: string
  profile?: UserProfile
}

export interface SignUpData {
  email: string
  password: string
  name: string
  role: UserRole
  department?: string
}

export interface SignInData {
  email: string
  password: string
}

// Client-side auth functions
export const authClient = {
  async signUp(data: SignUpData) {
    const supabase = createClient()
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
          department: data.department,
        }
      }
    })

    if (authError) {
      throw new Error(authError.message)
    }

    // Create user profile after successful signup
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: data.name,
          role: data.role,
          department: data.department,
          email: data.email,
          status: 'active'
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Don't throw here as the user was created successfully
      }
    }

    return authData
  },

  async signIn(data: SignInData) {
    console.log('authClient.signIn called with:', { email: data.email, password: data.password ? '***' : 'empty' })
    const supabase = createClient()
    
    console.log('Calling supabase.auth.signInWithPassword...')
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    console.log('Supabase auth response:', { authData: authData ? 'success' : 'null', error: error?.message || 'none' })

    if (error) {
      console.error('Supabase auth error:', error)
      throw new Error(error.message)
    }

    console.log('Sign in successful, returning auth data')
    return authData
  },

  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(error.message)
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    console.log('getCurrentUser called')
    const supabase = createClient()
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('Supabase getUser result:', { user: user ? 'found' : 'null', error: error?.message || 'none' })
      
      if (error || !user) {
        console.log('No user found or error occurred')
        return null
      }

      // Get user profile with error handling
      console.log('Fetching user profile for user:', user.id)
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('Profile fetch result:', { profile: profile ? 'found' : 'null', error: profileError?.message || 'none' })

      if (profileError) {
        console.warn('Error fetching user profile:', profileError)
        // Return user without profile if profile fetch fails
        const authUser = {
          id: user.id,
          email: user.email!,
          profile: undefined
        }
        console.log('Returning user without profile:', authUser)
        return authUser
      }

      const authUser = {
        id: user.id,
        email: user.email!,
        profile: profile || undefined
      }
      console.log('Returning user with profile:', authUser)
      return authUser
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  async updateProfile(updates: Partial<UserProfile>) {
    const supabase = createClient()
    const user = await this.getCurrentUser()
    
    if (!user) {
      throw new Error('No authenticated user')
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async changePassword(newPassword: string) {
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }
  },

  async resetPassword(email: string) {
    const supabase = createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      throw new Error(error.message)
    }
  }
}

// Permission checking utilities
export const permissions = {
  canViewClients(role: UserRole): boolean {
    return ['admin', 'finance', 'operations', 'compliance'].includes(role)
  },

  canManageClients(role: UserRole): boolean {
    return ['admin', 'finance'].includes(role)
  },

  canViewSKRs(role: UserRole): boolean {
    return ['admin', 'finance', 'operations', 'compliance'].includes(role)
  },

  canCreateSKRs(role: UserRole): boolean {
    return ['admin', 'finance', 'operations'].includes(role)
  },

  canManageFinance(role: UserRole): boolean {
    return ['admin', 'finance'].includes(role)
  },

  canViewCompliance(role: UserRole): boolean {
    return ['admin', 'compliance'].includes(role)
  },

  canManageUsers(role: UserRole): boolean {
    return role === 'admin'
  },

  canViewAuditLogs(role: UserRole): boolean {
    return ['admin', 'compliance'].includes(role)
  }
}

// Role display utilities
export const roleUtils = {
  getRoleDisplayName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      admin: 'Administrator',
      finance: 'Finance Manager',
      operations: 'Operations Manager',
      compliance: 'Compliance Officer',
      read_only: 'Read Only User'
    }
    return roleNames[role]
  },

  getRoleColor(role: UserRole): string {
    const roleColors: Record<UserRole, string> = {
      admin: 'bg-red-100 text-red-800',
      finance: 'bg-green-100 text-green-800',
      operations: 'bg-blue-100 text-blue-800',
      compliance: 'bg-yellow-100 text-yellow-800',
      read_only: 'bg-gray-100 text-gray-800'
    }
    return roleColors[role]
  },

  getAllRoles(): { value: UserRole; label: string }[] {
    return [
      { value: 'admin', label: 'Administrator' },
      { value: 'finance', label: 'Finance Manager' },
      { value: 'operations', label: 'Operations Manager' },
      { value: 'compliance', label: 'Compliance Officer' },
      { value: 'read_only', label: 'Read Only User' }
    ]
  }
}