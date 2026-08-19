const SESSION_STORAGE_KEY = 'enterprise_agent_session'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

type StoredSession = {
  token: string
  userId: string
  userName: string
  userRole: string
  expiresAt: number
}

function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

export function getToken(): string | null {
  return readStoredSession()?.token ?? null
}

export function getUserId(): string | null {
  return readStoredSession()?.userId ?? null
}

export function getUserName(): string | null {
  return readStoredSession()?.userName ?? null
}

export function getUserRole(): string | null {
  return readStoredSession()?.userRole ?? null
}

export function setSession(token: string, userId: string, userName: string, userRole: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const session: StoredSession = {
    token,
    userId,
    userName,
    userRole,
    expiresAt: Date.now() + SESSION_MAX_AGE_MS,
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))

  // Also keep backward compatibility with old flat keys
  localStorage.setItem('token', token)
  localStorage.setItem('user_id', userId)
  localStorage.setItem('user_name', userName)
  localStorage.setItem('user_role', userRole)
}

export function clearSession(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(SESSION_STORAGE_KEY)
  localStorage.removeItem('token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_name')
  localStorage.removeItem('user_role')
}

export function isAuthenticated(): boolean {
  return getToken() !== null && getUserId() !== null
}
