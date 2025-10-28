'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Shield,
  Activity,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    totalClients: number
    activeSKRs: number
    complianceScore: number
    revenueChange: number
    clientsChange: number
    skrsChange: number
    complianceChange: number
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    status: string
  }>
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/overview?period=${selectedPeriod}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      // Mock data for demo
      setData({
        overview: {
          totalRevenue: 2450000,
          totalClients: 156,
          activeSKRs: 89,
          complianceScore: 98.5,
          revenueChange: 12.5,
          clientsChange: 8.2,
          skrsChange: 15.3,
          complianceChange: 2.1
        },
        recentActivity: [
          {
            id: '1',
            type: 'revenue',
            description: 'New invoice payment received',
            timestamp: '2 hours ago',
            status: 'completed'
          },
          {
            id: '2',
            type: 'client',
            description: 'New client onboarded',
            timestamp: '4 hours ago',
            status: 'completed'
          },
          {
            id: '3',
            type: 'skr',
            description: 'SKR status updated to delivered',
            timestamp: '6 hours ago',
            status: 'completed'
          },
          {
            id: '4',
            type: 'compliance',
            description: 'KYC document approved',
            timestamp: '8 hours ago',
            status: 'completed'
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getChangeIcon = (change: number) => {
    return change > 0 ? TrendingUp : TrendingDown
  }

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-600' : 'text-red-600'
  }

  const analyticsModules = [
    {
      title: 'Financial Analytics',
      description: 'Revenue, expenses, and financial performance metrics',
      href: '/dashboard/analytics/financial',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'SKR Analytics',
      description: 'SKR processing times, status distribution, and trends',
      href: '/dashboard/analytics/skrs',
      icon: Package,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Compliance Analytics',
      description: 'Compliance scores, risk assessments, and audit metrics',
      href: '/dashboard/analytics/compliance',
      icon: Shield,
      color: 'bg-purple-100 text-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <Button onClick={fetchAnalyticsData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span className="font-medium">Period:</span>
        </div>
        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="quarter">This Quarter</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data.overview.totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {React.createElement(getChangeIcon(data.overview.revenueChange), {
                    className: `h-4 w-4 ${getChangeColor(data.overview.revenueChange)}`
                  })}
                  <span className={`text-sm ${getChangeColor(data.overview.revenueChange)}`}>
                    {formatPercentage(data.overview.revenueChange)}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{data.overview.totalClients}</p>
                <div className="flex items-center gap-1 mt-1">
                  {React.createElement(getChangeIcon(data.overview.clientsChange), {
                    className: `h-4 w-4 ${getChangeColor(data.overview.clientsChange)}`
                  })}
                  <span className={`text-sm ${getChangeColor(data.overview.clientsChange)}`}>
                    {formatPercentage(data.overview.clientsChange)}
                  </span>
                </div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active SKRs</p>
                <p className="text-2xl font-bold">{data.overview.activeSKRs}</p>
                <div className="flex items-center gap-1 mt-1">
                  {React.createElement(getChangeIcon(data.overview.skrsChange), {
                    className: `h-4 w-4 ${getChangeColor(data.overview.skrsChange)}`
                  })}
                  <span className={`text-sm ${getChangeColor(data.overview.skrsChange)}`}>
                    {formatPercentage(data.overview.skrsChange)}
                  </span>
                </div>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{data.overview.complianceScore}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {React.createElement(getChangeIcon(data.overview.complianceChange), {
                    className: `h-4 w-4 ${getChangeColor(data.overview.complianceChange)}`
                  })}
                  <span className={`text-sm ${getChangeColor(data.overview.complianceChange)}`}>
                    {formatPercentage(data.overview.complianceChange)}
                  </span>
                </div>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Modules</CardTitle>
          <CardDescription>Detailed analytics for different business areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analyticsModules.map((module) => (
              <Link key={module.title} href={module.href}>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-lg ${module.color}`}>
                        <module.icon className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest business activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'revenue' ? 'bg-green-100' :
                    activity.type === 'client' ? 'bg-blue-100' :
                    activity.type === 'skr' ? 'bg-yellow-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'revenue' && <DollarSign className="h-4 w-4 text-green-600" />}
                    {activity.type === 'client' && <Users className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'skr' && <Package className="h-4 w-4 text-yellow-600" />}
                    {activity.type === 'compliance' && <Shield className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
                <Badge variant="default">
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common analytics tasks and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Generate Report</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>View Trends</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Users className="h-6 w-6" />
              <span>Client Analysis</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Shield className="h-6 w-6" />
              <span>Compliance Check</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}