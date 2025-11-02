import jsPDF from 'jspdf'

interface SKRData {
    id: string
    skr_number: string
    status: string
    issue_date?: string
    created_at: string
    hash?: string
    remarks?: string
    client?: {
        name: string
        email: string
        type: string
        country: string
        phone?: string
    }
    asset?: {
        asset_name: string
        asset_type: string
        declared_value: number
        currency: string
        origin: string
        destination?: string
    }
}

export function generateSKRPDF(skr: SKRData): Buffer {
    const doc = new jsPDF()

    // Set font
    doc.setFont('helvetica')

    // Header
    doc.setFontSize(20)
    doc.setTextColor(31, 41, 55) // gray-800
    doc.text('G1 GROUP', 20, 30)

    doc.setFontSize(12)
    doc.text('Secure Keeper Receipt', 20, 40)

    doc.setFontSize(14)
    doc.text(skr.skr_number, 150, 40)

    // Title
    doc.setFontSize(18)
    doc.text('SECURE KEEPER RECEIPT', 105, 60, { align: 'center' })

    // Draw line
    doc.setLineWidth(0.5)
    doc.line(20, 70, 190, 70)

    let yPos = 85

    // SKR Information Section
    doc.setFontSize(14)
    doc.setTextColor(55, 65, 81) // gray-700
    doc.text('SKR Information', 20, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128) // gray-500
    doc.text('SKR Number:', 25, yPos)
    doc.setTextColor(31, 41, 55) // gray-800
    doc.text(skr.skr_number, 70, yPos)
    yPos += 8

    doc.setTextColor(107, 114, 128)
    doc.text('Status:', 25, yPos)
    doc.setTextColor(31, 41, 55)
    doc.text(skr.status.toUpperCase(), 70, yPos)
    yPos += 8

    doc.setTextColor(107, 114, 128)
    doc.text('Created Date:', 25, yPos)
    doc.setTextColor(31, 41, 55)
    doc.text(new Date(skr.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }), 70, yPos)
    yPos += 8

    if (skr.issue_date) {
        doc.setTextColor(107, 114, 128)
        doc.text('Issue Date:', 25, yPos)
        doc.setTextColor(31, 41, 55)
        doc.text(new Date(skr.issue_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }), 70, yPos)
        yPos += 8
    }

    yPos += 10

    // Client Information Section
    if (skr.client) {
        doc.setFontSize(14)
        doc.setTextColor(55, 65, 81)
        doc.text('Client Information', 20, yPos)
        yPos += 10

        doc.setFontSize(10)
        doc.setTextColor(107, 114, 128)
        doc.text('Name:', 25, yPos)
        doc.setTextColor(31, 41, 55)
        doc.text(skr.client.name, 70, yPos)
        yPos += 8

        doc.setTextColor(107, 114, 128)
        doc.text('Email:', 25, yPos)
        doc.setTextColor(31, 41, 55)
        doc.text(skr.client.email, 70, yPos)
        yPos += 8

        doc.setTextColor(107, 114, 128)
        doc.text('Type:', 25, yPos)
        doc.setTextColor(31, 41, 55)
        doc.text(skr.client.type, 70, yPos)
        yPos += 8

        doc.setTextColor(107, 114, 128)
        doc.text('Country:', 25, yPos)
        doc.setTextColor(31, 41, 55)
        doc.text(skr.client.country, 70, yPos)
        yPos += 8

        if (skr.client.phone) {
            doc.setTextColor(107, 114, 128)
            doc.text('Phone:', 25, yPos)
            doc.setTextColor(31, 41, 55)
            doc.text(skr.client.phone, 70, yPos)
            yPos += 8
        }

        yPos += 10
    }

    // Asset Information Section
    if (skr.asset) {
        doc.setFontSize(14)
        doc.setTextColor(55, 65, 81)
        doc.text('Asset Information', 20, yPos)
        yPos += 10

        doc.setFontSize(10)
        doc.setTextColor(107, 114, 128)
        doc.text('Asset Name:', 25, yPos)
        doc.setTextColor(31, 41, 55)
        doc.text(skr.asset.asset_name, 70, yPos)
        yPos += 8

        doc.setTextColor(107, 114, 128)
        doc.text('Asset Type:', 25, yPos)
        doc.setTextColor(31, 41, 55)
        doc.text(skr.asset.asset_type, 70, yPos)
        yPos += 8

        doc.setTextColor(107, 114, 128)
        doc.text('Declared Value:', 25, yPos)
        doc.setTextColor(31, 41, 55)
        doc.text(`${skr.asset?.currency || 'USD'} ${skr.asset?.declared_value?.toLocaleString() || '0'}`, 70, yPos)
        yPos += 8

        doc.setTextColor(107, 114, 128)
        doc.text('Origin:', 25, yPos)
        doc.setTextColor(31, 41, 55)
        doc.text(skr.asset.origin, 70, yPos)
        yPos += 8

        if (skr.asset.destination) {
            doc.setTextColor(107, 114, 128)
            doc.text('Destination:', 25, yPos)
            doc.setTextColor(31, 41, 55)
            doc.text(skr.asset.destination, 70, yPos)
            yPos += 8
        }

        yPos += 10
    }

    // Remarks Section
    if (skr.remarks) {
        doc.setFontSize(14)
        doc.setTextColor(55, 65, 81)
        doc.text('Remarks', 20, yPos)
        yPos += 10

        doc.setFontSize(10)
        doc.setTextColor(31, 41, 55)
        const splitRemarks = doc.splitTextToSize(skr.remarks, 150)
        doc.text(splitRemarks, 25, yPos)
        yPos += splitRemarks.length * 5 + 10
    }

    // Digital Hash Section
    if (skr.hash) {
        doc.setFontSize(12)
        doc.setTextColor(55, 65, 81)
        doc.text('Digital Verification Hash', 105, yPos, { align: 'center' })
        yPos += 10

        doc.setFontSize(8)
        doc.setFont('courier')
        doc.setTextColor(31, 41, 55)
        const splitHash = doc.splitTextToSize(skr.hash, 150)
        doc.text(splitHash, 105, yPos, { align: 'center' })
        yPos += splitHash.length * 4 + 5

        doc.setFont('helvetica')
        doc.setFontSize(8)
        doc.setTextColor(107, 114, 128)
        doc.text('This hash can be used to verify the authenticity of this document', 105, yPos, { align: 'center' })
        yPos += 10
    }

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    const footerText = `This document was generated by G1 Group Secure Transaction System on ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`
    doc.text(footerText, 105, 280, { align: 'center' })
    doc.text(`For verification, visit: https://verify.g1groupofcompanies.com/skr/${skr.skr_number}`, 105, 285, { align: 'center' })

    // Return as buffer
    return Buffer.from(doc.output('arraybuffer'))
}