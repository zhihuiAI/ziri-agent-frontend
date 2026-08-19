'use client'

import { useEffect, useState } from 'react'
import { channelConfigApi, channelBindingApi, CHANNEL_TYPES, type ChannelConfig, type UserChannelBinding } from '@/features/channels/services/channels'
import { Plus, Pencil, Trash2, Link } from 'lucide-react'
import { toast } from 'sonner'

export default function ChannelManagePage() {
  const [configs, setConfigs] = useState<ChannelConfig[]>([])
  const [bindings, setBindings] = useState<UserChannelBinding[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'configs' | 'bindings'>('configs')
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<ChannelConfig | null>(null)
  const [showBindDialog, setShowBindDialog] = useState(false)

  const [form, setForm] = useState<{
    channel_type: 'feishu' | 'wecom' | 'dingtalk' | 'wechat'
    channel_name: string; app_id: string; app_secret: string
    encrypt_key: string; verification_token: string; webhook_url: string; is_active: boolean
  }>({
    channel_type: 'feishu', channel_name: '', app_id: '', app_secret: '',
    encrypt_key: '', verification_token: '', webhook_url: '', is_active: true,
  })

  const [bindForm, setBindForm] = useState({
    user_id: '', channel_type: 'feishu', channel_user_id: '', channel_user_name: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [configsData, bindingsData] = await Promise.all([
        channelConfigApi.list(),
        channelBindingApi.list(),
      ])
      setConfigs(configsData)
      setBindings(bindingsData)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleConfigSubmit = async () => {
    try {
      if (editing) {
        await channelConfigApi.update(editing.id, form)
        toast.success('更新成功')
      } else {
        await channelConfigApi.create(form)
        toast.success('创建成功')
      }
      setShowDialog(false); setEditing(null); loadData()
    } catch { toast.error('操作失败') }
  }

  const handleConfigDelete = async (config: ChannelConfig) => {
    if (!confirm(`确定要删除渠道 "${config.channel_name}" 吗？`)) return
    try {
      await channelConfigApi.delete(config.id)
      toast.success('删除成功')
      loadData()
    } catch { toast.error('删除失败') }
  }

  const handleBindSubmit = async () => {
    try {
      await channelBindingApi.create(bindForm)
      toast.success('绑定创建成功')
      setShowBindDialog(false)
      setBindForm({ user_id: '', channel_type: 'feishu', channel_user_id: '', channel_user_name: '' })
      loadData()
    } catch { toast.error('绑定失败') }
  }

  const handleBindDelete = async (binding: UserChannelBinding) => {
    if (!confirm('确定要解除绑定吗？')) return
    try {
      await channelBindingApi.delete(binding.id)
      toast.success('已解除绑定')
      loadData()
    } catch { toast.error('操作失败') }
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
      <h1 className="text-2xl font-bold">渠道接入</h1>
      <p className="text-sm text-muted-foreground">管理第三方渠道接入配置和用户绑定</p>

      {/* Tabs */}
      <div className="mt-4 flex gap-2 border-b">
        <button onClick={() => setTab('configs')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'configs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          渠道配置
        </button>
        <button onClick={() => setTab('bindings')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'bindings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          用户绑定
        </button>
      </div>

      {tab === 'configs' && (
        <>
          <div className="mt-4 flex justify-end">
            <button onClick={() => { setEditing(null); setForm({ channel_type: 'feishu', channel_name: '', app_id: '', app_secret: '', encrypt_key: '', verification_token: '', webhook_url: '', is_active: true }); setShowDialog(true) }}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" /> 新增渠道
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {configs.map((config) => (
              <div key={config.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{config.channel_name}</h3>
                    <p className="text-xs text-muted-foreground">{CHANNEL_TYPES.find((t) => t.value === config.channel_type)?.label || config.channel_type}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${config.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {config.is_active ? '启用' : '停用'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>App ID: {config.app_id}</p>
                  <p>创建时间: {new Date(config.created_at).toLocaleString()}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setEditing(config); setForm({ channel_type: config.channel_type, channel_name: config.channel_name, app_id: config.app_id, app_secret: config.app_secret, encrypt_key: config.encrypt_key || '', verification_token: config.verification_token || '', webhook_url: config.webhook_url || '', is_active: config.is_active }); setShowDialog(true) }}
                    className="rounded p-1 hover:bg-accent"><Pencil className="size-4" /></button>
                  <button onClick={() => handleConfigDelete(config)} className="rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'bindings' && (
        <>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setShowBindDialog(true)} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              <Link className="size-4" /> 新增绑定
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">用户ID</th>
                  <th className="px-4 py-3 text-left font-medium">渠道</th>
                  <th className="px-4 py-3 text-left font-medium">渠道用户ID</th>
                  <th className="px-4 py-3 text-left font-medium">渠道用户名</th>
                  <th className="px-4 py-3 text-left font-medium">状态</th>
                  <th className="px-4 py-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {bindings.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3">{b.user_id}</td>
                    <td className="px-4 py-3">{b.channel_type}</td>
                    <td className="px-4 py-3">{b.channel_user_id}</td>
                    <td className="px-4 py-3">{b.channel_user_name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {b.is_active ? '活跃' : '未活跃'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleBindDelete(b)} className="rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Config Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">{editing ? '编辑渠道' : '新增渠道'}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">渠道类型</label>
                <select value={form.channel_type} onChange={(e) => setForm({ ...form, channel_type: e.target.value as 'feishu' | 'wecom' | 'dingtalk' | 'wechat' })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {CHANNEL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium">渠道名称</label><input type="text" value={form.channel_name} onChange={(e) => setForm({ ...form, channel_name: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium">App ID</label><input type="text" value={form.app_id} onChange={(e) => setForm({ ...form, app_id: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium">App Secret</label><input type="password" value={form.app_secret} onChange={(e) => setForm({ ...form, app_secret: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium">启用</label>
                <select value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="true">是</option><option value="false">否</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setShowDialog(false); setEditing(null) }} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">取消</button>
              <button onClick={handleConfigSubmit} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Bind Dialog */}
      {showBindDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">新增用户绑定</h3>
            <div className="mt-4 space-y-3">
              <div><label className="text-sm font-medium">用户ID</label><input type="text" value={bindForm.user_id} onChange={(e) => setBindForm({ ...bindForm, user_id: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium">渠道类型</label>
                <select value={bindForm.channel_type} onChange={(e) => setBindForm({ ...bindForm, channel_type: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {CHANNEL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium">渠道用户ID</label><input type="text" value={bindForm.channel_user_id} onChange={(e) => setBindForm({ ...bindForm, channel_user_id: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-medium">渠道用户名</label><input type="text" value={bindForm.channel_user_name} onChange={(e) => setBindForm({ ...bindForm, channel_user_name: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowBindDialog(false)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">取消</button>
              <button onClick={handleBindSubmit} disabled={!bindForm.user_id || !bindForm.channel_user_id} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">绑定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
