'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X, FileText, User, Package, Plus } from 'lucide-react'
import { SKRWithRelations, Client, Asset } from '@/types'
import { skrUtils } from '@/lib/skr-utils'
import { clientUtils } from '@/lib/client-utils'
import { formatCurrency } from '@/lib/utils'
import { SKRFormData } from '@/lib/validations/skr'

interface SKRFormProps {
  skr?: SKRWithRelations | null
  onSave?: () => void
  onCancel?: () => void
}

export function SKRForm({ skr, onSave, onCancel }: SKRFormProps) {
  const [formData, setFormData] = useState<SKRFormData>({
    client_id: '',
    asset_id: '',
    remarks: '',
    metadata: {}
  })
  const [clients, setClients] = useState<Client[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()
  const isEditing = !!skr

  // Load clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true)
      try {
        const response = await fetch('/api/clients?limit=100')
        const result = await response.json()
        
        if (response.ok) {
          setClients(result.data)
        } else {
          setError('Failed to load clients')
        }
      } catch (error) {
        setError('Failed to load clients')
      } finally {
        setIsLoadingClients(false)
      }
    }

    fetchClients()
  }, [])

  // Load assets when client is selected
  useEffect(() => {
    if (formData.client_id) {
      const fetchAssets = async () => {
        setIsLoadingAssets(true)
        try {
          const response = await fetch(`/api/assets?client_id=${formData.client_id}&limit=100`)
          const result = await response.json()
          
          if (response.ok) {
            setAssets(result.data)
          } else {
            setError('Failed to load assets')
          }
        } catch (error) {
          setError('Failed to load assets')
        } finally {
          setIsLoadingAssets(false)
        }
      }

      fetchAssets()
    } else {
      setAssets([])
      setSelectedAsset(null)
      setFormData(prev => ({ ...prev, asset_id: '' }))
    }
  }, [formData.client_id])

  // Update selected client when client_id changes
  useEffect(() => {
    const client = clients.find(c => c.id === formData.client_id)
    setSelectedClient(client || null)
  }, [formData.client_id, clients])

  // Update selected asset when asset_id changes
  useEffect(() => {
    const asset = assets.find(a => a.id === formData.asset_id)
    setSelectedAsset(asset || null)
  }, [formData.asset_id, assets])

  // Initialize form data for editing
  useEffect(() => {
    if (skr) {
      setFormData({
        client_id: skr.client_id || '',
        asset_id: skr.asset_id || '',
        remarks: skr.remarks || '',
        metadata: (skr.metadata as Record<string, any>) || {}
      })
    }
  }, [skr])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const url = isEditing ? `/api/skrs/${skr!.id}` : '/api/skrs'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save SKR')
      }

      setSuccess(`SKR ${isEditing ? 'updated' : 'created'} successfully!`)
      
      if (onSave) {
        setTimeout(() => onSave(), 1000)
      } else {
        setTimeout(() => {
          router.push('/dashboard/skrs')
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isEditing ? 'Edit SKR' : 'Create New SKR'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update SKR information and details'
                : 'Generate a new Secure Keeper Receipt for client assets'
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
          {/* Client Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4" />
              <h3 className="text-lg font-medium">Client Information</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_id">Select Client *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => updateFormData('client_id', value)}
                disabled={isLoading || isLoadingClients || isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <span>{client.name}</span>
                        <Badge className={clientUtils.getTypeColor(client.type)} variant="secondary">
                          {clientUtils.getTypeDisplayName(client.type)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Client cannot be changed after SKR creation
                </p>
              )}
            </div>

            {selectedClient && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Selected Client Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2">{selectedClient.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Country:</span>
                    <span className="ml-2">{selectedClient.country}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk Level:</span>
                    <Badge className={clientUtils.getRiskLevelColor(selectedClient.risk_level)} variant="secondary">
                      {clientUtils.getRiskLevelDisplayName(selectedClient.risk_level)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Compliance:</span>
                    <Badge className={clientUtils.getComplianceStatusColor(selectedClient.compliance_status)} variant="secondary">
                      {clientUtils.getComplianceStatusDisplayName(selectedClient.compliance_status)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Asset Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4" />
              <h3 className="text-lg font-medium">Asset Information</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="asset_id">Select Asset *</Label>
              <Select
                value={formData.asset_id}
                onValueChange={(value) => updateFormData('asset_id', value)}
                disabled={isLoading || isLoadingAssets || !formData.client_id || isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.client_id ? "Select a client first" :
                    isLoadingAssets ? "Loading assets..." : 
                    assets.length === 0 ? "No assets available" :
                    "Select an asset"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{asset.asset_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {asset.asset_type} • {formatCurrency(asset.declared_value, asset.currency)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Asset cannot be changed after SKR creation
                </p>
              )}
            </div>

            {!formData.client_id && (
              <p className="text-sm text-muted-foreground">
                Please select a client to view their assets
              </p>
            )}

            {formData.client_id && assets.length === 0 && !isLoadingAssets && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  No assets found for this client
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/dashboard/assets/create?client_id=${formData.client_id}`} target="_blank">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Asset
                  </a>
                </Button>
              </div>
            )}

            {selectedAsset && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Selected Asset Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{selectedAsset.asset_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(selectedAsset.declared_value, selectedAsset.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Origin:</span>
                    <span className="ml-2">{selectedAsset.origin}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Destination:</span>
                    <span className="ml-2">{selectedAsset.destination || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Input
                id="remarks"
                value={formData.remarks}
                onChange={(e) => updateFormData('remarks', e.target.value)}
                placeholder="Add any additional notes or special instructions"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Status Information (for editing) */}
          {isEditing && skr && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Status Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Badge className={skrUtils.getStatusColor(skr.status)}>
                    {skrUtils.getStatusDisplayName(skr.status)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>SKR Number</Label>
                  <div className="font-mono text-sm">{skr.skr_number}</div>
                </div>
              </div>

              {skr.issue_date && (
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <div className="text-sm">{new Date(skr.issue_date).toLocaleString()}</div>
                </div>
              )}
            </div>
          )}

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
              disabled={isLoading || !formData.client_id || !formData.asset_id}
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
                  {isEditing ? 'Update SKR' : 'Create SKR'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}