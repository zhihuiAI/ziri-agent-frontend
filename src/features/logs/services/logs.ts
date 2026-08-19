import { getUserId } from '@/lib/auth-storage'

const API_BASE = '/api'

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId() || '',
  } as Record<string, string>
}

export async function getConversations(params: {
  user_id?: string
  session_id?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}) {
  const response = await fetch(`${API_BASE}/logs/conversations`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  })
  return response.json()
}

export async function getConversationTurns(userId: string, sessionId: string) {
  const response = await fetch(
    `${API_BASE}/logs/sessions/${userId}/${sessionId}/turns`,
    { headers: headers() }
  )
  return response.json()
}

export async function getTurnDetail(userId: string, sessionId: string, turnId: string) {
  const response = await fetch(
    `${API_BASE}/logs/turns/${userId}/${sessionId}/${turnId}`,
    { headers: headers() }
  )
  return response.json()
}

export async function getSessionLogs(params: {
  user_id?: string
  page?: number
  page_size?: number
}) {
  const response = await fetch(`${API_BASE}/logs/sessions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(params),
  })
  return response.json()
}

export async function getToolNames() {
  const response = await fetch(`${API_BASE}/logs/tools`, { headers: headers() })
  return response.json()
}

export async function getActiveUsers() {
  const response = await fetch(`${API_BASE}/logs/users`, { headers: headers() })
  return response.json()
}
