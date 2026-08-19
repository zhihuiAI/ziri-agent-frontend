import { create } from 'zustand'
import type { Session } from '@/types'

interface ChatStore {
  sessions: Session[]
  currentSessionId: string
  isLoadingSessions: boolean
  setSessions: (sessions: Session[]) => void
  setCurrentSessionId: (id: string) => void
  setIsLoadingSessions: (loading: boolean) => void
  resetCurrentSession: () => void
}

export const useChatStore = create<ChatStore>()((set) => ({
  sessions: [],
  currentSessionId: '',
  isLoadingSessions: false,

  setSessions: (sessions) => set({ sessions }),

  setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),

  setIsLoadingSessions: (isLoadingSessions) => set({ isLoadingSessions }),

  resetCurrentSession: () => set({ currentSessionId: '' }),
}))
