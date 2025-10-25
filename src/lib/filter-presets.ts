import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { FilterValues, FilterConfig } from '@/components/search/advanced-filters'

/**
 * Client-side filter preset service
 */
export class ClientFilterPresetService {
  private supabase = createBrowserClient()

  /**
   * Create preset from client-side
   */
  async createPreset(
    name: string,
    filters: FilterValues,
    description?: string
  ): Promise<{ success: boolean; preset?: FilterConfig; error?: string }> {
    try {
      const response = await fetch('/api/filters/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, filters }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create preset: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create preset'
      }
    }
  }

  /**
   * Get user presets from client-side
   */
  async getUserPresets(): Promise<{ success: boolean; presets?: FilterConfig[]; error?: string }> {
    try {
      const response = await fetch('/api/filters/presets')

      if (!response.ok) {
        throw new Error(`Failed to fetch presets: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch presets'
      }
    }
  }

  /**
   * Delete preset from client-side
   */
  async deletePreset(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/filters/presets?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete preset: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete preset'
      }
    }
  }

  /**
   * Update preset from client-side
   */
  async updatePreset(
    id: string,
    updates: Partial<Pick<FilterConfig, 'name' | 'description' | 'filters'>>
  ): Promise<{ success: boolean; preset?: FilterConfig; error?: string }> {
    try {
      const response = await fetch('/api/filters/presets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update preset: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update preset'
      }
    }
  }
}

// Singleton instances
export const clientFilterPresetService = new ClientFilterPresetService()

// Default filter presets
export const defaultFilterPresets: Omit<FilterConfig, 'id' | 'createdAt'>[] = [
  {
    name: 'Active SKRs',
    description: 'Show only active SKRs',
    filters: {
      types: ['skr'],
      status: ['active', 'in_transit'],
      tags: [],
      customFields: {}
    },
    isDefault: false
  },
  {
    name: 'Pending Invoices',
    description: 'Show unpaid invoices',
    filters: {
      types: ['invoice'],
      status: ['pending', 'overdue'],
      tags: [],
      customFields: {}
    },
    isDefault: false
  },
  {
    name: 'Recent Clients',
    description: 'Clients added in the last 30 days',
    filters: {
      types: ['client'],
      status: [],
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      tags: [],
      customFields: {}
    },
    isDefault: false
  },
  {
    name: 'High Value Assets',
    description: 'Assets worth more than $10,000',
    filters: {
      types: ['asset'],
      status: [],
      amountMin: 10000,
      tags: [],
      customFields: {}
    },
    isDefault: false
  }
]