import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen g1-gradient">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            G1 Holdings & Security Limited
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Secure Transaction Command Center - Your trusted partner for high-value asset management, 
            SKR generation, and comprehensive compliance solutions.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="bg-white text-g1-primary hover:bg-gray-100">
                Access Dashboard
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-g1-primary">
                Verify SKR
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">SKR Management</CardTitle>
              <CardDescription className="text-gray-200">
                Generate, track, and manage Secure Keeper Receipts with digital signatures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-gray-200 space-y-2">
                <li>• Automated SKR generation</li>
                <li>• Digital signatures & hashing</li>
                <li>• Real-time tracking</li>
                <li>• Compliance verification</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Client Management</CardTitle>
              <CardDescription className="text-gray-200">
                Comprehensive CRM with KYC compliance and risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-gray-200 space-y-2">
                <li>• Client profile management</li>
                <li>• KYC document verification</li>
                <li>• Risk level assessment</li>
                <li>• Transaction history</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Financial Operations</CardTitle>
              <CardDescription className="text-gray-200">
                Automated invoicing, receipts, and financial document management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-gray-200 space-y-2">
                <li>• Automated invoicing</li>
                <li>• Receipt generation</li>
                <li>• Credit note management</li>
                <li>• Financial reporting</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Trusted by Financial Institutions Worldwide
          </h2>
          <p className="text-gray-200 max-w-2xl mx-auto">
            Our secure platform ensures complete transparency, regulatory compliance, 
            and audit trails for all high-value transactions and asset management operations.
          </p>
        </div>
      </div>
    </div>
  )
}