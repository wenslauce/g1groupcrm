'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  Shield, 
  FileText, 
  User, 
  Package,
  Calendar,
  Hash,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface VerificationResult {
  valid: boolean
  skr_number: string
  status?: string
  issue_date?: string
  hash_valid?: boolean
  verification_time?: string
  client?: {
    name: string
    country: string
  }
  asset?: {
    name: string
    type: string
    declared_value: number
    currency: string
  }
  hash_provided?: boolean
  hash_available?: boolean
  error?: string
}

interface SKRVerificationPageProps {
  params: { skrNumber: string }
}

export default function SKRVerificationPage({ params }: SKRVerificationPageProps) {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [hashInput, setHashInput] = useState('')
  const [showHashInput, setShowHashInput] = useState(false)
  const [verifyingHash, setVerifyingHash] = useState(false)

  const skrNumber = decodeURIComponent(params.skrNumber)

  useEffect(() => {
    verifySKR()
  }, [])

  const verifySKR = async (hash?: string) => {
    setLoading(true)
    try {
      const url = new URL(`/api/verify/skr/${encodeURIComponent(skrNumber)}`, window.location.origin)
      if (hash) {
        url.searchParams.set('hash', hash)
      }
      
      const response = await fetch(url.toString())
      const result = await response.json()
      
      setVerificationResult(result)
    } catch (error) {
      setVerificationResult({
        valid: false,
        skr_number: skrNumber,
        error: 'Failed to verify SKR. Please try again later.'
      })
    } finally {
      setLoading(false)
      setVerifyingHash(false)
    }
  }

  const handleHashVerification = async () => {
    if (!hashInput.trim()) return
    
    setVerifyingHash(true)
    await verifySKR(hashInput.trim())
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      issued: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      closed: 'bg-purple-100 text-purple-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusDisplayName = (status: string) => {
    const names: Record<string, string> = {
      issued: 'Issued',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      closed: 'Closed'
    }
    return names[status] || status.replace('_', ' ').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">G1 Holding</h1>
          </div>
          <h2 className="text-xl text-gray-600">SKR Verification System</h2>
          <p className="text-sm text-gray-500 mt-2">
            Verify the authenticity of Secure Keeper Receipts
          </p>
        </div>

        {/* SKR Number Display */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              SKR Verification
            </CardTitle>
            <div className="text-2xl font-mono font-bold text-blue-600 mt-2">
              {skrNumber}
            </div>
          </CardHeader>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-lg">Verifying SKR...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Results */}
        {!loading && verificationResult && (
          <div className="space-y-6">
            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {verificationResult.valid ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {verificationResult.valid ? (
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      ✓ VALID SKR
                    </div>
                    <p className="text-gray-600">
                      This SKR has been verified as authentic and issued by G1 Holding
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Verified on: {verificationResult.verification_time ? 
                        formatDateTime(verificationResult.verification_time) : 
                        new Date().toLocaleString()
                      }
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      ✗ INVALID SKR
                    </div>
                    <p className="text-gray-600 mb-2">
                      {verificationResult.error || 'This SKR could not be verified'}
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm text-red-800">
                          Warning: This document may not be authentic. Please contact G1 Holding to verify.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SKR Details (only if valid) */}
            {verificationResult.valid && (
              <>
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>SKR Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <div className="mt-1">
                          <Badge className={getStatusColor(verificationResult.status || '')}>
                            {getStatusDisplayName(verificationResult.status || '')}
                          </Badge>
                        </div>
                      </div>
                      
                      {verificationResult.issue_date && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Issue Date</Label>
                          <div className="mt-1 flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {formatDateTime(verificationResult.issue_date)}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Client Information */}
                {verificationResult.client && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Client Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Client Name</Label>
                          <div className="mt-1 font-medium">{verificationResult.client.name}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Country</Label>
                          <div className="mt-1">{verificationResult.client.country}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Asset Information */}
                {verificationResult.asset && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Asset Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Asset Name</Label>
                          <div className="mt-1 font-medium">{verificationResult.asset.name}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Asset Type</Label>
                          <div className="mt-1">{verificationResult.asset.type}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Declared Value</Label>
                          <div className="mt-1 font-medium">
                            {formatCurrency(verificationResult.asset.declared_value, verificationResult.asset.currency)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Hash Verification */}
                {verificationResult.hash_available && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Digital Hash Verification
                      </CardTitle>
                      <CardDescription>
                        Verify the document's digital signature for additional security
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!showHashInput ? (
                        <div className="text-center">
                          <Button 
                            onClick={() => setShowHashInput(true)}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Verify Digital Hash
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="hash">Enter Digital Hash</Label>
                            <Input
                              id="hash"
                              value={hashInput}
                              onChange={(e) => setHashInput(e.target.value)}
                              placeholder="Enter the digital hash from the original document"
                              className="font-mono text-sm"
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleHashVerification}
                              disabled={!hashInput.trim() || verifyingHash}
                              className="flex items-center gap-2"
                            >
                              {verifyingHash ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                              {verifyingHash ? 'Verifying...' : 'Verify Hash'}
                            </Button>
                            
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setShowHashInput(false)
                                setHashInput('')
                              }}
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide
                            </Button>
                          </div>
                          
                          {verificationResult.hash_provided !== undefined && (
                            <div className={`p-3 rounded-lg ${
                              verificationResult.hash_valid 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                            }`}>
                              <div className="flex items-center">
                                {verificationResult.hash_valid ? (
                                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                                )}
                                <span className={`text-sm font-medium ${
                                  verificationResult.hash_valid ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  {verificationResult.hash_valid 
                                    ? 'Hash verification successful - Document is authentic'
                                    : 'Hash verification failed - Document may have been modified'
                                  }
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>© 2024 G1 Holding. All rights reserved.</p>
          <p className="mt-1">
            For questions about this verification, please contact: 
            <a href="mailto:verify@g1holding.com" className="text-blue-600 hover:underline ml-1">
              verify@g1holding.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}