'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Clock, 
  Route, 
  Navigation, 
  Loader2, 
  AlertTriangle,
  ArrowLeft,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { SKRWithRelations, TrackingRecord } from '@/types'
import { skrUtils } from '@/lib/skr-utils'
import { TrackingDashboard } from '@/components/tracking/tracking-dashboard'

export default function IndividualSKRTrackingPage() {
  const params = useParams()
  const [skr, setSkr] = useState<SKRWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchSKR()
    }
  }, [params.id])

  const fetchSKR = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/skrs/${params.id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch SKR')
      }
      
      setSkr(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{error}</p>
              <Button onClick={fetchSKR} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!skr) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">SKR Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The requested SKR could not be found.
              </p>
              <Link href="/dashboard/skrs/tracking">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Tracking
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const client = Array.isArray(skr.client) ? skr.client[0] : skr.client
  const asset = Array.isArray(skr.asset) ? skr.asset[0] : skr.asset

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/skrs/tracking">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracking
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SKR Tracking</h1>
          <p className="text-muted-foreground">
            Tracking details for {skr.skr_number}
          </p>
        </div>
      </div>

      {/* SKR Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{skr.skr_number}</CardTitle>
              <CardDescription>
                {client?.name || 'Unknown Client'} • {asset?.asset_name || 'Unknown Asset'}
              </CardDescription>
            </div>
            <Badge className={skrUtils.getStatusColor(skr.status as any)}>
              {skrUtils.getStatusDisplayName(skr.status as any)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Client</div>
              <div>{client?.name || 'Unknown'}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Asset</div>
              <div>{asset?.asset_name || 'Unknown'}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Value</div>
              <div>{asset?.declared_value ? `$${asset.declared_value.toLocaleString()}` : 'Unknown'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Dashboard */}
      <TrackingDashboard skr={skr} />
    </div>
  )
}
