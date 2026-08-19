'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useMenuStore } from '@/stores/menu-store'
import { useChatStore } from '@/stores/chat-store'
import { clearSession } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

/**
 * Render an icon: if it looks like an emoji (single or double character),
 * render it as plain text. Otherwise, display it directly as text.
 * The original project uses emoji strings stored in the icon field.
 */
function MenuIcon({ icon }: { icon: string | null }) {
  if (!icon) return <MessageSquare className="size-4 shrink-0" />
  // If the icon is a short text (like emoji "🏠" or "💡"), render it as text
  if (icon.length <= 4) {
    return <span className="shrink-0 text-base leading-none">{icon}</span>
  }
  // Fallback
  return <MessageSquare className="size-4 shrink-0" />
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // Use selectors to avoid unnecessary re-renders
  const userName = useAuthStore((s) => s.userName)
  const userId = useAuthStore((s) => s.userId)
  const userRole = useAuthStore((s) => s.userRole)
  const reset = useAuthStore((s) => s.reset)
  const menus = useMenuStore((s) => s.menus)
  const sessions = useChatStore((s) => s.sessions)
  const currentSessionId = useChatStore((s) => s.currentSessionId)
  const setCurrentSessionId = useChatStore((s) => s.setCurrentSessionId)

  const [collapsed, setCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set<string>()
  )
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAdmin = userRole === 'admin'

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleLogout = () => {
    clearSession()
    reset()
    router.push('/sign-in')
  }

  const handleNewChat = () => {
    setCurrentSessionId('')
    router.push('/chat')
  }

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    router.push(`/chat?session=${sessionId}`)
  }

  // Filter menus: hide admin group for non-admin users
  const visibleMenus = menus.filter((m) => {
    if (m.menu_id === 'admin_center' && !isAdmin) return false
    // Filter out "对话历史" from API — rendered as hardcoded section below
    if (m.menu_name === '对话历史') return false
    return true
  })

  // Flattened menu items for collapsed sidebar
  const flatItems = visibleMenus.flatMap((m) =>
    m.menu_type === 'item'
      ? [m]
      : (m.children || []).filter((c) => c.menu_type === 'item')
  ).filter((item) => item.menu_id !== 'new_chat') // new_chat has its own button

  return (
    <>
      {/* Collapsed state */}
      {collapsed && (
        <div className="flex h-full w-14 flex-col items-center border-r bg-sidebar py-3 gap-2">
          <button
            onClick={() => setCollapsed(false)}
            className="mb-2 rounded-md p-2 hover:bg-accent"
            title="展开菜单"
          >
            <PanelLeft className="size-5" />
          </button>

          <button
            onClick={handleNewChat}
            className="rounded-md p-2 hover:bg-accent"
            title="新建对话"
          >
            <MessageSquare className="size-5" />
          </button>

          {flatItems.map((item) => (
            <Link
              key={item.menu_id}
              href={item.path || '/'}
              className={cn(
                'rounded-md p-2 hover:bg-accent',
                pathname === item.path && 'bg-primary/10 text-primary'
              )}
              title={item.menu_name}
            >
              <MenuIcon icon={item.icon} />
            </Link>
          ))}

          <div className="mt-auto">
            <button
              className="rounded-md p-2 hover:bg-accent"
              title={`用户: ${userName}`}
            >
              <User className="size-5" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded state */}
      {!collapsed && (
        <div className="flex h-full w-60 flex-col border-r bg-sidebar">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">🍃 企业智能助手</h2>
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-md p-1 hover:bg-accent"
              title="折叠菜单"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {/* Dynamic menu items — exact same logic as original React Sidebar */}
            {visibleMenus.map((menu) => {
              if (menu.menu_type === 'item') {
                const isActive = pathname === menu.path
                return (
                  <div key={menu.menu_id}>
                    {menu.menu_id === 'new_chat' ? (
                      <button
                        onClick={handleNewChat}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent',
                          pathname === '/chat' && !currentSessionId && 'bg-primary/10 text-primary'
                        )}
                      >
                        <MenuIcon icon={menu.icon} />
                        <span>{menu.menu_name}</span>
                      </button>
                    ) : (
                      <Link
                        href={menu.path || '/'}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent',
                          isActive && 'bg-primary/10 text-primary'
                        )}
                      >
                        <MenuIcon icon={menu.icon} />
                        <span>{menu.menu_name}</span>
                      </Link>
                    )}
                  </div>
                )
              }

              // Group menu
              const isExpanded = expandedGroups.has(menu.menu_id)

              return (
                <div key={menu.menu_id}>
                  <button
                    onClick={() => toggleGroup(menu.menu_id)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <MenuIcon icon={menu.icon} />
                    <span className="flex-1 text-left">{menu.menu_name}</span>
                    {isExpanded ? (
                      <ChevronDown className="size-3 shrink-0" />
                    ) : (
                      <ChevronRight className="size-3 shrink-0" />
                    )}
                  </button>
                  {isExpanded && menu.children && menu.children.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {menu.children.map((child) => (
                        <Link
                          key={child.menu_id}
                          href={child.path || '/'}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent',
                            pathname === child.path && 'bg-primary/10 text-primary'
                          )}
                        >
                          <MenuIcon icon={child.icon} />
                          <span>{child.menu_name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Chat history — below all menu groups */}
            <div>
              <button
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                <span className="shrink-0 text-base leading-none">📋</span>
                <span className="flex-1 text-left">对话历史</span>
                {historyExpanded ? (
                  <ChevronDown className="size-3 shrink-0" />
                ) : (
                  <ChevronRight className="size-3 shrink-0" />
                )}
              </button>
              {historyExpanded && (
                <div className="ml-4 max-h-48 overflow-y-auto space-y-1">
                  {sessions.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">暂无对话记录</p>
                  ) : (
                    sessions.map((session) => (
                      <button
                        key={session.session_id}
                        onClick={() => handleSelectSession(session.session_id)}
                        className={cn(
                          'flex w-full flex-col rounded-md px-3 py-1.5 text-left text-xs hover:bg-accent',
                          currentSessionId === session.session_id && 'bg-primary/10'
                        )}
                      >
                        <span className="truncate font-medium">{session.name || '新对话'}</span>
                        <span className="text-muted-foreground">
                          {session.updated_at
                            ? new Date(session.updated_at).toLocaleDateString()
                            : ''}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* User footer */}
          <div className="relative border-t px-2 py-2">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <span className="shrink-0 text-base leading-none">👤</span>
              <div className="flex-1 text-left">
                <div className="text-xs font-medium">{userName || '用户'}</div>
                <div className="text-xs text-muted-foreground">ID: {userId}</div>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-1 rounded-md border bg-popover shadow-lg z-10">
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
                >
                  <LogOut className="size-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
