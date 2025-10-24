'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  FileText, 
  Users, 
  DollarSign, 
  Shield, 
  BarChart3,
  Settings,
  Plus,
  Search,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const permissions = usePermissions()

  const navigation = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: BarChart3,
      current: pathname === '/dashboard',
      show: true,
    },
    {
      name: 'SKR Management',
      icon: FileText,
      show: permissions.canViewSKRs(),
      children: [
        { name: 'All SKRs', href: '/dashboard/skrs', icon: FileText, show: permissions.canViewSKRs() },
        { name: 'Create SKR', href: '/dashboard/skrs/create', icon: Plus, show: permissions.canCreateSKRs() },
        { name: 'Tracking', href: '/dashboard/skrs/tracking', icon: TrendingUp, show: permissions.canViewSKRs() },
      ].filter(child => child.show),
    },
    {
      name: 'Client Management',
      icon: Users,
      show: permissions.canViewClients(),
      children: [
        { name: 'All Clients', href: '/dashboard/clients', icon: Users, show: permissions.canViewClients() },
        { name: 'Add Client', href: '/dashboard/clients/create', icon: Plus, show: permissions.canManageClients() },
        { name: 'KYC Pending', href: '/dashboard/clients/kyc-pending', icon: AlertTriangle, show: permissions.canViewCompliance() },
      ].filter(child => child.show),
    },
    {
      name: 'Financial Operations',
      icon: DollarSign,
      show: permissions.canManageFinance(),
      children: [
        { name: 'Invoices', href: '/dashboard/finance/invoices', icon: FileText, show: permissions.canManageFinance() },
        { name: 'Receipts', href: '/dashboard/finance/receipts', icon: FileText, show: permissions.canManageFinance() },
        { name: 'Credit Notes', href: '/dashboard/finance/credit-notes', icon: FileText, show: permissions.canManageFinance() },
      ].filter(child => child.show),
    },
    {
      name: 'Compliance',
      href: '/dashboard/compliance',
      icon: Shield,
      current: pathname.startsWith('/dashboard/compliance'),
      show: permissions.canViewCompliance(),
    },
    {
      name: 'Reports & Analytics',
      href: '/dashboard/reports',
      icon: BarChart3,
      current: pathname.startsWith('/dashboard/reports'),
      show: true,
    },
    {
      name: 'Administration',
      icon: Settings,
      show: permissions.canManageUsers(),
      children: [
        { name: 'User Management', href: '/dashboard/admin/users', icon: Users, show: permissions.canManageUsers() },
        { name: 'Audit Logs', href: '/dashboard/admin/audit', icon: FileText, show: permissions.canViewAuditLogs() },
      ].filter(child => child.show),
    },
  ].filter(item => item.show)

  return (
    <div className={cn('pb-12 w-64', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-4">
            <Building2 className="h-8 w-8 text-g1-primary mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-g1-primary">G1 Holdings</h2>
              <p className="text-xs text-muted-foreground">Command Center</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Search...
            </Button>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              if (item.children && item.children.length > 0) {
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center px-2 py-2 text-sm font-medium text-muted-foreground">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </div>
                    <div className="ml-6 space-y-1">
                      {item.children.map((child) => {
                        const isActive = pathname === child.href || pathname.startsWith(child.href + '/')
                        return (
                          <Link key={child.name} href={child.href}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className="w-full justify-start"
                              size="sm"
                            >
                              <child.icon className="mr-2 h-4 w-4" />
                              {child.name}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              return (
                <Link key={item.name} href={item.href!}>
                  <Button
                    variant={item.current ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
        
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link href="/dashboard/settings">
              <Button
                variant={pathname.startsWith('/dashboard/settings') ? "secondary" : "ghost"}
                className="w-full justify-start"
                size="sm"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}