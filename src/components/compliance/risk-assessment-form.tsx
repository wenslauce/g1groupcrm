'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Loader2, 
  Shield, 
  User, 
  AlertTriangle,
  Calculator,
  Calendar
} from 'lucide-react'
import { ClientWithRelations } from '@/types'
import { ComplianceAssessmentData } from '@/lib/validations/kyc'
import { kycUtils } from '@/lib/kyc-utils'
import { formatDateTime } from '@/lib/utils'

interface RiskFactor {
  factor: string
  score: number
  weight: number
  notes?: string
}

interface RiskAssessmentFormProps {
  client?: ClientWithRelations | null
  onSave?: () => void
  onCancel?: () => void
}

export function RiskAssessmentForm({ client, onSave, onCancel }: RiskAssessmentFormProps) {
  const [formData, setFormData] = useState<Partial<ComplianceAssessmentData>>({
    client_id: client?.id || '',
    assessment_type: 'initial',
    risk_factors: [],
    overall_risk_score: 0,
    risk_level: 'low',
    recommendations: [],
    next_review_date: '',
    notes: ''
  })
  const [clients, setClients] = useState<ClientWithRelations[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(client || null)
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([])
  const [newRecommendation, setNewRecommendation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(!client)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()
  const standardFactors = kycUtils?.getStandardRiskFactors() || []

  useEffect(() => {
    if (!client) {
      fetchClients()
    }
    initializeRiskFactors()
  }, [])

  useEffect(() => {
    calculateRiskScore()
  }, [riskFactors])

  const fetchClients = async () => {
    setIsLoadingClients(true)
    try {
      const response = await fetch('/api/clients?limit=100')
      const result = await response.json()
      
      if (response.ok) {
        setClients(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setIsLoadingClients(false)
    }
  }

  const initializeRiskFactors = () => {
    const defaultFactors = [
      { factor: 'Geographic Risk', score: 5, weight: 0.2, notes: '' },
      { factor: 'Customer Type', score: 5, weight: 0.2, notes: '' },
      { factor: 'Business Activity', score: 5, weight: 0.2, notes: '' },
      { factor: 'Transaction Volume', score: 5, weight: 0.2, notes: '' },
      { factor: 'Source of Funds', score: 5, weight: 0.2, notes: '' }
    ]
    
    const initialFactors = standardFactors.length > 0 
      ? standardFactors.map(factor => ({
          factor: factor.factor,
          score: 5,
          weight: 1 / standardFactors.length,
          notes: ''
        }))
      : defaultFactors
    
    setRiskFactors(initialFactors)
  }

  const calculateRiskScore = () => {
    const score = kycUtils?.calculateRiskScore 
      ? kycUtils.calculateRiskScore(riskFactors)
      : riskFactors.reduce((sum, factor) => sum + (factor.score * factor.weight * 10), 0)
    
    const riskLevel = kycUtils?.getRiskLevelFromScore 
      ? kycUtils.getRiskLevelFromScore(score)
      : score > 70 ? 'high' : score > 40 ? 'medium' : 'low'
    
    setFormData(prev => ({
      ...prev,
      overall_risk_score: Math.round(score),
      risk_level: riskLevel as 'low' | 'medium' | 'high',
      risk_factors: riskFactors
    }))
  }

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    setSelectedClient(client || null)
    setFormData(prev => ({ ...prev, client_id: clientId }))
  }

  const updateRiskFactor = (index: number, field: keyof RiskFactor, value: any) => {
    const newFactors = [...riskFactors]
    newFactors[index] = { ...newFactors[index], [field]: value }
    setRiskFactors(newFactors)
  }

  const addRecommendation = () => {
    if (newRecommendation.trim()) {
      setFormData(prev => ({
        ...prev,
        recommendations: [...(prev.recommendations || []), newRecommendation.trim()]
      }))
      setNewRecommendation('')
    }
  }

  const removeRecommendation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recommendations: prev.recommendations?.filter((_, i) => i !== index) || []
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate weights sum to 1
      const totalWeight = riskFactors.reduce((sum, factor) => sum + factor.weight, 0)
      if (Math.abs(totalWeight - 1) > 0.01) {
        throw new Error('Risk factor weights must sum to 1.0')
      }

      const response = await fetch('/api/compliance/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save risk assessment')
      }

      setSuccess('Risk assessment saved successfully!')
      
      if (onSave) {
        setTimeout(() => onSave(), 1000)
      } else {
        setTimeout(() => {
          router.push('/dashboard/compliance')
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

  const totalWeight = riskFactors.reduce((sum, factor) => sum + factor.weight, 0)
  const isWeightValid = Math.abs(totalWeight - 1) <= 0.01

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
            <CardDescription>
              Conduct comprehensive risk assessment for compliance purposes
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
          {!client && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4" />
                <h3 className="text-lg font-medium">Client Information</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={handleClientChange}
                  disabled={isLoading || isLoadingClients}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <span>{client.name}</span>
                          <Badge>
                            {client.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Selected Client Details */}
          {selectedClient && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Client Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">{selectedClient.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2">{selectedClient.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Country:</span>
                  <span className="ml-2">{selectedClient.country}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Risk:</span>
                  <Badge className={getRiskLevelColor(selectedClient.risk_level)}>
                    {selectedClient.risk_level?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-lg font-medium">Assessment Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assessment_type">Assessment Type *</Label>
                <Select
                  value={formData.assessment_type}
                  onValueChange={(value) => updateFormData('assessment_type', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial Assessment</SelectItem>
                    <SelectItem value="periodic">Periodic Review</SelectItem>
                    <SelectItem value="triggered">Triggered Review</SelectItem>
                    <SelectItem value="enhanced">Enhanced Due Diligence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_review_date">Next Review Date *</Label>
                <Input
                  id="next_review_date"
                  type="datetime-local"
                  value={formData.next_review_date ? new Date(formData.next_review_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => updateFormData('next_review_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <h3 className="text-lg font-medium">Risk Factors</h3>
              </div>
              <div className="text-sm">
                <span className={`font-medium ${isWeightValid ? 'text-green-600' : 'text-red-600'}`}>
                  Total Weight: {totalWeight.toFixed(3)}
                </span>
                {!isWeightValid && (
                  <span className="text-red-600 ml-2">(Must equal 1.0)</span>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {riskFactors.map((factor, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Risk Factor</Label>
                      <div className="font-medium">{factor.factor}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Score (0-10)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={factor.score}
                        onChange={(e) => updateRiskFactor(index, 'score', parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Weight (0-1)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={factor.weight}
                        onChange={(e) => updateRiskFactor(index, 'weight', parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Weighted Score</Label>
                      <div className="text-lg font-semibold p-2 bg-muted rounded">
                        {(factor.score * factor.weight * 10).toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={factor.notes || ''}
                      onChange={(e) => updateRiskFactor(index, 'notes', e.target.value)}
                      placeholder="Additional notes for this risk factor"
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Score Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Risk Assessment Summary</h4>
              <Badge className={getRiskLevelColor(formData.risk_level || 'low')}>
                {formData.risk_level?.toUpperCase()} RISK
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Overall Score:</span>
                <span className="ml-2 font-bold text-lg">{formData.overall_risk_score}/100</span>
              </div>
              <div>
                <span className="text-muted-foreground">Risk Level:</span>
                <span className="ml-2 font-medium">{formData.risk_level?.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Due Diligence:</span>
                <span className="ml-2 font-medium">STANDARD</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recommendations</h3>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  placeholder="Add a recommendation"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  onClick={addRecommendation}
                  disabled={!newRecommendation.trim() || isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.recommendations && formData.recommendations.length > 0 && (
                <div className="space-y-2">
                  {formData.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1">{rec}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecommendation(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Assessment Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Additional notes about this risk assessment"
              rows={4}
              disabled={isLoading}
            />
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
              disabled={isLoading || !formData.client_id || !isWeightValid || !formData.next_review_date}
              className="bg-g1-primary hover:bg-g1-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Assessment...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Assessment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}