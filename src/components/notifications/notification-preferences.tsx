'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Smartphone,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface NotificationPreference {
  notification_type: string
  email_enabled: boolean
  sms_enabled: boolean
  in_app_enabled: boolean
  push_enabled: boolean
}

interface NotificationPreferencesProps {
  className?: string
}

const NOTIFICATION_TYPES = [
  {
    type: 'skr_created',
    label: 'SKR Created',
    description: 'When a new SKR is created for your assets'
  },
  {
    type: 'skr_approved',
    label: 'SKR Approved',
    description: 'When your SKR is approved for issuance'
  },
  {
    type: 'skr_issued',
    label: 'SKR Issued',
    description: 'When your SKR is officially issued'
  },
  {
    type: 'skr_status_changed',
    label: 'SKR Status Updates',
    description: 'When your SKR status changes'
  },
  {
    type: 'client_approved',
    label: 'Account Approved',
    description: 'When your account is approved'
  },
  {
    type: 'client_rejected',
    label: 'Account Issues',
    description: 'When there are issues with your account'
  },
  {
    type: 'kyc_document_approved',
    label: 'KYC Approved',
    description: 'When your KYC documents are approved'
  },
  {
    type: 'kyc_document_rejected',
    label: 'KYC Issues',
    description: 'When your KYC documents need revision'
  },
  {
    type: 'invoice_created',
    label: 'New Invoice',
    description: 'When a new invoice is created'
  },
  {
    type: 'invoice_overdue',
    label: 'Overdue Invoice',
    description: 'When an invoice becomes overdue'
  },
  {
    type: 'payment_received',
    label: 'Payment Received',
    description: 'When a payment is received'
  },
  {
    type: 'compliance_alert',
    label: 'Compliance Alerts',
    description: 'Important compliance notifications'
  },
  {
    type: 'security_alert',
    label: 'Security Alerts',
    description: 'Security-related notifications'
  },
  {
    type: 'system_maintenance',
    label: 'System Maintenance',
    description: 'System maintenance notifications'
  }
]

export function NotificationPreferences({ className }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<Record<string, NotificationPreference>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    setLoading(true)
    setError('')

    try {
      const loadedPreferences: Record<string, NotificationPreference> = {}

      // Load preferences for each notification type
      for (const notificationType of NOTIFICATION_TYPES) {
        try {
          const response = await fetch(`/api/notifications/preferences?type=${notificationType.type}`)
          const result = await response.json()

          if (response.ok) {
            loadedPreferences[notificationType.type] = result
          } else {
            // Use default preferences if not found
            loadedPreferences[notificationType.type] = {
              notification_type: notificationType.type,
              email_enabled: true,
              sms_enabled: false,
              in_app_enabled: true,
              push_enabled: true
            }
          }
        } catch (error) {
          // Use default preferences on error
          loadedPreferences[notificationType.type] = {
            notification_type: notificationType.type,
            email_enabled: true,
            sms_enabled: false,
            in_app_enabled: true,
            push_enabled: true
          }
        }
      }

      setPreferences(loadedPreferences)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = (notificationType: string, channel: string, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [notificationType]: {
        ...prev[notificationType],
        [`${channel}_enabled`]: enabled
      }
    }))
  }

  const savePreferences = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const savePromises = Object.values(preferences).map(async (pref) => {
        const response = await fetch('/api/notifications/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pref)
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to save preferences')
        }
      })

      await Promise.all(savePromises)
      setSuccess('Preferences saved successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Preferences</h2>
          <p className="text-muted-foreground">
            Manage how you receive notifications for different events
          </p>
        </div>
        
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications for each type of event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Channel Headers */}
            <div className="grid grid-cols-5 gap-4 pb-2 border-b">
              <div className="font-medium">Notification Type</div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Email</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">SMS</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">In-App</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm">Push</span>
                </div>
              </div>
            </div>

            {/* Notification Type Rows */}
            {NOTIFICATION_TYPES.map((notificationType) => {
              const pref = preferences[notificationType.type]
              if (!pref) return null

              return (
                <div key={notificationType.type} className="grid grid-cols-5 gap-4 items-center py-2">
                  <div>
                    <div className="font-medium">{notificationType.label}</div>
                    <div className="text-sm text-gray-600">{notificationType.description}</div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.email_enabled}
                      onCheckedChange={(checked) => 
                        updatePreference(notificationType.type, 'email', checked)
                      }
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.sms_enabled}
                      onCheckedChange={(checked) => 
                        updatePreference(notificationType.type, 'sms', checked)
                      }
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.in_app_enabled}
                      onCheckedChange={(checked) => 
                        updatePreference(notificationType.type, 'in_app', checked)
                      }
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.push_enabled}
                      onCheckedChange={(checked) => 
                        updatePreference(notificationType.type, 'push', checked)
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Settings</CardTitle>
          <CardDescription>
            Quickly enable or disable all notifications for each channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                const updated = { ...preferences }
                Object.keys(updated).forEach(key => {
                  updated[key] = { ...updated[key], email_enabled: true }
                })
                setPreferences(updated)
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Enable All Email
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const updated = { ...preferences }
                Object.keys(updated).forEach(key => {
                  updated[key] = { ...updated[key], sms_enabled: true }
                })
                setPreferences(updated)
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Enable All SMS
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const updated = { ...preferences }
                Object.keys(updated).forEach(key => {
                  updated[key] = { ...updated[key], in_app_enabled: true }
                })
                setPreferences(updated)
              }}
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable All In-App
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const updated = { ...preferences }
                Object.keys(updated).forEach(key => {
                  updated[key] = { ...updated[key], push_enabled: true }
                })
                setPreferences(updated)
              }}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Enable All Push
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}