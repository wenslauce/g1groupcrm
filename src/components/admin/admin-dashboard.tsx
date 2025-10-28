'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Settings, 
  Bell, 
  Shield, 
  Activity,
  FileText,
  BarChart3,
  AlertTriangle
} from 'lucide-react'

export function AdminDashboard() {
  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage system users, roles, and permissions',
      icon: Users,
      href: '/dashboard/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: Settings,
      href: '/dashboard/admin/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Notifications',
      description: 'Manage notification settings and templates',
      icon: Bell,
      href: '/dashboard/admin/notifications',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Security Monitor',
      description: 'Monitor security events and system access',
      icon: Shield,
      href: '/dashboard/monitoring/security',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Activity Monitor',
      description: 'Track user activities and system usage',
      icon: Activity,
      href: '/dashboard/monitoring/activity',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Audit Logs',
      description: 'View comprehensive audit trails and reports',
      icon: FileText,
      href: '/dashboard/audit',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Analytics',
      description: 'System performance and usage analytics',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Compliance',
      description: 'Compliance monitoring and risk assessment',
      icon: AlertTriangle,
      href: '/dashboard/compliance',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Administration
        </h1>
        <p className="text-muted-foreground">
          Manage system settings, users, and monitor system health
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.href} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${section.color}`} />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription className="text-sm">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={section.href}>
                  <Button variant="outline" className="w-full">
                    Access {section.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Events</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">Good</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}