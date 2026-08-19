// 用户角色
export type UserRole = 'admin' | 'user'

// 用户状态
export type UserStatus = 'active' | 'frozen'

// 用户信息
export interface User {
  user_id: string
  user_name: string
  email?: string
  phone?: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

// 创建用户请求
export interface CreateUserRequest {
  user_id: string
  password: string
  user_name: string
  email?: string
  phone?: string
  role: UserRole
  status: UserStatus
}

// 更新用户请求
export interface UpdateUserRequest {
  user_name?: string
  password?: string
  email?: string
  phone?: string
  role?: UserRole
  status?: UserStatus
}

// 菜单类型
export type MenuType = 'group' | 'item'

// 菜单项
export interface Menu {
  menu_id: string
  parent_id: string | null
  menu_name: string
  menu_type: MenuType
  path: string | null
  icon: string | null
  sort_order: number
  is_visible: boolean
  children?: Menu[]
  created_at: string
  updated_at: string
}

// 创建菜单请求
export interface CreateMenuRequest {
  menu_id: string
  parent_id?: string | null
  menu_name: string
  menu_type: MenuType
  path?: string | null
  icon?: string | null
  sort_order?: number
  is_visible?: boolean
}

// 更新菜单请求
export interface UpdateMenuRequest {
  parent_id?: string | null
  menu_name?: string
  menu_type?: MenuType
  path?: string | null
  icon?: string | null
  sort_order?: number
  is_visible?: boolean
}

// 分配角色菜单请求
export interface AssignRoleMenuRequest {
  role: string
  menu_ids: string[]
}
