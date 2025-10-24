import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function generateSKRNumber(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  return `G1-SKR-${year}-${randomNum}`
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `G1-INV-${year}${month}-${randomNum}`
}

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear()
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `G1-RCP-${year}${month}-${randomNum}`
}