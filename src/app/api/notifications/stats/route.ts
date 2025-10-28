import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authServer } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        // Require authentication
        const user = await authServer.requireAuth()

        const supabase = createClient()

        // Get notification statistics
        const [
            totalNotifications,
            pendingNotifications,
            sentNotifications,
            failedNotifications,
            recentNotifications
        ] = await Promise.all([
            supabase
                .from('notifications')
                .select('id', { count: 'exact' }),

            supabase
                .from('notifications')
                .select('id', { count: 'exact' })
                .eq('status', 'pending'),

            supabase
                .from('notifications')
                .select('id', { count: 'exact' })
                .eq('status', 'sent'),

            supabase
                .from('notifications')
                .select('id', { count: 'exact' })
                .eq('status', 'failed'),

            supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10)
        ])

        const stats = {
            total: totalNotifications.count || 0,
            pending: pendingNotifications.count || 0,
            sent: sentNotifications.count || 0,
            failed: failedNotifications.count || 0,
            recent: recentNotifications.data || []
        }

        return NextResponse.json(stats)
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}