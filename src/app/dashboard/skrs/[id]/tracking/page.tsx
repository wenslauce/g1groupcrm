'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { TrackingDashboard } from '@/components/tracking/tracking-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { SKRWithRelations } from '@/types'

interface SKRTrackingPageProps {
  params: { id: string }
}

export default function SKRTrackingPage({ params }: SKRTrackingPageProps) {
  const [skr, setSKR] = useState<SKRWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  
  // Use ref to track if fetch is in progress to prevent duplicate calls
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Prevent duplicate simultaneous calls
    if (fetchingRef.current) return
    
    const fetchSKR = async () => {
      fetchingRef.current = true
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/skrs/${params.id}`)
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch SKR')
        }
        
        setSKR(result.data)
      } catch (error) {
        console.error('Error fetching SKR:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    }
    
    fetchSKR()
  }, [params.id])

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  if (!skr) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">SKR not found.</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'finance', 'operations', 'compliance']}>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <TrackingDashboard skr={skr} />
      </div>
    </ProtectedRoute>
  )
}
