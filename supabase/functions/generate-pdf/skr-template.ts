// @ts-nocheck
import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { generatePDFFromHTML, formatCurrency, formatDate, formatDateTime, generateQRCode, getCompanyLogo, COMPANY_INFO, PDFOptions, PDFResult } from '../_shared/pdf-utils.ts'

export async function generateSKRPDF(
  supabase: SupabaseClient,
  skrId: string,
  options: PDFOptions = {}
): Promise<PDFResult> {
  const { data: skr, error } = await supabase
    .from('skrs')
    .select(`
      *,
      client:clients(*),
      asset:assets(*),
      tracking:tracking(*)
    `)
    .eq('id', skrId)
    .single()

  if (error || !skr) {
    throw new Error(`SKR not found: ${error?.message || 'Unknown error'}`)
  }

  const siteUrl = (typeof Deno !== 'undefined' && (Deno as any).env?.get) ? (Deno as any).env.get('SITE_URL') : ''
  const verificationUrl = `${siteUrl}/verify/skr/${skr.skr_number}`
  const qrCodeDataUrl = options.includeQR ? generateQRCode(verificationUrl) : null

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>SKR - ${skr.skr_number}</title>
      <style>
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a365d; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { width: 120px; height: auto; }
        .company-info { text-align: right; font-size: 12px; color: #666; }
        .document-title { text-align: center; font-size: 28px; font-weight: bold; color: #1a365d; margin: 30px 0; text-transform: uppercase; letter-spacing: 2px; }
        .skr-number { text-align: center; font-size: 18px; font-weight: bold; color: #e53e3e; margin-bottom: 30px; padding: 10px; border: 2px solid #e53e3e; display: inline-block; width: 100%; box-sizing: border-box; }
        .section { margin-bottom: 25px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 5px; }
        .section-title { font-size: 16px; font-weight: bold; color: #1a365d; margin-bottom: 15px; border-bottom: 1px solid #cbd5e0; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .info-item { display: flex; flex-direction: column; }
        .info-label { font-weight: bold; color: #4a5568; font-size: 12px; text-transform: uppercase; margin-bottom: 3px; }
        .info-value { font-size: 14px; color: #2d3748; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-issued { background-color: #c6f6d5; color: #22543d; }
        .status-draft { background-color: #e2e8f0; color: #4a5568; }
        .hash-section { background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .hash-value { font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all; background-color: #edf2f7; padding: 10px; border-radius: 3px; margin-top: 5px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #718096; text-align: center; }
        .qr-section { text-align: center; margin: 20px 0; }
        .qr-code { width: 100px; height: 100px; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72px; color: rgba(0, 0, 0, 0.1); z-index: -1; font-weight: bold; }
        .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .signature-box { border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
      <div class="header">
        <div>
          <img src="${getCompanyLogo()}" alt="G1 Holding" class="logo">
        </div>
        <div class="company-info">
          <div><strong>${COMPANY_INFO.name}</strong></div>
          <div>${COMPANY_INFO.address.street}</div>
          <div>${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.country}</div>
          <div>${COMPANY_INFO.address.postal}</div>
          <div>Tel: ${COMPANY_INFO.contact.phone}</div>
          <div>Email: ${COMPANY_INFO.contact.email}</div>
        </div>
      </div>

      <div class="document-title">Secure Keeper Receipt</div>
      <div class="skr-number">${skr.skr_number}</div>

      <div class="section">
        <div class="section-title">Receipt Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value"><span class="status-badge status-${skr.status}">${skr.status.replace('_', ' ').toUpperCase()}</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Issue Date</div>
            <div class="info-value">${skr.issue_date ? formatDateTime(skr.issue_date) : 'Not issued'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Created Date</div>
            <div class="info-value">${formatDateTime(skr.created_at)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Last Updated</div>
            <div class="info-value">${formatDateTime(skr.updated_at)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Client Information</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Client Name</div><div class="info-value">${skr.client?.name || 'N/A'}</div></div>
          <div class="info-item"><div class="info-label">Client Type</div><div class="info-value">${skr.client?.type?.replace('_', ' ').toUpperCase() || 'N/A'}</div></div>
          <div class="info-item"><div class="info-label">Email</div><div class="info-value">${skr.client?.email || 'N/A'}</div></div>
          <div class="info-item"><div class="info-label">Country</div><div class="info-value">${skr.client?.country || 'N/A'}</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Asset Information</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Asset Name</div><div class="info-value">${skr.asset?.asset_name || 'N/A'}</div></div>
          <div class="info-item"><div class="info-label">Asset Type</div><div class="info-value">${skr.asset?.asset_type || 'N/A'}</div></div>
          <div class="info-item"><div class="info-label">Declared Value</div><div class="info-value">${skr.asset ? formatCurrency(skr.asset.declared_value, skr.asset.currency) : 'N/A'}</div></div>
          <div class="info-item"><div class="info-label">Currency</div><div class="info-value">${skr.asset?.currency || 'N/A'}</div></div>
        </div>
        ${skr.asset?.metadata ? `
        <div style="margin-top: 15px;">
          <div class="info-label">Metadata</div>
          <div class="info-value" style="font-size: 12px; background-color: #f7fafc; padding: 10px; border-radius: 3px;">${typeof skr.asset.metadata === 'object' ? JSON.stringify(skr.asset.metadata, null, 2) : skr.asset.metadata}</div>
        </div>
        ` : ''}
      </div>

      ${Array.isArray(skr.tracking) && skr.tracking.length ? `
      <div class="section">
        <div class="section-title">Tracking Summary</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Total Updates</div><div class="info-value">${skr.tracking.length}</div></div>
          <div class="info-item"><div class="info-label">Last Update</div><div class="info-value">${formatDateTime(skr.tracking[0].created_at)}</div></div>
        </div>
      </div>
      ` : ''}

      ${skr.hash ? `
      <div class="hash-section">
        <div class="section-title">Digital Verification</div>
        <div class="info-label">Digital Hash (SHA-256)</div>
        <div class="hash-value">${skr.hash}</div>
        <div style="margin-top: 10px; font-size: 11px; color: #666;">This digital hash ensures the authenticity and integrity of this document.</div>
      </div>
      ` : ''}

      ${qrCodeDataUrl ? `
      <div class="qr-section">
        <div class="section-title">Verification QR Code</div>
        <img src="${qrCodeDataUrl}" alt="Verification QR Code" class="qr-code">
        <div style="font-size: 11px; color: #666; margin-top: 10px;">Scan this QR code to verify the authenticity of this document online</div>
      </div>
      ` : ''}

      ${skr.remarks ? `
      <div class="section">
        <div class="section-title">Remarks</div>
        <div class="info-value">${skr.remarks}</div>
      </div>
      ` : ''}

      ${options.includeSignature ? `
      <div class="signature-section">
        <div class="signature-box"><div>Authorized Signature</div><div style="margin-top: 5px; font-size: 10px; color: #666;">G1 Holding Representative</div></div>
        <div class="signature-box"><div>Date</div><div style="margin-top: 5px; font-size: 10px; color: #666;">${formatDate(new Date().toISOString())}</div></div>
      </div>
      ` : ''}

      <div class="footer">
        <div>This document was generated electronically by G1 Holding's secure document system.</div>
        <div>Registration Number: ${COMPANY_INFO.registration.number} | VAT Number: ${COMPANY_INFO.registration.vat}</div>
        ${COMPANY_INFO.bankDetails ? `<div>Bank: ${COMPANY_INFO.bankDetails.bank_name || ''} • IBAN: ${COMPANY_INFO.bankDetails.iban} • SWIFT/BIC: ${COMPANY_INFO.bankDetails.swift}</div>` : ''}
        <div>Generated on: ${formatDateTime(new Date().toISOString())}</div>
        ${qrCodeDataUrl ? `<div>Verify online at: ${verificationUrl}</div>` : ''}
      </div>
    </body>
    </html>
  `

  const filename = `SKR-${skr.skr_number}-${new Date().toISOString().split('T')[0]}.pdf`
  return await generatePDFFromHTML(html, filename)
}