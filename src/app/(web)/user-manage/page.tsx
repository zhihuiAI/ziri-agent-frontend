'use client'

import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '@/features/users/services/users'
import type { User, CreateUserRequest } from '@/types/admin'
import { Plus, Pencil, Trash2, Key } from 'lucide-react'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = { admin: '管理员', user: '普通用户' }
const statusLabels: Record<string, string> = { active: '正常', frozen: '已冻结' }

export default function UserManagePage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<User | null>(null)
  const [showResetPwd, setShowResetPwd] = useState<User | null>(null)

  const [form, setForm] = useState({
    user_id: '', password: '', user_name: '', email: '', phone: '', role: 'user' as 'admin' | 'user', status: 'active' as 'active' | 'frozen',
  })

  const loadUsers = () => {
    getUsers({ page, page_size: 20 })
      .then((data) => {
        setUsers(data.users || [])
        setTotal(data.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [page])

  const handleCreate = async () => {
    try {
      const result = await createUser(form as CreateUserRequest)
      if (result.success) {
        toast.success('创建成功')
        setShowCreate(false)
        resetForm()
        loadUsers()
      } else {
        toast.error(result.message || '创建失败')
      }
    } catch { toast.error('创建失败') }
  }

  const handleUpdate = async () => {
    if (!showEdit) return
    try {
      const result = await updateUser(showEdit.user_id, {
        user_name: form.user_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        role: form.role,
        status: form.status,
      })
      if (result.success) {
        toast.success('更新成功')
        setShowEdit(null)
        loadUsers()
      } else {
        toast.error(result.message || '更新失败')
      }
    } catch { toast.error('更新失败') }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`确定要删除用户 ${user.user_name} 吗？`)) return
    try {
      await deleteUser(user.user_id)
      toast.success('删除成功')
      loadUsers()
    } catch { toast.error('删除失败') }
  }

  const handleResetPwd = async () => {
    if (!showResetPwd) return
    try {
      await resetUserPassword(showResetPwd.user_id, form.password)
      toast.success('密码重置成功')
      setShowResetPwd(null)
    } catch { toast.error('重置失败') }
  }

  const resetForm = () => {
    setForm({ user_id: '', password: '', user_name: '', email: '', phone: '', role: 'user', status: 'active' })
  }

  const openEdit = (user: User) => {
    setShowEdit(user)
    setForm({
      user_id: user.user_id,
      password: '',
      user_name: user.user_name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    })
  }

  const openResetPwd = (user: User) => {
    setShowResetPwd(user)
    setForm((prev) => ({ ...prev, password: '' }))
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
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="text-sm text-muted-foreground">管理系统用户</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true) }}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> 新建用户
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">用户ID</th>
              <th className="px-4 py-3 text-left font-medium">用户名</th>
              <th className="px-4 py-3 text-left font-medium">角色</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">创建时间</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-t">
                <td className="px-4 py-3 font-medium">{user.user_id}</td>
                <td className="px-4 py-3">{user.user_name}</td>
                <td className="px-4 py-3">{roleLabels[user.role] || user.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {statusLabels[user.status] || user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.created_at}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(user)} className="rounded p-1 hover:bg-accent" title="编辑">
                      <Pencil className="size-4" />
                    </button>
                    <button onClick={() => openResetPwd(user)} className="rounded p-1 hover:bg-accent" title="重置密码">
                      <Key className="size-4" />
                    </button>
                    <button onClick={() => handleDelete(user)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="删除">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Form Dialog */}
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">{showCreate ? '新建用户' : '编辑用户'}</h3>
            <div className="mt-4 space-y-3">
              {showCreate && (
                <div>
                  <label className="text-sm font-medium">用户ID</label>
                  <input type="text" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              )}
              {showCreate && (
                <div>
                  <label className="text-sm font-medium">密码</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">用户名</label>
                <input type="text" value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">邮箱</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">手机号</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium">角色</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'user' })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'frozen' })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="active">正常</option>
                  <option value="frozen">冻结</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowCreate(false); setShowEdit(null) }} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">取消</button>
              <button onClick={showCreate ? handleCreate : handleUpdate} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {showResetPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">重置密码: {showResetPwd.user_name}</h3>
            <div className="mt-4">
              <label className="text-sm font-medium">新密码</label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowResetPwd(null)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">取消</button>
              <button onClick={handleResetPwd} disabled={!form.password} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
