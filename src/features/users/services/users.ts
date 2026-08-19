import type { User, CreateUserRequest, UpdateUserRequest, UserRole, UserStatus } from '@/types/admin'
import { getUserId } from '@/lib/auth-storage'

const API_BASE = '/api'

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId() || '',
  } as Record<string, string>
}

export async function getUsers(params: {
  user_id?: string
  user_name?: string
  role?: UserRole
  status?: UserStatus
  page?: number
  page_size?: number
}) {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, String(value))
  })
  const response = await fetch(`${API_BASE}/users/list?${queryParams}`, { headers: headers() })
  return response.json()
}

export async function createUser(user: CreateUserRequest) {
  const response = await fetch(`${API_BASE}/users/create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(user),
  })
  return response.json()
}

export async function updateUser(userId: string, updates: UpdateUserRequest) {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(updates),
  })
  return response.json()
}

export async function deleteUser(userId: string) {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: headers(),
  })
  return response.json()
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const response = await fetch(
    `${API_BASE}/users/${userId}/reset-password?new_password=${encodeURIComponent(newPassword)}`,
    { method: 'POST', headers: headers() }
  )
  return response.json()
}
