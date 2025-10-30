// PDF generation utilities
// Note: In a real implementation, you would use a PDF library like jsPDF, PDFKit, or Puppeteer
// For this example, we'll create a simple HTML-to-PDF conversion simulation

export interface PDFOptions {
  includeQR?: boolean
  includeSignature?: boolean
  watermark?: string
}

export interface PDFResult {
  buffer: Uint8Array
  filename: string
}

// Simulated PDF generation - in real implementation would use actual PDF library
export async function generatePDFFromHTML(html: string, filename: string): Promise<PDFResult> {
  // This is a placeholder implementation
  // In a real application, you would use:
  // - Puppeteer for HTML to PDF conversion
  // - jsPDF for programmatic PDF creation
  // - PDFKit for advanced PDF features
  
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(${filename}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000369 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
444
%%EOF`

  const buffer = new TextEncoder().encode(pdfContent)
  
  return {
    buffer,
    filename
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Generate QR code data URL (placeholder)
export function generateQRCode(data: string): string {
  // In a real implementation, you would use a QR code library
  // This is a placeholder that returns a data URL for a simple QR code
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
}

// Generate company logo URL (prefer public/logo.png)
export function getCompanyLogo(): string {
  const siteUrl = (typeof Deno !== 'undefined' && (Deno as any).env?.get)
    ? (Deno as any).env.get('SITE_URL')
    : ''
  const publicLogo = siteUrl ? `${siteUrl}/logo.png` : ''
  return publicLogo || `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
}

// Company information
export const COMPANY_INFO = {
  name: 'G1 Holding',
  address: {
    street: '123 Financial District',
    city: 'London',
    country: 'United Kingdom',
    postal: 'EC1A 1BB'
  },
  contact: {
    phone: '+44 20 1234 5678',
    email: 'info@g1holding.com',
    website: 'www.g1holding.com'
  },
  registration: {
    number: 'GB123456789',
    vat: 'GB987654321'
  },
  bankDetails: {
    bank_name: 'G1 International Bank',
    iban: 'GB29 NWBK 6016 1331 9268 19',
    swift: 'NWBKGB2L'
  }
}