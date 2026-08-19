'use client'

import { useEffect } from 'react'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useMenuStore } from '@/stores/menu-store'
import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import { getSessions } from '@/features/chat/services/chat'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const userId = useAuthStore((s) => s.userId)
  const loadMenus = useMenuStore((s) => s.loadMenus)
  const isMenuLoaded = useMenuStore((s) => s.isLoaded)
  const setSessions = useChatStore((s) => s.setSessions)
  const setIsLoadingSessions = useChatStore((s) => s.setIsLoadingSessions)

  // Load menus on mount
  useEffect(() => {
    if (!isMenuLoaded) {
      loadMenus()
    }
  }, [isMenuLoaded, loadMenus])

  // Load sessions for sidebar
  useEffect(() => {
    if (!userId) return

    setIsLoadingSessions(true)
    getSessions()
      .then((data) => setSessions(data))
      .catch(console.error)
      .finally(() => setIsLoadingSessions(false))
  }, [userId, setSessions, setIsLoadingSessions])

  return (
    <div className="flex h-svh overflow-hidden">
      <AppSidebar />
      <main className="relative flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
