import { create } from 'zustand'

interface AuthState {
  userId: string | null
  userName: string | null
  userRole: string | null
  isAuthenticated: boolean
  setUser: (userId: string, userName: string, userRole: string) => void
  reset: () => void
  init: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  userId: null,
  userName: null,
  userRole: null,
  isAuthenticated: false,

  setUser: (userId, userName, userRole) =>
    set({ userId, userName, userRole, isAuthenticated: true }),

  reset: () =>
    set({ userId: null, userName: null, userRole: null, isAuthenticated: false }),

  init: () => {
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('user_id')
      const userName = localStorage.getItem('user_name')
      const userRole = localStorage.getItem('user_role')
      const token = localStorage.getItem('token')

      if (userId && token) {
        set({
          userId,
          userName: userName || '',
          userRole: userRole || 'user',
          isAuthenticated: true,
        })
      }
    }
  },
}))
