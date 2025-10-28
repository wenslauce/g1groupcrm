'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Shield,
  Clock,
  Filter
} from 'lucide-react'

export function ReportsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const reportCategories = [
    {
      id: 'financial',
      title: 'Financial Reports',
      description: 'Revenue, expenses, and financial performance',
      icon: DollarSign,
      reports: [
        { name: 'Revenue Report', description: 'Monthly revenue breakdown', status: 'available' },
        { name: 'Invoice Summary', description: 'Invoice status and aging', status: 'available' },
        { name: 'Payment Analysis', description: 'Payment trends and methods', status: 'available' },
        { name: 'Profit & Loss', description: 'P&L statement', status: 'available' }
      ]
    },
    {
      id: 'operations',
      title: 'Operations Reports',
      description: 'SKR processing and asset management',
      icon: Package,
      reports: [
        { name: 'SKR Activity Report', description: 'SKR creation and status changes', status: 'available' },
        { name: 'Asset Inventory', description: 'Current asset holdings', status: 'available' },
        { name: 'Processing Times', description: 'Average processing durations', status: 'available' },
        { name: 'Location Tracking', description: 'Asset movement history', status: 'available' }
      ]
    },
    {
      id: 'clients',
      title: 'Client Reports',
      description: 'Client activity and relationship management',
      icon: Users,
      reports: [
        { name: 'Client Activity', description: 'Client transaction history', status: 'available' },
        { name: 'New Client Acquisition', description: 'Client onboarding metrics', status: 'available' },
        { name: 'Client Risk Profile', description: 'Risk assessment summary', status: 'available' },
        { name: 'KYC Compliance', description: 'KYC document status', status: 'available' }
      ]
    },
    {
      id: 'compliance',
      title: 'Compliance Reports',
      description: 'Regulatory compliance and audit trails',
      icon: Shield,
      reports: [
        { name: 'Audit Trail', description: 'Complete system audit log', status: 'available' },
        { name: 'Compliance Status', description: 'Regulatory compliance overview', status: 'available' },
        { name: 'Risk Assessment', description: 'Risk evaluation summary', status: 'available' },
        { name: 'Security Events', description: 'Security incidents and alerts', status: 'available' }
      ]
    }
  ]

  const quickStats = [
    { label: 'Reports Generated', value: '1,247', change: '+12%', icon: FileText },
    { label: 'Data Points', value: '45.2K', change: '+8%', icon: BarChart3 },
    { label: 'Active Reports', value: '16', change: '+2', icon: TrendingUp },
    { label: 'Scheduled Reports', value: '8', change: '0', icon: Clock }
  ]

  const handleGenerateReport = async (reportName: string, category: string) => {
    // Mock report generation
    alert(`Generating ${reportName} report for ${selectedPeriod} period...`)
  }

  const handleDownloadReport = (reportName: string) => {
    // Mock download
    alert(`Downloading ${reportName}...`)
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-600'}>
                      {stat.change}
                    </span> from last period
                  </p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Categories */}
      <Tabs defaultValue="financial" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {selectedPeriod === 'month' ? 'This Month' : 
               selectedPeriod === 'quarter' ? 'This Quarter' : 'This Year'}
            </Button>
          </div>
        </div>

        {reportCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  <div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.reports.map((report) => (
                    <Card key={report.name} className="border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{report.name}</h4>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                          </div>
                          <Badge variant={report.status === 'available' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleGenerateReport(report.name, category.id)}
                            disabled={report.status !== 'available'}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Generate
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadReport(report.name)}
                            disabled={report.status !== 'available'}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Recently generated reports and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Monthly Revenue Report', generated: '2 hours ago', status: 'completed', size: '2.4 MB' },
              { name: 'SKR Activity Summary', generated: '1 day ago', status: 'completed', size: '1.8 MB' },
              { name: 'Client Risk Assessment', generated: '2 days ago', status: 'completed', size: '3.1 MB' },
              { name: 'Compliance Audit Trail', generated: '3 days ago', status: 'completed', size: '5.2 MB' }
            ].map((report) => (
              <div key={report.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated {report.generated} • {report.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    {report.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>Automatically generated reports and their schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Weekly Financial Summary', schedule: 'Every Monday 9:00 AM', nextRun: 'Tomorrow 9:00 AM' },
              { name: 'Monthly Compliance Report', schedule: 'First day of month', nextRun: 'Dec 1, 2024' },
              { name: 'Daily Operations Summary', schedule: 'Every day 6:00 PM', nextRun: 'Today 6:00 PM' },
              { name: 'Quarterly Business Review', schedule: 'Every quarter end', nextRun: 'Dec 31, 2024' }
            ].map((report) => (
              <div key={report.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">{report.schedule}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Next: {report.nextRun}</p>
                  <Button size="sm" variant="outline" className="mt-1">
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}