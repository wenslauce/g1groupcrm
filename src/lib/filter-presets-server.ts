import { createClient } from '@/lib/supabase/server'
import { FilterValues, FilterConfig } from '@/components/search/advanced-filters'

/**
 * Server-side filter preset service
 */
export class FilterPresetServiceServer {
  private supabase = createClient()

  /**
   * Create a new filter preset
   */
  async createPreset(
    name: string,
    description: string | undefined,
    filters: FilterValues,
    isDefault: boolean = false
  ): Promise<{ success: boolean; preset?: FilterConfig; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('filter_presets')
        .insert({
          name,
          description,
          filters,
          is_default: isDefault
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        preset: {
          id: data.id,
          name: data.name,
          description: data.description,
          filters: data.filters,
          isDefault: data.is_default,
          createdAt: data.created_at
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create preset'
      }
    }
  }

  /**
   * Get user's filter presets
   */
  async getUserPresets(): Promise<{ success: boolean; presets?: FilterConfig[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('filter_presets')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      const presets = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        filters: item.filters,
        isDefault: item.is_default,
        createdAt: item.created_at
      }))

      return { success: true, presets }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch presets'
      }
    }
  }

  /**
   * Update a filter preset
   */
  async updatePreset(
    id: string,
    updates: Partial<Pick<FilterConfig, 'name' | 'description' | 'filters' | 'isDefault'>>
  ): Promise<{ success: boolean; preset?: FilterConfig; error?: string }> {
    try {
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.filters !== undefined) updateData.filters = updates.filters
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault

      const { data, error } = await this.supabase
        .from('filter_presets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        preset: {
          id: data.id,
          name: data.name,
          description: data.description,
          filters: data.filters,
          isDefault: data.is_default,
          createdAt: data.created_at
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update preset'
      }
    }
  }

  /**
   * Delete a filter preset
   */
  async deletePreset(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('filter_presets')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete preset'
      }
    }
  }

  /**
   * Get default filter preset
   */
  async getDefaultPreset(): Promise<{ success: boolean; preset?: FilterConfig; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('filter_presets')
        .select('*')
        .eq('is_default', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No default preset found
          return { success: true, preset: undefined }
        }
        return { success: false, error: error.message }
      }

      return {
        success: true,
        preset: {
          id: data.id,
          name: data.name,
          description: data.description,
          filters: data.filters,
          isDefault: data.is_default,
          createdAt: data.created_at
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch default preset'
      }
    }
  }

  /**
   * Set default filter preset
   */
  async setDefaultPreset(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, unset all default presets
      await this.supabase
        .from('filter_presets')
        .update({ is_default: false })
        .eq('is_default', true)

      // Then set the new default
      const { error } = await this.supabase
        .from('filter_presets')
        .update({ is_default: true })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set default preset'
      }
    }
  }
}

// Singleton instance
export const filterPresetServiceServer = new FilterPresetServiceServer()