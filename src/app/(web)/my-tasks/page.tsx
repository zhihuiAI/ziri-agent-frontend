'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RotateCw, Play, Pause } from 'lucide-react'

type TaskStatus = 'active' | 'paused' | 'completed' | 'failed'
interface TaskSchedule { year?: number; month?: number; day?: number; week?: number; day_of_week?: string; hour?: number; minute?: number; second?: number; start_date?: string; end_date?: string; timezone?: string }
interface ScheduledTask { task_id: string; user_id: string; task_name: string; task_type: string; skill_id?: string; skill_name?: string; default_prompt: string; schedule: TaskSchedule; status: TaskStatus; last_run_time?: string; next_run_time?: string; run_count: number; created_at: string; updated_at: string }
interface Skill { skill_id: string; name: string; description: string; version: string; tags: string[] }

const API_BASE = 'http://111.229.0.159:8009'
const statusConfig: Record<string, { text: string; cls: string }> = {
  active: { text: '运行中', cls: 'bg-green-100 text-green-700' },
  paused: { text: '已暂停', cls: 'bg-yellow-100 text-yellow-700' },
  completed: { text: '已完成', cls: 'bg-blue-100 text-blue-700' },
  failed: { text: '失败', cls: 'bg-red-100 text-red-700' },
}

function fmtSchedule(s: TaskSchedule) {
  const p: string[] = []
  if (s.hour !== undefined && s.minute !== undefined) p.push(`${String(s.hour).padStart(2,'0')}:${String(s.minute).padStart(2,'0')}`)
  const wm: Record<string,string> = { mon:'周一', tue:'周二', wed:'周三', thu:'周四', fri:'周五', sat:'周六', sun:'周日' }
  if (s.day_of_week) p.push(wm[s.day_of_week] || s.day_of_week)
  if (s.day) p.push(`每月${s.day}日`)
  return p.length ? p.join(' ') : '定时'
}

export default function MyTasksPage() {
  const userId = useAuthStore((s) => s.userId)
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null)
  const [userSkills, setUserSkills] = useState<Skill[]>([])
  const [form, setForm] = useState({ task_name: '', task_type: 'skill', skill_id: '', default_prompt: '', schedule: { hour: 9, minute: 0, second: 0, timezone: 'Asia/Shanghai' } as TaskSchedule, status: 'active' as TaskStatus })

  useEffect(() => { if (!userId) return; fetch(`${API_BASE}/api/skills/user/${userId}`).then((r) => r.json()).then((d) => setUserSkills(d.skills || [])).catch(() => {}) }, [userId])
  const loadTasks = async () => { if (!userId) return; setLoading(true); try { const res = await fetch(`${API_BASE}/api/tasks/my-tasks?user_id=${userId}`); const data = await res.json(); if (data.success) setTasks(data.tasks || []) } catch { /* */ } finally { setLoading(false) } }
  useEffect(() => { loadTasks() }, [userId])

  const openCreate = () => { setEditingTask(null); setForm({ task_name: '', task_type: 'skill', skill_id: '', default_prompt: '', schedule: { hour: 9, minute: 0, second: 0, timezone: 'Asia/Shanghai' }, status: 'active' }); setShowModal(true) }
  const openEdit = (t: ScheduledTask) => { setEditingTask(t); setForm({ task_name: t.task_name, task_type: t.task_type, skill_id: t.skill_id || '', default_prompt: t.default_prompt, schedule: t.schedule, status: t.status }); setShowModal(true) }

  const handleSubmit = async () => {
    if (!form.task_name || !form.default_prompt) { toast.error('请填写任务名称和默认话术'); return }; if (!userId) return
    try {
      if (editingTask) {
        const res = await fetch(`${API_BASE}/api/tasks/my-tasks/${editingTask.task_id}?user_id=${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_name: form.task_name, skill_id: form.skill_id || undefined, default_prompt: form.default_prompt, schedule: form.schedule, status: form.status }) })
        const d = await res.json(); toast.success(d.success ? '任务更新成功' : (d.message || '更新失败'))
      } else {
        const res = await fetch(`${API_BASE}/api/tasks/my-tasks?user_id=${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_name: form.task_name, task_type: form.task_type, skill_id: form.skill_id || undefined, default_prompt: form.default_prompt, schedule: form.schedule, status: form.status }) })
        const d = await res.json(); toast.success(d.success ? '任务创建成功' : (d.message || '创建失败'))
      }
      setShowModal(false); await loadTasks()
    } catch { toast.error('保存失败') }
  }

  const handleDelete = async (taskId: string) => { if (!confirm('确定删除？') || !userId) return; try { await fetch(`${API_BASE}/api/tasks/my-tasks/${taskId}?user_id=${userId}`, { method: 'DELETE' }); toast.success('已删除'); await loadTasks() } catch { toast.error('删除失败') } }
  const toggleStatus = async (taskId: string, current: string) => { if (!userId) return; const action = current === 'active' ? 'pause' : 'resume'; try { await fetch(`${API_BASE}/api/tasks/my-tasks/${taskId}/${action}?user_id=${userId}`, { method: 'POST' }); await loadTasks() } catch { toast.error('操作失败') } }
  const runNow = async (taskId: string) => { if (!userId) return; try { await fetch(`${API_BASE}/api/tasks/my-tasks/${taskId}/run-now?user_id=${userId}`, { method: 'POST' }); toast.success('已触发执行') } catch { toast.error('执行失败') } }

  if (loading) return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">加载中...</p></div>

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between"><div><h1 className="text-2xl font-bold">我的任务</h1><p className="text-sm text-muted-foreground">管理您的定时任务</p></div><button onClick={openCreate} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"><Plus className="size-4"/> 新建任务</button></div>
      {tasks.length === 0 ? (<div className="py-16 text-center"><p className="text-muted-foreground">暂无定时任务</p><button onClick={openCreate} className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">创建第一个任务</button></div>) : (
        <div className="overflow-hidden rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted/50"><tr><th className="px-4 py-3 text-left font-medium">任务名称</th><th className="px-4 py-3 text-left font-medium">技能</th><th className="px-4 py-3 text-left font-medium">定时规则</th><th className="px-4 py-3 text-left font-medium">状态</th><th className="px-4 py-3 text-left font-medium">执行次数</th><th className="px-4 py-3 text-left font-medium">上次执行</th><th className="px-4 py-3 text-left font-medium">操作</th></tr></thead><tbody>
          {tasks.map((t) => (<tr key={t.task_id} className="border-t"><td className="px-4 py-3 font-medium">{t.task_name}</td><td className="px-4 py-3 text-muted-foreground">{t.skill_name || '-'}</td><td className="px-4 py-3">{fmtSchedule(t.schedule)}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${statusConfig[t.status]?.cls || ''}`}>{statusConfig[t.status]?.text || t.status}</span></td><td className="px-4 py-3">{t.run_count}</td><td className="px-4 py-3 text-xs text-muted-foreground">{t.last_run_time ? new Date(t.last_run_time).toLocaleString() : '-'}</td><td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => runNow(t.task_id)} className="rounded p-1.5 hover:bg-accent"><RotateCw className="size-3.5"/></button><button onClick={() => openEdit(t)} className="rounded p-1.5 hover:bg-accent"><Pencil className="size-3.5"/></button><button onClick={() => toggleStatus(t.task_id, t.status)} className="rounded p-1.5 hover:bg-accent">{t.status === 'active' ? <Pause className="size-3.5"/> : <Play className="size-3.5"/>}</button><button onClick={() => handleDelete(t.task_id)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="size-3.5"/></button></div></td></tr>))}
        </tbody></table></div>
      )}
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}><div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">{editingTask ? '编辑任务' : '新建任务'}</h3><button onClick={() => setShowModal(false)} className="rounded p-1 hover:bg-accent text-lg">&times;</button></div><div className="space-y-4"><div><label className="text-sm font-medium">任务名称 *</label><input type="text" value={form.task_name} onChange={(e) => setForm({...form, task_name: e.target.value})} placeholder="例如：每日邮件报告" className="mt-1 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div><div><label className="text-sm font-medium">选择技能</label><select value={form.skill_id} onChange={(e) => setForm({...form, skill_id: e.target.value})} className="mt-1 h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">无</option>{userSkills.map((s) => <option key={s.skill_id} value={s.skill_id}>{s.name}</option>)}</select></div><div><label className="text-sm font-medium">定时设置</label><div className="mt-1 flex items-center gap-2"><input type="number" placeholder="时" value={form.schedule.hour ?? 9} onChange={(e) => setForm({...form, schedule: {...form.schedule, hour: parseInt(e.target.value)||0}})} className="h-10 w-20 rounded-md border bg-background px-2 py-2 text-sm" /><span>:</span><input type="number" placeholder="分" value={form.schedule.minute ?? 0} onChange={(e) => setForm({...form, schedule: {...form.schedule, minute: parseInt(e.target.value)||0}})} className="h-10 w-20 rounded-md border bg-background px-2 py-2 text-sm" /><select value={form.schedule.day_of_week || ''} onChange={(e) => setForm({...form, schedule: {...form.schedule, day_of_week: e.target.value || undefined}})} className="h-10 rounded-md border bg-background px-2 py-2 text-sm"><option value="">每天</option><option value="mon">每周一</option><option value="tue">每周二</option><option value="wed">每周三</option><option value="thu">每周四</option><option value="fri">每周五</option><option value="sat">每周六</option><option value="sun">每周日</option></select></div></div><div><label className="text-sm font-medium">默认话术 *</label><textarea rows={4} value={form.default_prompt} onChange={(e) => setForm({...form, default_prompt: e.target.value})} placeholder="例如：帮我查看昨天到现在的所有的邮件，总结为报告，发送飞书消息" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" /></div></div><div className="mt-6 flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">取消</button><button onClick={handleSubmit} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">保存</button></div></div></div>)}
    </div>
  )
}
