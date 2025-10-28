'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Package, 
  User, 
  Calendar,
  DollarSign,
  Edit,
  Loader2,
  MapPin,
  FileText
} from 'lucide-react'
import { AssetWithRelations } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface AssetDetailsPageProps {
  params: { id: string }
}

export default function AssetDetailsPage({ params }: AssetDetailsPageProps) {
  const [asset, setAsset] = useState<AssetWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchAsset()
  }, [params.id])

  const fetchAsset = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/assets/${params.id}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch asset')
      }
      
      setAsset(result.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
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

  if (error || !asset) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Asset Not Found</h1>
              <p className="text-muted-foreground">{error || 'The requested asset could not be found'}</p>
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
              <h1 className="text-3xl font-bold tracking-tight">{asset.asset_name}</h1>
              <p className="text-muted-foreground">Asset Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/assets/${asset.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Asset Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Asset Name</div>
                    <div className="text-lg font-semibold">{asset.asset_name}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Asset Type</div>
                    <Badge variant="secondary">{asset.asset_type}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Declared Value</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(asset.declared_value, asset.currency)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Currency</div>
                    <div className="text-lg">{asset.currency}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Origin</div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {asset.origin}
                    </div>
                  </div>
                  {asset.destination && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Destination</div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {asset.destination}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Created</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(asset.created_at)}
                    </div>
                  </div>
                </div>

                {asset.specifications && Object.keys(asset.specifications).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Specifications</div>
                    <div className="p-3 bg-muted rounded-lg">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(asset.specifications, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            {asset.client && (
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
                      <div className="text-lg font-semibold">{asset.client.name}</div>
                      <div className="text-sm text-muted-foreground">{asset.client.email}</div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/clients/${asset.client.id}`}>
                        View Client
                      </a>
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2">{asset.client.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Country:</span>
                      <span className="ml-2">{asset.client.country}</span>
                    </div>
                    {asset.client.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-2">{asset.client.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related SKRs */}
            {asset.skrs && asset.skrs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related SKRs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {asset.skrs.map((skr) => (
                      <div key={skr.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-semibold">{skr.skr_number}</div>
                          <div className="text-sm text-muted-foreground">
                            Status: {skr.status} • Created: {new Date(skr.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/dashboard/skrs/${skr.id}`}>
                            View SKR
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Asset Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatCurrency(asset.declared_value, asset.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">Declared Value</div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{asset.asset_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origin:</span>
                    <span>{asset.origin}</span>
                  </div>
                  {asset.destination && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destination:</span>
                      <span>{asset.destination}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/skrs/create?asset_id=${asset.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create SKR
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/assets/${asset.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Asset
                </Button>
                {asset.client && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={`/dashboard/clients/${asset.client.id}`}>
                      <User className="mr-2 h-4 w-4" />
                      View Client
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}