'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Search, Package, FileText, TrendingUp } from 'lucide-react'

export default function VerifyLandingPage() {
  const [skrNumber, setSkrNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (skrNumber.trim()) {
      setIsSearching(true)
      router.push(`/verify/skr/${encodeURIComponent(skrNumber.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <Shield className="h-10 w-10 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">G1 Holding</h1>
              <p className="text-sm text-gray-600">Secure Keeper Receipt Verification & Tracking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Track Your SKR
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Enter your Secure Keeper Receipt number to verify authenticity and track status
          </p>
          <p className="text-sm text-gray-500">
            Real-time tracking • Secure verification • Public access
          </p>
        </div>

        {/* Search Card */}
        <Card className="mb-12 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Search className="h-6 w-6 text-blue-600" />
              Enter SKR Number
            </CardTitle>
            <CardDescription className="text-base">
              Input your SKR number to view verification and tracking information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="skrNumber" className="text-base font-medium">
                  SKR Number
                </Label>
                <Input
                  id="skrNumber"
                  type="text"
                  value={skrNumber}
                  onChange={(e) => setSkrNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., SKR-2024-001"
                  className="text-lg font-mono h-14 text-center"
                  autoFocus
                  required
                />
                <p className="text-sm text-gray-500 text-center">
                  The SKR number can be found on your Secure Keeper Receipt document
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg"
                disabled={!skrNumber.trim() || isSearching}
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Track & Verify SKR
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Verification</h3>
              <p className="text-sm text-gray-600">
                Verify the authenticity of your SKR with our blockchain-backed verification system
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Tracking</h3>
              <p className="text-sm text-gray-600">
                Track your asset's journey with detailed status updates and location information
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Complete Details</h3>
              <p className="text-sm text-gray-600">
                Access comprehensive information about your asset, client details, and transaction history
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              What is an SKR?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              A <strong>Secure Keeper Receipt (SKR)</strong> is a financial instrument that serves as proof 
              that an asset has been deposited with a secure custodian or keeper.
            </p>
            <p>
              Our SKR verification system allows you to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Verify the authenticity of the SKR document</li>
              <li>Track the current status and location of your asset</li>
              <li>View detailed asset and client information</li>
              <li>Access complete transaction history</li>
              <li>Verify digital signatures and document hashes</li>
            </ul>
            <p className="pt-2">
              All tracking information is updated in real-time and accessible 24/7 without requiring an account.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-sm text-gray-600 mb-2">
            Need help? Contact our support team
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="mailto:support@g1groupofcompanies.com" className="text-blue-600 hover:underline">
              support@g1groupofcompanies.com
            </a>
            <span className="text-gray-400">|</span>
            <a href="mailto:verify@g1groupofcompanies.com" className="text-blue-600 hover:underline">
              verify@g1groupofcompanies.com
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            © 2024 G1 Holding. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

