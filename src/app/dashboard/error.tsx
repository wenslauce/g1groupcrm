'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, RefreshCw, AlertTriangle, Settings } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Settings className="h-10 w-10 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Dashboard Error</CardTitle>
            <CardDescription>
              There was an error loading the dashboard. This might be a temporary issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Error Details:</p>
              <div className="mt-2 p-3 bg-muted rounded-lg text-left">
                <code className="text-xs break-all">
                  {error.message || 'Unknown dashboard error occurred'}
                </code>
                {error.digest && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Error ID: {error.digest}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={reset} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Dashboard
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Link>
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>If this error continues, please try refreshing the page or contact support.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
