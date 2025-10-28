import { InvoiceStatus, PaymentMethod, CreditNoteReason, CreditNoteStatus } from '@/types'

export const financialUtils = {
  // Invoice utilities
  getInvoiceStatusDisplayName(status: InvoiceStatus): string {
    const statusNames: Record<InvoiceStatus, string> = {
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled'
    }
    return statusNames[status]
  },

  getInvoiceStatusColor(status: InvoiceStatus): string {
    const statusColors: Record<InvoiceStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return statusColors[status]
  },

  getAllInvoiceStatuses(): { value: InvoiceStatus; label: string }[] {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'cancelled', label: 'Cancelled' }
    ]
  },

  // Payment method utilities
  getPaymentMethodDisplayName(method: PaymentMethod): string {
    const methodNames: Record<PaymentMethod, string> = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      check: 'Check',
      crypto: 'Cryptocurrency',
      other: 'Other'
    }
    return methodNames[method]
  },

  getAllPaymentMethods(): { value: PaymentMethod; label: string }[] {
    return [
      { value: 'bank_transfer', label: 'Bank Transfer' },
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'debit_card', label: 'Debit Card' },
      { value: 'cash', label: 'Cash' },
      { value: 'check', label: 'Check' },
      { value: 'crypto', label: 'Cryptocurrency' },
      { value: 'other', label: 'Other' }
    ]
  },

  // Credit note utilities
  getCreditNoteReasonDisplayName(reason: CreditNoteReason): string {
    const reasonNames: Record<CreditNoteReason, string> = {
      return: 'Return',
      discount: 'Discount',
      error: 'Error Correction',
      cancellation: 'Cancellation',
      other: 'Other'
    }
    return reasonNames[reason]
  },

  getCreditNoteStatusDisplayName(status: CreditNoteStatus): string {
    const statusNames: Record<CreditNoteStatus, string> = {
      draft: 'Draft',
      issued: 'Issued',
      applied: 'Applied'
    }
    return statusNames[status]
  },

  getCreditNoteStatusColor(status: CreditNoteStatus): string {
    const statusColors: Record<CreditNoteStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      issued: 'bg-blue-100 text-blue-800',
      applied: 'bg-green-100 text-green-800'
    }
    return statusColors[status]
  },

  getAllCreditNoteReasons(): { value: CreditNoteReason; label: string }[] {
    return [
      { value: 'return', label: 'Return' },
      { value: 'discount', label: 'Discount' },
      { value: 'error', label: 'Error Correction' },
      { value: 'cancellation', label: 'Cancellation' },
      { value: 'other', label: 'Other' }
    ]
  }
}