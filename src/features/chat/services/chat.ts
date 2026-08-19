import type { Message, Session, SSEEvent } from '@/types'
import { getUserId } from '@/lib/auth-storage'
// Use direct backend URL for SSE streaming (Next.js rewrites may buffer SSE)
const API_DIRECT = 'http://111.229.0.159:8009'

function getClientEnv(): string {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return 'electron'
  }
  return 'web'
}

export async function streamChat(
  query: string,
  sessionId: string,
  onMessage: (event: SSEEvent) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
  selectedSkillIds?: string[],
  requireApproval?: boolean,
  workDir?: string,
  approvalMode?: string,
) {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  // Use direct backend URL to ensure SSE streaming works
  const response = await fetch(`${API_DIRECT}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      session_id: sessionId,
      query,
      stream: true,
      selected_skill_ids: selectedSkillIds && selectedSkillIds.length > 0 ? selectedSkillIds : null,
      client_env: getClientEnv(),
      require_approval: requireApproval || false,
      approval_mode: approvalMode || 'auto',
      work_dir: workDir || '',
    }),
  })
  console.log('[streamChat] require_approval:', requireApproval, 'body:', JSON.stringify({ query: query.slice(0, 30), require_approval: requireApproval || false }))

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onComplete()
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      onComplete()
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6)) as SSEEvent
          onMessage(data)
        } catch {
          // skip parse errors
        }
      }
    }
  }
}

// These use the Next.js rewrite proxy (non-streaming, fine for REST)
export async function getSessions(): Promise<Session[]> {
  const userId = getUserId()
  if (!userId) return []

  const response = await fetch(`/api/memory/sessions?user_id=${userId}`)
  const data = await response.json()
  return data.sessions || []
}

export async function createSession(name?: string): Promise<Session> {
  const userId = getUserId()
  if (!userId) throw new Error('User not authenticated')

  const response = await fetch('/api/memory/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, name }),
  })
  return response.json()
}

export async function getHistory(sessionId: string, limit = 50): Promise<Message[]> {
  const userId = getUserId()
  if (!userId) return []

  const response = await fetch(
    `/api/memory/history?user_id=${userId}&session_id=${sessionId}&limit=${limit}`
  )
  const data = await response.json()
  return data.messages || []
}
