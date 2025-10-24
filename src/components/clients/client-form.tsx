'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X, User, Building, MapPin } from 'lucide-react'
import { ClientWithRelations } from '@/types'
import { clientUtils } from '@/lib/client-utils'
import { ClientFormData } from '@/lib/validations/client'

interface ClientFormProps {
  client?: ClientWithRelations | null
  onSave?: () => void
  onCancel?: () => void
}

export function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    type: 'individual',
    email: '',
    phone: '',
    country: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    risk_level: 'medium'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()
  const isEditing = !!client

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        type: client.type || 'individual',
        email: client.email || '',
        phone: client.phone || '',
        country: client.country || '',
        address: client.address ? {
          street: client.address.street || '',
          city: client.address.city || '',
          state: client.address.state || '',
          postal_code: client.address.postal_code || '',
          country: client.address.country || ''
        } : {
          street: '',
          city: '',
          state: '',
          postal_code: '',
          country: ''
        },
        risk_level: client.risk_level || 'medium'
      })
    }
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const url = isEditing ? `/api/clients/${client!.id}` : '/api/clients'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        address: formData.address?.street ? formData.address : undefined
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
        throw new Error(result.error || 'Failed to save client')
      }

      setSuccess(`Client ${isEditing ? 'updated' : 'created'} successfully!`)
      
      if (onSave) {
        setTimeout(() => onSave(), 1000)
      } else {
        setTimeout(() => {
          router.push('/dashboard/clients')
        }, 1000)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isEditing ? 'Edit Client' : 'Add New Client'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update client information and settings'
                : 'Create a new client profile with contact and compliance details'
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
              <Building className="h-4 w-4" />
              <h3 className="text-lg font-medium">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Enter client name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Client Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => updateFormData('type', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientUtils.getAllTypes().map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="Enter email address"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="Enter phone number"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => updateFormData('country', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientUtils.getCountryList().map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk_level">Risk Level</Label>
                <Select
                  value={formData.risk_level}
                  onValueChange={(value) => updateFormData('risk_level', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientUtils.getAllRiskLevels().map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4" />
              <h3 className="text-lg font-medium">Address Information</h3>
              <span className="text-sm text-muted-foreground">(Optional)</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.address?.street || ''}
                onChange={(e) => updateFormData('address.street', e.target.value)}
                placeholder="Enter street address"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address?.city || ''}
                  onChange={(e) => updateFormData('address.city', e.target.value)}
                  placeholder="Enter city"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address?.state || ''}
                  onChange={(e) => updateFormData('address.state', e.target.value)}
                  placeholder="Enter state/province"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.address?.postal_code || ''}
                  onChange={(e) => updateFormData('address.postal_code', e.target.value)}
                  placeholder="Enter postal code"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_country">Address Country</Label>
              <Select
                value={formData.address?.country || ''}
                onValueChange={(value) => updateFormData('address.country', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select address country" />
                </SelectTrigger>
                <SelectContent>
                  {clientUtils.getCountryList().map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Information (for editing) */}
          {isEditing && client && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Status Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Compliance Status</Label>
                  <Badge className={clientUtils.getComplianceStatusColor(client.compliance_status)}>
                    {clientUtils.getComplianceStatusDisplayName(client.compliance_status)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Contact compliance team to update status
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Risk Score</Label>
                  <div className="text-2xl font-bold">
                    {clientUtils.calculateRiskScore(client)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Calculated based on client profile and history
                  </p>
                </div>
              </div>
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
                  {isEditing ? 'Update Client' : 'Create Client'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}