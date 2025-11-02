'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  EyeOff,
  MapPin,
  Truck,
  Clock,
  Navigation,
  History,
  ArrowLeft
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

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

interface TrackingData {
  id: string
  tracking_number: string
  status: string
  current_location: string
  current_country: string
  estimated_delivery?: string
  actual_delivery?: string
  notes?: string
  updated_at: string
}

interface TrackingEvent {
  id: string
  event_type: string
  event_date: string
  location: string
  country: string
  description: string
  created_at: string
}

interface TrackingResult {
  success: boolean
  skr_number: string
  skr_status: string
  tracking: TrackingData[]
  events: TrackingEvent[]
  last_updated: string
  error?: string
}

interface SKRVerificationPageProps {
  params: { skrNumber: string }
}

export default function SKRVerificationPage({ params }: SKRVerificationPageProps) {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingTracking, setLoadingTracking] = useState(true)
  const [hashInput, setHashInput] = useState('')
  const [showHashInput, setShowHashInput] = useState(false)
  const [verifyingHash, setVerifyingHash] = useState(false)
  const [activeTab, setActiveTab] = useState('verification')

  const skrNumber = decodeURIComponent(params.skrNumber)

  useEffect(() => {
    verifySKR()
    fetchTracking()
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

  const fetchTracking = async () => {
    setLoadingTracking(true)
    try {
      const response = await fetch(`/api/verify/tracking/${encodeURIComponent(skrNumber)}`)
      const result = await response.json()
      
      setTrackingResult(result)
    } catch (error) {
      console.error('Failed to fetch tracking:', error)
      setTrackingResult({
        success: false,
        skr_number: skrNumber,
        skr_status: '',
        tracking: [],
        events: [],
        last_updated: new Date().toISOString(),
        error: 'Failed to load tracking information'
      })
    } finally {
      setLoadingTracking(false)
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
      closed: 'Closed',
      pending: 'Pending',
      picked_up: 'Picked Up',
      customs: 'In Customs',
      out_for_delivery: 'Out for Delivery'
    }
    return names[status] || status.replace(/_/g, ' ').toUpperCase()
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'picked_up':
        return <Package className="h-5 w-5" />
      case 'in_transit':
        return <Truck className="h-5 w-5" />
      case 'customs':
        return <Shield className="h-5 w-5" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />
      case 'location_update':
        return <MapPin className="h-5 w-5" />
      default:
        return <Navigation className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/verify" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-10 w-10 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SKR Verification & Tracking</h1>
                <p className="text-sm text-gray-600">Real-time status and verification details</p>
              </div>
            </div>
          </div>
        </div>

        {/* SKR Number Display */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              SKR Number
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

        {/* Tabbed Results */}
        {!loading && verificationResult && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Verification
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Tracking
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* VERIFICATION TAB */}
            <TabsContent value="verification" className="space-y-6">
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
            </TabsContent>

            {/* TRACKING TAB */}
            <TabsContent value="tracking" className="space-y-6">
              {loadingTracking ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                      <span className="text-lg">Loading tracking information...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : trackingResult?.success && trackingResult.tracking.length > 0 ? (
                <>
                  {trackingResult.tracking.map((track) => (
                    <div key={track.id}>
                      {/* Current Status Card */}
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-6 w-6 text-blue-600" />
                            Current Status
                          </CardTitle>
                          <CardDescription>
                            Last updated: {formatDateTime(track.updated_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Tracking Number</Label>
                                <div className="mt-1 font-mono font-semibold text-lg">{track.tracking_number}</div>
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Status</Label>
                                <div className="mt-1">
                                  <Badge className={getStatusColor(track.status)}>
                                    {getStatusDisplayName(track.status)}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Current Location</Label>
                                <div className="mt-1 flex items-center">
                                  <Navigation className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="font-medium">{track.current_location}</span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">{track.current_country}</div>
                              </div>

                              {track.estimated_delivery && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">
                                    {track.actual_delivery ? 'Delivered On' : 'Estimated Delivery'}
                                  </Label>
                                  <div className="mt-1 flex items-center">
                                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                    {formatDateTime(track.actual_delivery || track.estimated_delivery)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {track.notes && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-gray-700">{track.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Tracking Information Available</h3>
                    <p className="text-gray-600">
                      {trackingResult?.error || 'Tracking information has not been added for this SKR yet.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* HISTORY TAB */}
            <TabsContent value="history" className="space-y-6">
              {loadingTracking ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                      <span className="text-lg">Loading history...</span>
                    </div>
                  </CardContent>
                </Card>
              ) : trackingResult?.success && trackingResult.events.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-6 w-6" />
                      Tracking History
                    </CardTitle>
                    <CardDescription>
                      Complete timeline of all tracking events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                      
                      {/* Events */}
                      <div className="space-y-6">
                        {trackingResult.events.map((event, index) => (
                          <div key={event.id} className="relative flex gap-4">
                            {/* Icon */}
                            <div className={`relative z-10 flex items-center justify-center h-12 w-12 rounded-full ${
                              index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <div className={index === 0 ? 'text-blue-600' : 'text-gray-600'}>
                                {getEventIcon(event.event_type)}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-6">
                              <div className="bg-white border rounded-lg p-4 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {getStatusDisplayName(event.event_type)}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                  </div>
                                  {index === 0 && (
                                    <Badge className="bg-blue-100 text-blue-800 ml-2">Latest</Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <MapPin className="h-3.5 w-3.5 mr-1" />
                                    {event.location}, {event.country}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1" />
                                    {formatDateTime(event.event_date)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History Available</h3>
                    <p className="text-gray-600">
                      No tracking events have been recorded for this SKR yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>© 2024 G1 Holding. All rights reserved.</p>
          <p className="mt-1">
            For questions about this verification, please contact: 
            <a href="mailto:verify@g1groupofcompanies.com" className="text-blue-600 hover:underline ml-1">
              verify@g1groupofcompanies.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}