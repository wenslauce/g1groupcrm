'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePermissions, useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Shield, 
  TrendingUp,
  FileText,
  DollarSign,
  Edit,
  Loader2,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { ClientWithRelations } from '@/types'
import { clientUtils } from '@/lib/client-utils'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { KYCDocuments } from './kyc-documents'

interface ClientProfileProps {
  clientId: string
}

export function ClientProfile({ clientId }: ClientProfileProps) {
  const [client, setClient] = useState<ClientWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const permissions = usePermissions()
  const { user } = useAuth()
  
  // Memoize permission checks based only on user role (not permissions object which changes)
  const canViewClients = useMemo(() => {
    if (!user?.profile?.role) return false
    return ['admin', 'finance', 'operations', 'compliance'].includes(user.profile.role)
  }, [user?.profile?.role])
  
  const canManageClients = useMemo(() => {
    if (!user?.profile?.role) return false
    return ['admin', 'finance'].includes(user.profile.role)
  }, [user?.profile?.role])

  // Use ref to track if fetch is in progress to prevent duplicate calls
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Prevent duplicate simultaneous calls
    if (fetchingRef.current) return
    
    const fetchClient = async () => {
      fetchingRef.current = true
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/clients/${clientId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch client')
        }

        setClient(result.data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    }

    if (canViewClients) {
      fetchClient()
    } else {
      setLoading(false)
      setError('You do not have permission to view client details.')
    }
  }, [clientId, canViewClients])

  if (!canViewClients) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">You don't have permission to view client details.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!client) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Client not found.</p>
        </CardContent>
      </Card>
    )
  }

  const riskScore = clientUtils.calculateRiskScore(client)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground">
            Client Profile • Created {formatDateTime(client.created_at)}
          </p>
        </div>
        {canManageClients && (
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button className="bg-g1-primary hover:bg-g1-primary/90">
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Type:</span>
                <Badge className={clientUtils.getTypeColor(client.type)}>
                  {clientUtils.getTypeDisplayName(client.type)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{client.email}</span>
              </div>
              
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Country:</span>
                <span className="text-sm">{client.country}</span>
              </div>
            </div>

            {client.address && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Address</h4>
                <p className="text-sm text-muted-foreground">
                  {clientUtils.formatAddress(client.address)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Risk Level</span>
                  <Badge className={clientUtils.getRiskLevelColor(client.risk_level)}>
                    {clientUtils.getRiskLevelDisplayName(client.risk_level)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Compliance Status</span>
                  <Badge className={clientUtils.getComplianceStatusColor(client.compliance_status)}>
                    {clientUtils.getComplianceStatusDisplayName(client.compliance_status)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className="text-2xl font-bold">{riskScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      riskScore <= 30 ? 'bg-green-500' : 
                      riskScore <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
              </div>
            </div>

            {client.kyc_documents && Array.isArray(client.kyc_documents) && client.kyc_documents.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">KYC Documents</h4>
                <p className="text-sm text-muted-foreground">
                  {client.kyc_documents.length} document(s) uploaded
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-g1-primary">
                  {client.assets?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Assets</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-g1-primary">
                  {client.skrs?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">SKRs</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-g1-primary">
                  {client.invoices?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Invoices</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-g1-primary">
                  {client.invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) ? 
                    formatCurrency(client.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)) : 
                    '$0'
                  }
                </div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent SKRs */}
      {client.skrs && client.skrs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent SKRs
              </CardTitle>
              <Link href={`/dashboard/skrs?client_id=${client.id}`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKR Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Asset</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.skrs.slice(0, 5).map((skr) => (
                    <TableRow key={skr.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/dashboard/skrs/${skr.id}`}
                          className="text-g1-primary hover:underline"
                        >
                          {skr.skr_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          skr.status === 'delivered' ? 'success' :
                          skr.status === 'in_transit' ? 'info' :
                          skr.status === 'issued' ? 'warning' : 'secondary'
                        }>
                          {skr.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {skr.issue_date ? formatDateTime(skr.issue_date) : '-'}
                      </TableCell>
                      <TableCell>
                        {client.assets?.find(a => a.id === skr.asset_id)?.asset_name || 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      {client.invoices && client.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Recent Invoices
              </CardTitle>
              <Link href={`/dashboard/finance/invoices?client_id=${client.id}`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.invoices.slice(0, 5).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/dashboard/finance/invoices/${invoice.id}`}
                          className="text-g1-primary hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'overdue' ? 'destructive' :
                          invoice.status === 'sent' ? 'warning' : 'secondary'
                        }>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(invoice.issue_date)}</TableCell>
                      <TableCell>
                        {invoice.due_date ? formatDateTime(invoice.due_date) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC Documents */}
      <KYCDocuments 
        client={client} 
        onUpdate={() => {
          // Refresh client data when KYC documents are updated
          window.location.reload()
        }} 
      />
    </div>
  )
}