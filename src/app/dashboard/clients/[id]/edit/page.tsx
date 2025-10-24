'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ClientForm } from '@/components/clients/client-form'
import { ClientWithRelations } from '@/types'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface EditClientPageProps {
  params: {
    id: string
  }
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const [client, setClient] = useState<ClientWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/clients/${params.id}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch client')
        }

        setClient(result.data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchClient()
  }, [params.id])

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance']}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'finance']}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'finance']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
          <p className="text-muted-foreground">
            Update client information and settings
          </p>
        </div>

        <ClientForm client={client} />
      </div>
    </ProtectedRoute>
  )
}