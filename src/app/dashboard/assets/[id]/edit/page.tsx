'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AssetForm } from '@/components/assets/asset-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AssetWithRelations } from '@/types'

interface EditAssetPageProps {
  params: { id: string }
}

export default function EditAssetPage({ params }: EditAssetPageProps) {
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

  const handleSave = () => {
    router.push(`/dashboard/assets/${params.id}`)
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !asset) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
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
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations']}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
            <p className="text-muted-foreground">
              Update asset details for {asset.asset_name}
            </p>
          </div>
        </div>

        <AssetForm 
          asset={asset} 
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </ProtectedRoute>
  )
}