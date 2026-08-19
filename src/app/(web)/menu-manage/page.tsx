'use client'

import { useEffect, useState } from 'react'
import { getAllMenus, createMenu, updateMenu, deleteMenu } from '@/features/menus/services/menus'
import type { Menu, CreateMenuRequest } from '@/types/admin'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function MenuManagePage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Menu | null>(null)

  const [form, setForm] = useState({
    menu_id: '', parent_id: '', menu_name: '', menu_type: 'item' as 'group' | 'item',
    path: '', icon: '', sort_order: 1,
  })

  const loadMenus = () => {
    getAllMenus()
      .then((data) => setMenus(data.menus || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadMenus() }, [])

  const handleSubmit = async () => {
    try {
      if (editing) {
        const result = await updateMenu(editing.menu_id, form)
        if (result.success) toast.success('更新成功')
        else toast.error(result.message || '更新失败')
      } else {
        const result = await createMenu(form as CreateMenuRequest)
        if (result.success) toast.success('创建成功')
        else toast.error(result.message || '创建失败')
      }
      setShowDialog(false)
      setEditing(null)
      loadMenus()
    } catch { toast.error('操作失败') }
  }

  const handleEdit = (menu: Menu) => {
    setEditing(menu)
    setForm({
      menu_id: menu.menu_id,
      parent_id: menu.parent_id || '',
      menu_name: menu.menu_name,
      menu_type: menu.menu_type,
      path: menu.path || '',
      icon: menu.icon || '',
      sort_order: menu.sort_order,
    })
    setShowDialog(true)
  }

  const handleDelete = async (menu: Menu) => {
    if (!confirm(`确定要删除菜单 "${menu.menu_name}" 吗？`)) return
    try {
      await deleteMenu(menu.menu_id)
      toast.success('删除成功')
      loadMenus()
    } catch { toast.error('删除失败') }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ menu_id: '', parent_id: '', menu_name: '', menu_type: 'item', path: '', icon: '', sort_order: 1 })
    setShowDialog(true)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">菜单管理</h1>
          <p className="text-sm text-muted-foreground">管理侧边栏菜单和权限</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          <Plus className="size-4" /> 新建菜单
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">菜单ID</th>
              <th className="px-4 py-3 text-left font-medium">名称</th>
              <th className="px-4 py-3 text-left font-medium">类型</th>
              <th className="px-4 py-3 text-left font-medium">路径</th>
              <th className="px-4 py-3 text-left font-medium">图标</th>
              <th className="px-4 py-3 text-left font-medium">排序</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((menu) => (
              <tr key={menu.menu_id} className="border-t">
                <td className="px-4 py-3 font-medium">{menu.menu_id}</td>
                <td className="px-4 py-3">{menu.menu_name}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">
                    {menu.menu_type === 'group' ? '分组' : '菜单项'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{menu.path || '-'}</td>
                <td className="px-4 py-3">{menu.icon || '-'}</td>
                <td className="px-4 py-3">{menu.sort_order}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(menu)} className="rounded p-1 hover:bg-accent">
                      <Pencil className="size-4" />
                    </button>
                    <button onClick={() => handleDelete(menu)} className="rounded p-1 text-destructive hover:bg-destructive/10">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Menu Form Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">{editing ? '编辑菜单' : '新建菜单'}</h3>
            <div className="mt-4 space-y-3">
              {!editing && (
                <div>
                  <label className="text-sm font-medium">菜单ID</label>
                  <input type="text" value={form.menu_id} onChange={(e) => setForm({ ...form, menu_id: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">父菜单ID</label>
                <input type="text" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} placeholder="留空为顶级菜单" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">菜单名称</label>
                <input type="text" value={form.menu_name} onChange={(e) => setForm({ ...form, menu_name: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">菜单类型</label>
                <select value={form.menu_type} onChange={(e) => setForm({ ...form, menu_type: e.target.value as 'group' | 'item' })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="item">菜单项</option>
                  <option value="group">分组</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">路径</label>
                <input type="text" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">图标 (Lucide icon name)</label>
                <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">排序</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowDialog(false); setEditing(null) }} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">取消</button>
              <button onClick={handleSubmit} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
