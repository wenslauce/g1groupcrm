'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { SKRStatusManager } from '@/components/skrs/skr-status-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Package, 
  Calendar,
  Hash,
  Download,
  Edit,
  Loader2
} from 'lucide-react'
import { SKRWithRelations } from '@/types'
import { skrUtils } from '@/lib/skr-utils'
import { clientUtils } from '@/lib/client-utils'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface SKRDetailsPageProps {
  params: { id: string }
}

export default function SKRDetailsPage({ params }: SKRDetailsPageProps) {
  const [skr, setSKR] = useState<SKRWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchSKR()
  }, [params.id])

  const fetchSKR = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/skrs/${params.id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch SKR')
      }
      
      setSKR(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = () => {
    fetchSKR() // Refresh data after updates
  }

  const handleGeneratePDF = async () => {
    if (!skr) return
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'skr',
          id: skr.id
        })
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType === 'application/pdf') {
          // Download PDF
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `SKR-${skr.skr_number}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const result = await response.json()
          alert(result.message || 'PDF generation not available')
        }
      } else {
        const error = await response.json()
        alert(`Failed to generate PDF: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !skr) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SKR Not Found</h1>
              <p className="text-muted-foreground">{error || 'The requested SKR could not be found'}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{skr.skr_number}</h1>
              <p className="text-muted-foreground">Secure Keeper Receipt Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={skrUtils.getStatusColor(skr.status)}>
              {skrUtils.getStatusDisplayName(skr.status)}
            </Badge>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
              <Download className="mr-2 h-4 w-4" />
              Generate PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* SKR Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  SKR Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">SKR Number</div>
                    <div className="text-lg font-mono font-bold">{skr.skr_number}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <Badge className={skrUtils.getStatusColor(skr.status)}>
                      {skrUtils.getStatusDisplayName(skr.status)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Created</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(skr.created_at)}
                    </div>
                  </div>
                  {skr.issue_date && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Issued</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(skr.issue_date)}
                      </div>
                    </div>
                  )}
                </div>

                {skr.hash && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Digital Hash</div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Hash className="h-4 w-4" />
                      <code className="text-xs font-mono break-all">{skr.hash}</code>
                    </div>
                  </div>
                )}

                {skr.remarks && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Remarks</div>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      {skr.remarks}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            {skr.client && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">{skr.client.name}</div>
                      <div className="text-sm text-muted-foreground">{skr.client.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={clientUtils.getTypeColor(skr.client.type)}>
                        {clientUtils.getTypeDisplayName(skr.client.type)}
                      </Badge>
                      <Badge className={clientUtils.getComplianceStatusColor(skr.client.compliance_status)}>
                        {clientUtils.getComplianceStatusDisplayName(skr.client.compliance_status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Country:</span>
                      <span className="ml-2">{skr.client.country}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk Level:</span>
                      <Badge className={clientUtils.getRiskLevelColor(skr.client.risk_level)}>
                        {clientUtils.getRiskLevelDisplayName(skr.client.risk_level)}
                      </Badge>
                    </div>
                    {skr.client.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-2">{skr.client.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Asset Information */}
            {skr.asset && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Asset Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">{skr.asset.asset_name}</div>
                      <div className="text-sm text-muted-foreground">{skr.asset.asset_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(skr.asset.declared_value, skr.asset.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">Declared Value</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Origin:</span>
                      <span className="ml-2">{skr.asset.origin}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Destination:</span>
                      <span className="ml-2">{skr.asset.destination || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="ml-2">{skr.asset.currency}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2">{formatDateTime(skr.asset.created_at)}</span>
                    </div>
                  </div>

                  {skr.asset.specifications && Object.keys(skr.asset.specifications).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Specifications</div>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(skr.asset.specifications, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <SKRStatusManager skr={skr} onUpdate={handleUpdate} />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Track Asset
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGeneratePDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generate PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
