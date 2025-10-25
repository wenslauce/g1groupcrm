import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { filterPresetServiceServer } from '@/lib/filter-presets-server'
import { z } from 'zod'

const createPresetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: z.object({
    types: z.array(z.string()).default([]),
    status: z.array(z.string()).default([]),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    amountMin: z.number().optional(),
    amountMax: z.number().optional(),
    priority: z.string().optional(),
    assignedTo: z.string().optional(),
    tags: z.array(z.string()).default([]),
    customFields: z.record(z.any()).default({})
  })
})

const updatePresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  filters: z.object({
    types: z.array(z.string()).default([]),
    status: z.array(z.string()).default([]),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    amountMin: z.number().optional(),
    amountMax: z.number().optional(),
    priority: z.string().optional(),
    assignedTo: z.string().optional(),
    tags: z.array(z.string()).default([]),
    customFields: z.record(z.any()).default({})
  }).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await authServer.requireAuth()
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'default') {
      const { success, preset, error } = await filterPresetServiceServer.getDefaultPreset()
      
      if (!success) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({ preset })
    }

    // Default: get all user presets
    const { success, presets, error } = await filterPresetServiceServer.getUserPresets()

    if (!success) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ presets })

  } catch (error) {
    console.error('Filter presets API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch presets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await authServer.requireAuth()
    
    const body = await request.json()
    const { name, description, filters } = createPresetSchema.parse(body)

    // Convert date strings to Date objects if present
    const processedFilters = {
      ...filters,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined
    }

    const { success, preset, error } = await filterPresetServiceServer.createPreset(
      name,
      description,
      processedFilters
    )

    if (!success) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true, preset })

  } catch (error) {
    console.error('Create filter preset API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preset data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create preset' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const user = await authServer.requireAuth()
    
    const body = await request.json()
    const { id, name, description, filters } = updatePresetSchema.parse(body)

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (filters !== undefined) {
      updates.filters = {
        ...filters,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined
      }
    }

    const { success, preset, error } = await filterPresetServiceServer.updatePreset(id, updates)

    if (!success) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true, preset })

  } catch (error) {
    console.error('Update filter preset API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preset data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update preset' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const user = await authServer.requireAuth()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      )
    }

    const { success, error } = await filterPresetServiceServer.deletePreset(id)

    if (!success) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete filter preset API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete preset' },
      { status: 500 }
    )
  }
}
