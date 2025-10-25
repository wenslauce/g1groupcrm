import { createClient } from '@/lib/supabase/server'
import { UserRole, UserProfile } from '@/types'

export interface AuthUser {
  id: string
  email: string
  profile?: UserProfile
}

// Server-side auth functions
export const authServer = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email!,
      profile: profile || undefined
    }
  },

  async requireAuth(): Promise<AuthUser> {
    const user = await this.getCurrentUser()
    
    if (!user) {
      throw new Error('Authentication required')
    }

    return user
  },

  async requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
    const user = await this.requireAuth()
    
    if (!user.profile || !allowedRoles.includes(user.profile.role)) {
      throw new Error('Insufficient permissions')
    }

    return user
  }
}