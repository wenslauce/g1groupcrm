'use client'

import { useState } from 'react'
import { usePermissions } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CheckCircle, 
  FileText, 
  Truck, 
  Package, 
  Clock,
  Loader2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'
import { SKRWithRelations, SKRStatus } from '@/types'
import { skrUtils } from '@/lib/skr-utils'
import { formatDateTime } from '@/lib/utils'

interface SKRStatusManagerProps {
  skr: SKRWithRelations
  onUpdate: () => void
}

export function SKRStatusManager({ skr, onUpdate }: SKRStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  
  const permissions = usePermissions()

  const handleStatusUpdate = async (newStatus: SKRStatus) => {
    if (!skrUtils.canTransitionTo(skr.status, newStatus)) {
      setError(`Cannot transition from ${skr.status} to ${newStatus}`)
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      const response = await fetch(`/api/skrs/${skr.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          ...(notes && { remarks: notes })
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update SKR status')
      }

      onUpdate()
      setNotes('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = (status: SKRStatus) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'issued':
        return <Package className="h-4 w-4" />
      case 'in_transit':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'closed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const canUpdateStatus = () => {
    if (!permissions.canCreateSKRs()) return false
    
    // Compliance officers can approve drafts
    if (skr.status === 'draft' && permissions.canViewCompliance()) return true
    
    // Finance and operations can manage other transitions
    return permissions.hasRole(['admin', 'finance', 'operations'])
  }

  const nextStatus = skrUtils.getNextStatus(skr.status)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status Management
        </CardTitle>
        <CardDescription>
          Manage SKR lifecycle and status transitions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(skr.status)}
              <div>
                <div className="font-medium">Current Status</div>
                <Badge className={skrUtils.getStatusColor(skr.status)}>
                  {skrUtils.getStatusDisplayName(skr.status)}
                </Badge>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {skr.updated_at && `Updated ${formatDateTime(skr.updated_at)}`}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{skrUtils.getStatusProgress(skr.status)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-g1-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${skrUtils.getStatusProgress(skr.status)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status History */}
        <div className="space-y-3">
          <h4 className="font-medium">Status History</h4>
          <div className="space-y-2">
            {/* Current status */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {getStatusIcon(skr.status)}
              <div className="flex-1">
                <div className="font-medium">{skrUtils.getStatusDisplayName(skr.status)}</div>
                <div className="text-sm text-muted-foreground">
                  {skr.updated_at && formatDateTime(skr.updated_at)}
                </div>
              </div>
              <Badge variant="secondary">Current</Badge>
            </div>
            
            {/* Previous statuses would be shown here in a real implementation */}
            {skr.status !== 'draft' && (
              <div className="flex items-center gap-3 p-3 rounded-lg opacity-60">
                <FileText className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">Draft</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(skr.created_at)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Action */}
        {canUpdateStatus() && nextStatus && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Next Action</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge className={skrUtils.getStatusColor(skr.status)} variant="secondary">
                  {skrUtils.getStatusDisplayName(skr.status)}
                </Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge className={skrUtils.getStatusColor(nextStatus)} variant="secondary">
                  {skrUtils.getStatusDisplayName(nextStatus)}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this status change"
                  disabled={isUpdating}
                />
              </div>

              <Button
                onClick={() => handleStatusUpdate(nextStatus)}
                disabled={isUpdating}
                className="w-full bg-g1-primary hover:bg-g1-primary/90"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Status...
                  </>
                ) : (
                  <>
                    {getStatusIcon(nextStatus)}
                    <span className="ml-2">
                      {nextStatus === 'approved' && 'Approve SKR'}
                      {nextStatus === 'issued' && 'Issue SKR'}
                      {nextStatus === 'in_transit' && 'Mark In Transit'}
                      {nextStatus === 'delivered' && 'Mark Delivered'}
                      {nextStatus === 'closed' && 'Close SKR'}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Special Actions */}
        {skr.status === 'issued' && permissions.hasRole(['admin', 'operations']) && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Special Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('in_transit')}
                disabled={isUpdating}
              >
                <Truck className="mr-2 h-4 w-4" />
                Start Transit
              </Button>
              <Button
                variant="outline"
                disabled
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            {error}
          </div>
        )}

        {!canUpdateStatus() && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            You don't have permission to update SKR status
          </div>
        )}
      </CardContent>
    </Card>
  )
}