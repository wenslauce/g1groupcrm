'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserList } from '@/components/admin/user-list'
import { UserForm } from '@/components/admin/user-form'
import { UserProfile } from '@/types'

export default function AdminUsersPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)

  const handleCreateUser = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleSaveUser = () => {
    setShowForm(false)
    setEditingUser(null)
    // The UserList component will refresh automatically
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions across the system
          </p>
        </div>

        {showForm ? (
          <UserForm
            user={editingUser}
            onSave={handleSaveUser}
            onCancel={handleCancelForm}
          />
        ) : (
          <UserList
            onCreateUser={handleCreateUser}
            onEditUser={handleEditUser}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}