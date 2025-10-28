'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, Search, FileX } from 'lucide-react'

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <FileX className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Dashboard Page Not Found</CardTitle>
            <CardDescription>
              The dashboard page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Error 404</p>
              <p>This could be due to:</p>
              <ul className="mt-2 space-y-1 text-left">
                <li>• Incorrect dashboard URL</li>
                <li>• Page has been moved or deleted</li>
                <li>• You don't have permission to access this dashboard section</li>
                <li>• The resource (client, SKR, invoice, etc.) doesn't exist</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="flex-1">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/dashboard/search">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Link>
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
