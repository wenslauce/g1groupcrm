'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, X, Package, DollarSign, MapPin } from 'lucide-react'
import { AssetWithRelations, ClientWithRelations } from '@/types'
import { skrUtils } from '@/lib/skr-utils'

interface AssetFormProps {
  asset?: AssetWithRelations | null
  onSave?: () => void
  onCancel?: () => void
}

export function AssetForm({ asset, onSave, onCancel }: AssetFormProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    asset_name: '',
    asset_type: '',
    declared_value: '',
    currency: 'USD',
    origin: '',
    destination: '',
    specifications: ''
  })
  const [clients, setClients] = useState<ClientWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()
  const isEditing = !!asset

  useEffect(() => {
    fetchClients()
    if (asset) {
      setFormData({
        client_id: asset.client_id || '',
        asset_name: asset.asset_name || '',
        asset_type: asset.asset_type || '',
        declared_value: asset.declared_value?.toString() || '',
        currency: asset.currency || 'USD',
        origin: asset.origin || '',
        destination: asset.destination || '',
        specifications: asset.specifications ? JSON.stringify(asset.specifications, null, 2) : ''
      })
    }
  }, [asset])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100')
      const result = await response.json()
      if (response.ok) {
        setClients(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const url = isEditing ? `/api/assets/${asset!.id}` : '/api/assets'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        declared_value: parseFloat(formData.declared_value),
        specifications: formData.specifications ? JSON.parse(formData.specifications) : {}
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save asset')
      }

      setSuccess(`Asset ${isEditing ? 'updated' : 'created'} successfully!`)
      
      if (onSave) {
        setTimeout(() => onSave(), 1000)
      } else {
        setTimeout(() => {
          router.push('/dashboard/assets')
        }, 1000)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const assetTypes = skrUtils.getAssetTypes()
  const currencies = skrUtils.getCurrencies()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {isEditing ? 'Edit Asset' : 'Add New Asset'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update asset information and specifications'
                : 'Create a new asset record for secure storage'
              }
            </CardDescription>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4" />
              <h3 className="text-lg font-medium">Asset Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => updateFormData('client_id', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset_name">Asset Name *</Label>
                <Input
                  id="asset_name"
                  value={formData.asset_name}
                  onChange={(e) => updateFormData('asset_name', e.target.value)}
                  placeholder="Enter asset name"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset_type">Asset Type *</Label>
                <Select
                  value={formData.asset_type}
                  onValueChange={(value) => updateFormData('asset_type', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="declared_value">Declared Value *</Label>
                <Input
                  id="declared_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.declared_value}
                  onChange={(e) => updateFormData('declared_value', e.target.value)}
                  placeholder="Enter declared value"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => updateFormData('currency', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4" />
              <h3 className="text-lg font-medium">Location Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin *</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => updateFormData('origin', e.target.value)}
                  placeholder="Enter origin location"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => updateFormData('destination', e.target.value)}
                  placeholder="Enter destination (optional)"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4" />
              <h3 className="text-lg font-medium">Specifications</h3>
              <span className="text-sm text-muted-foreground">(Optional)</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specifications">Asset Specifications (JSON format)</Label>
              <Textarea
                id="specifications"
                value={formData.specifications}
                onChange={(e) => updateFormData('specifications', e.target.value)}
                placeholder='{"weight": "100g", "dimensions": "10x5x2cm", "material": "gold"}'
                rows={6}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter asset specifications in JSON format. Leave empty if not applicable.
              </p>
            </div>
          </div>

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              {success}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-g1-primary hover:bg-g1-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Asset' : 'Create Asset'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}