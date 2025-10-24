'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Check, 
  X, 
  Loader2,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { ClientWithRelations } from '@/types'
import { KYCDocument } from '@/lib/validations/client'
import { clientUtils } from '@/lib/client-utils'
import { formatDateTime } from '@/lib/utils'

interface KYCDocumentsProps {
  client: ClientWithRelations
  onUpdate?: () => void
}

export function KYCDocuments({ client, onUpdate }: KYCDocumentsProps) {
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    type: '',
    file: null as File | null,
    notes: ''
  })
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  
  const permissions = usePermissions()

  useEffect(() => {
    if (client.kyc_documents) {
      setDocuments(client.kyc_documents as KYCDocument[])
    }
  }, [client])

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.file || !uploadForm.type) {
      setError('Please select a file and document type')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // In a real implementation, you would upload to Supabase Storage
      // For now, we'll simulate the upload
      const mockDocument: KYCDocument = {
        id: Date.now().toString(),
        type: uploadForm.type,
        filename: uploadForm.file.name,
        url: URL.createObjectURL(uploadForm.file), // Mock URL
        status: 'pending',
        uploaded_at: new Date().toISOString(),
        notes: uploadForm.notes
      }

      const updatedDocuments = [...documents, mockDocument]
      
      // Update client with new documents
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kyc_documents: updatedDocuments
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to upload document')
      }

      setDocuments(updatedDocuments)
      setShowUploadForm(false)
      setUploadForm({ type: '', file: null, notes: '' })
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDocumentAction = async (documentId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const updatedDocuments = documents.map(doc => 
        doc.id === documentId 
          ? {
              ...doc,
              status: action === 'approve' ? 'approved' : 'rejected',
              reviewed_at: new Date().toISOString(),
              reviewed_by: 'Current User', // In real app, get from auth context
              notes: notes || doc.notes
            }
          : doc
      )

      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kyc_documents: updatedDocuments
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update document')
      }

      setDocuments(updatedDocuments)
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const updatedDocuments = documents.filter(doc => doc.id !== documentId)

      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kyc_documents: updatedDocuments
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete document')
      }

      setDocuments(updatedDocuments)
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'pending':
      default:
        return <Badge variant="warning">Pending Review</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              KYC Documents
            </CardTitle>
            <CardDescription>
              Manage Know Your Customer documentation and compliance
            </CardDescription>
          </div>
          {permissions.canManageClients() && (
            <Button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-g1-primary hover:bg-g1-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Upload Form */}
        {showUploadForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Upload New Document</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-type">Document Type *</Label>
                    <Select
                      value={uploadForm.type}
                      onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value }))}
                      disabled={isUploading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientUtils.getKYCDocumentTypes().map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document-file">File *</Label>
                    <Input
                      id="document-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => setUploadForm(prev => ({ 
                        ...prev, 
                        file: e.target.files?.[0] || null 
                      }))}
                      disabled={isUploading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-notes">Notes (Optional)</Label>
                  <Input
                    id="document-notes"
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional notes about this document"
                    disabled={isUploading}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="bg-g1-primary hover:bg-g1-primary/90"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No KYC documents uploaded yet</p>
            {permissions.canManageClients() && (
              <p className="text-sm text-muted-foreground mt-2">
                Upload documents to complete the KYC process
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.type}</TableCell>
                    <TableCell>{document.filename}</TableCell>
                    <TableCell>{getStatusBadge(document.status)}</TableCell>
                    <TableCell>{formatDateTime(document.uploaded_at)}</TableCell>
                    <TableCell>
                      {document.reviewed_at ? (
                        <div>
                          <div className="text-sm">{formatDateTime(document.reviewed_at)}</div>
                          {document.reviewed_by && (
                            <div className="text-xs text-muted-foreground">
                              by {document.reviewed_by}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {permissions.canViewCompliance() && document.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDocumentAction(document.id, 'approve')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDocumentAction(document.id, 'reject')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {permissions.canManageClients() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* KYC Status Summary */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">KYC Compliance Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Documents:</span>
              <span className="ml-2 font-medium">{documents.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Approved:</span>
              <span className="ml-2 font-medium text-green-600">
                {documents.filter(d => d.status === 'approved').length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Pending Review:</span>
              <span className="ml-2 font-medium text-yellow-600">
                {documents.filter(d => d.status === 'pending').length}
              </span>
            </div>
          </div>
          
          {documents.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                {documents.filter(d => d.status === 'approved').length === documents.length ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      KYC Documentation Complete
                    </span>
                  </>
                ) : documents.some(d => d.status === 'pending') ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600 font-medium">
                      KYC Review In Progress
                    </span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">
                      KYC Documentation Incomplete
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}