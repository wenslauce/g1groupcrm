'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth, usePermissions } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { GlobalSearchBar } from '@/components/search/global-search-bar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Building2, 
  FileText, 
  Users, 
  DollarSign, 
  Shield, 
  BarChart3,
  Settings,
  LogOut,
  User,
  Search,
  Menu
} from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const permissions = usePermissions()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      <div className="container flex h-16 items-center px-4">
        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col h-full">
                <div className="flex items-center space-x-2 mb-6">
                  <Building2 className="h-6 w-6 text-g1-primary" />
                  <span className="font-bold text-g1-primary">G1 Holdings</span>
                </div>
                
                <nav className="flex-1 space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:text-foreground/80 ${
                          isActive ? 'text-foreground bg-accent' : 'text-foreground/60'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
                
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 text-sm mb-4">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{user?.profile?.name || user?.email}</span>
                    {user?.profile?.role && (
                      <Badge variant="secondary" className="text-xs">
                        {user.profile.role}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo and Brand */}
        <div className="mr-4 flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-g1-primary" />
            <span className="hidden font-bold sm:inline-block text-g1-primary">
              G1 Holdings
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 text-sm font-medium flex-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:text-foreground/80 ${
                  isActive ? 'text-foreground bg-accent' : 'text-foreground/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Search and Actions */}
        <div className="flex items-center space-x-2 ml-auto">
          {/* Search Bar - Responsive */}
          <div className="hidden sm:block w-64 lg:w-80">
            <GlobalSearchBar className="w-full" />
          </div>
          
          {/* Mobile Search Button */}
          <Button variant="ghost" size="icon" className="sm:hidden">
            <Search className="h-4 w-4" />
          </Button>
          
          {/* User Actions */}
          <div className="flex items-center space-x-1">
            {/* User info - Desktop only */}
            <div className="hidden lg:flex items-center space-x-2 text-sm mr-2">
              <User className="h-4 w-4" />
              <span className="font-medium max-w-32 truncate">
                {user?.profile?.name || user?.email}
              </span>
              {user?.profile?.role && (
                <Badge variant="secondary" className="text-xs">
                  {user.profile.role}
                </Badge>
              )}
            </div>
            
            <NotificationCenter />
            
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}