import { create } from 'zustand'
import type { DynamicMenu } from '@/types'
import { getUserId } from '@/lib/auth-storage'

interface MenuStore {
  menus: DynamicMenu[]
  isLoaded: boolean
  setMenus: (menus: DynamicMenu[]) => void
  setLoaded: (loaded: boolean) => void
  loadMenus: () => Promise<void>
}

// Default menus matching the original React project exactly
const DEFAULT_USER_MENUS: DynamicMenu[] = [
  { menu_id: 'new_chat', parent_id: null, menu_name: '新建对话', menu_type: 'item', path: '/', icon: '🏠', sort_order: 1, children: [] },
  {
    menu_id: 'skill_center', parent_id: null, menu_name: '技能中心', menu_type: 'group', path: null, icon: '💡', sort_order: 2,
    children: [
      { menu_id: 'my_skills', parent_id: 'skill_center', menu_name: '我的技能', menu_type: 'item', path: '/my-skills', icon: '🎨', sort_order: 1, children: [] },
    ],
  },
  {
    menu_id: 'task_center', parent_id: null, menu_name: '任务中心', menu_type: 'group', path: null, icon: '⏰', sort_order: 3,
    children: [
      { menu_id: 'my_tasks', parent_id: 'task_center', menu_name: '我的任务', menu_type: 'item', path: '/my-tasks', icon: '📝', sort_order: 1, children: [] },
    ],
  },
]

const DEFAULT_ADMIN_MENUS: DynamicMenu[] = [
  { menu_id: 'new_chat', parent_id: null, menu_name: '新建对话', menu_type: 'item', path: '/', icon: '🏠', sort_order: 1, children: [] },
  {
    menu_id: 'skill_center', parent_id: null, menu_name: '技能中心', menu_type: 'group', path: null, icon: '💡', sort_order: 2,
    children: [
      { menu_id: 'my_skills', parent_id: 'skill_center', menu_name: '我的技能', menu_type: 'item', path: '/my-skills', icon: '🎨', sort_order: 1, children: [] },
      { menu_id: 'skill_manage', parent_id: 'skill_center', menu_name: '技能管理', menu_type: 'item', path: '/skill-manage', icon: '⚙️', sort_order: 2, children: [] },
    ],
  },
  {
    menu_id: 'task_center', parent_id: null, menu_name: '任务中心', menu_type: 'group', path: null, icon: '⏰', sort_order: 3,
    children: [
      { menu_id: 'my_tasks', parent_id: 'task_center', menu_name: '我的任务', menu_type: 'item', path: '/my-tasks', icon: '📝', sort_order: 1, children: [] },
      { menu_id: 'task_manage', parent_id: 'task_center', menu_name: '任务管理', menu_type: 'item', path: '/task-manage', icon: '⚙️', sort_order: 2, children: [] },
    ],
  },
  {
    menu_id: 'admin_center', parent_id: null, menu_name: '系统管理', menu_type: 'group', path: null, icon: '⚙️', sort_order: 5,
    children: [
      { menu_id: 'user_manage', parent_id: 'admin_center', menu_name: '用户管理', menu_type: 'item', path: '/user-manage', icon: '👥', sort_order: 1, children: [] },
      { menu_id: 'menu_manage', parent_id: 'admin_center', menu_name: '菜单管理', menu_type: 'item', path: '/menu-manage', icon: '📋', sort_order: 2, children: [] },
      { menu_id: 'channel_manage', parent_id: 'admin_center', menu_name: '渠道接入', menu_type: 'item', path: '/channel-manage', icon: '🌐', sort_order: 3, children: [] },
      { menu_id: 'log_manage', parent_id: 'admin_center', menu_name: '会话管理', menu_type: 'item', path: '/log-manage', icon: '📋', sort_order: 4, children: [] },
    ],
  },
]

export const useMenuStore = create<MenuStore>()((set, get) => ({
  menus: DEFAULT_USER_MENUS,
  isLoaded: false,

  setMenus: (menus) => set({ menus: menus.length ? menus : DEFAULT_USER_MENUS }),

  setLoaded: (isLoaded) => set({ isLoaded }),

  loadMenus: async () => {
    try {
      const userId = getUserId()
      const userRole = localStorage.getItem('user_role') || 'user'

      const response = await fetch(`/api/menus/tree?role=${userRole}`, {
        headers: { 'X-User-Id': userId || '' },
      })
      const data = await response.json()

      if (data.success && data.menus && data.menus.length > 0) {
        set({ menus: data.menus, isLoaded: true })
      } else {
        // Fallback to default menus matching original React project
        const fallback = userRole === 'admin' ? DEFAULT_ADMIN_MENUS : DEFAULT_USER_MENUS
        set({ menus: fallback, isLoaded: true })
      }
    } catch {
      // On error, keep current default menus
      set({ isLoaded: true })
    }
  },
}))
