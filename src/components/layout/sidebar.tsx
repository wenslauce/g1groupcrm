'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePermissions } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  AlertTriangle,
  Activity,
  Bell
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
      icon: BarChart3,
      show: true,
      children: [
        { name: 'SKR Analytics', href: '/dashboard/analytics/skrs', icon: FileText, show: permissions.canViewSKRs() },
        { name: 'Financial Analytics', href: '/dashboard/analytics/financial', icon: DollarSign, show: permissions.canManageFinance() },
        { name: 'Compliance Analytics', href: '/dashboard/analytics/compliance', icon: Shield, show: permissions.canViewCompliance() },
      ].filter(child => child.show),
    },
    {
      name: 'Administration',
      icon: Settings,
      show: permissions.canManageUsers(),
      children: [
        { name: 'User Management', href: '/dashboard/admin/users', icon: Users, show: permissions.canManageUsers() },
        { name: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell, show: permissions.canManageUsers() },
        { name: 'Audit Logs', href: '/dashboard/audit', icon: FileText, show: permissions.canViewAuditLogs() },
        { name: 'Activity Monitor', href: '/dashboard/monitoring/activity', icon: Activity, show: permissions.canViewAuditLogs() },
        { name: 'Security Monitor', href: '/dashboard/monitoring/security', icon: Shield, show: permissions.canManageUsers() },
      ].filter(child => child.show),
    },
  ].filter(item => item.show)

  return (
    <div className={cn('w-64 h-full flex flex-col', className)}>
      {/* Fixed Header */}
      <div className="px-3 py-4 border-b">
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

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-4">
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

              // Only render as Link if item has href
              if (item.href) {
                return (
                  <Link key={item.name} href={item.href}>
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
              }

              // For items without href (shouldn't happen after filtering), render as disabled button
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                  disabled
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Fixed Footer */}
      <div className="px-3 py-4 border-t">
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
  )
}