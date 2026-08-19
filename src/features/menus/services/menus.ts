import type { Menu, CreateMenuRequest, UpdateMenuRequest, AssignRoleMenuRequest } from '@/types/admin'
import { getUserId } from '@/lib/auth-storage'

const API_BASE = '/api'

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId() || '',
  } as Record<string, string>
}

export async function getMenuTree(role?: string) {
  const queryParams = role ? `?role=${role}` : ''
  const response = await fetch(`${API_BASE}/menus/tree${queryParams}`, { headers: headers() })
  return response.json()
}

export async function getAllMenus() {
  const response = await fetch(`${API_BASE}/menus/list`, { headers: headers() })
  return response.json()
}

export async function getRoleMenus(role: string) {
  const response = await fetch(`${API_BASE}/menus/role-menus?role=${role}`, { headers: headers() })
  return response.json()
}

export async function createMenu(menu: CreateMenuRequest) {
  const response = await fetch(`${API_BASE}/menus/create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(menu),
  })
  return response.json()
}

export async function updateMenu(menuId: string, updates: UpdateMenuRequest) {
  const response = await fetch(`${API_BASE}/menus/${menuId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(updates),
  })
  return response.json()
}

export async function deleteMenu(menuId: string) {
  const response = await fetch(`${API_BASE}/menus/${menuId}`, {
    method: 'DELETE',
    headers: headers(),
  })
  return response.json()
}

export async function assignMenusToRole(req: AssignRoleMenuRequest) {
  const response = await fetch(`${API_BASE}/menus/assign-role`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(req),
  })
  return response.json()
}
