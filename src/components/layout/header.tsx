'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, usePermissions } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  FileText, 
  Users, 
  DollarSign, 
  Shield, 
  BarChart3,
  Settings,
  LogOut,
  Bell,
  User
} from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const permissions = usePermissions()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, show: true },
    { name: 'SKRs', href: '/dashboard/skrs', icon: FileText, show: permissions.canViewSKRs() },
    { name: 'Clients', href: '/dashboard/clients', icon: Users, show: permissions.canViewClients() },
    { name: 'Finance', href: '/dashboard/finance', icon: DollarSign, show: permissions.canManageFinance() },
    { name: 'Compliance', href: '/dashboard/compliance', icon: Shield, show: permissions.canViewCompliance() },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, show: true },
  ].filter(item => item.show)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-g1-primary" />
            <span className="hidden font-bold sm:inline-block text-g1-primary">
              G1 Holdings
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 transition-colors hover:text-foreground/80 ${
                    isActive ? 'text-foreground' : 'text-foreground/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search will go here */}
          </div>
          
          <nav className="flex items-center space-x-2">
            {/* User info */}
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">{user?.profile?.name || user?.email}</span>
              {user?.profile?.role && (
                <Badge variant="secondary" className="text-xs">
                  {user.profile.role}
                </Badge>
              )}
            </div>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                3
              </Badge>
            </Button>
            
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}