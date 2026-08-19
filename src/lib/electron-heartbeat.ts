/**
 * Electron heartbeat sender.
 * Sends periodic heartbeats to the backend when running in Electron.
 */

import { getToken, getUserId } from '@/lib/auth-storage'

let heartbeatTimer: ReturnType<typeof setInterval> | null = null

export function startHeartbeat() {
  if (heartbeatTimer) return

  heartbeatTimer = setInterval(async () => {
    const userId = getUserId()
    if (!userId) return

    try {
      await fetch('/api/electron/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ user_id: userId }),
      })
    } catch {
      // silent fail - heartbeat is non-critical
    }
  }, 10000) // every 10 seconds
}

export function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}
