import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  // Mock data - will be replaced with real data from Supabase
  const stats = {
    total_skrs: 1247,
    active_skrs: 89,
    total_clients: 342,
    pending_compliance: 12,
    total_invoices: 567,
    outstanding_amount: 2450000,
  }

  const recentActivities = [
    {
      id: '1',
      action: 'SKR Created',
      resource: 'G1-SKR-2024-00123',
      user: 'John Smith',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      id: '2',
      action: 'Client Approved',
      resource: 'ABC Corp Ltd',
      user: 'Sarah Johnson',
      timestamp: '15 minutes ago',
      status: 'success'
    },
    {
      id: '3',
      action: 'Invoice Generated',
      resource: 'G1-INV-202412-0045',
      user: 'Mike Davis',
      timestamp: '1 hour ago',
      status: 'info'
    },
    {
      id: '4',
      action: 'KYC Review Required',
      resource: 'XYZ Holdings',
      user: 'System',
      timestamp: '2 hours ago',
      status: 'warning'
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your G1 Holdings command center
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/skrs/create">
            <Button className="bg-g1-primary hover:bg-g1-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create SKR
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKRs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_skrs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active SKRs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_skrs}</div>
            <p className="text-xs text-muted-foreground">
              Currently in transit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_clients}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600">{stats.pending_compliance}</span> pending compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.outstanding_amount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.total_invoices} invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activities */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest actions and updates in your system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {activity.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {activity.status === 'info' && (
                      <Clock className="h-5 w-5 text-blue-500" />
                    )}
                    {activity.status === 'warning' && (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.resource} • by {activity.user}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
                    {activity.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/skrs/create">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create New SKR
              </Button>
            </Link>
            <Link href="/dashboard/clients/create">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Add New Client
              </Button>
            </Link>
            <Link href="/dashboard/finance/invoices">
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
            </Link>
            <Link href="/dashboard/compliance">
              <Button className="w-full justify-start" variant="outline">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Review Compliance
                <Badge variant="warning" className="ml-auto">
                  {stats.pending_compliance}
                </Badge>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SKR Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Draft</span>
                <Badge variant="secondary">23</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">In Transit</span>
                <Badge variant="info">89</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Delivered</span>
                <Badge variant="success">1,135</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Approved</span>
                <Badge variant="success">298</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Under Review</span>
                <Badge variant="warning">32</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <Badge variant="destructive">12</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Paid Invoices</span>
                <Badge variant="success">445</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Payment</span>
                <Badge variant="warning">89</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Overdue</span>
                <Badge variant="destructive">33</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}