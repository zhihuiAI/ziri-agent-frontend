'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

interface Skill {
  skill_id: string; name: string; description: string; version: string; tags: string[]
  skill_type?: string
  manifest?: { name: string; description: string; version: string; tags: string[]; skill_type?: string }
}

const API_BASE = 'http://111.229.0.159:8009'

function normalizeSkill(skill: Skill): Skill {
  if (skill.manifest) {
    return { skill_id: skill.skill_id, name: skill.manifest.name || skill.name, description: skill.manifest.description || skill.description,
      version: skill.manifest.version || skill.version, tags: skill.manifest.tags || skill.tags || [], skill_type: skill.skill_type || skill.manifest.skill_type }
  }
  return { skill_id: skill.skill_id, name: skill.name, description: skill.description || '', version: skill.version || '1.0.0', tags: skill.tags || [], skill_type: skill.skill_type }
}

export default function SkillManagePage() {
  const userId = useAuthStore((s) => s.userId)
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [userSkills, setUserSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [targetUserId, setTargetUserId] = useState(userId || '')
  const [activeTab, setActiveTab] = useState<'all' | 'assigned'>('all')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const loadData = async () => {
    setLoading(true); setError(null)
    try {
      const [allRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/skills`), fetch(`${API_BASE}/api/skills/user/${targetUserId}`),
      ])
      if (!allRes.ok) throw new Error(`HTTP ${allRes.status}`)
      if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`)
      const allData = await allRes.json()
      const userData = await userRes.json()
      setAllSkills((Array.isArray(allData) ? allData : (allData.skills || [])).map(normalizeSkill))
      setUserSkills((userData.skills || []).map(normalizeSkill))
    } catch (err) { console.error(err); setError(`加载失败: ${err}`) }
    finally { setLoading(false) }
  }
  useEffect(() => { loadData() }, [targetUserId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch(`${API_BASE}/api/skills/upload`, { method: 'POST', body: fd })
      if (res.ok) { toast.success('上传成功'); await loadData() }
      else { const err = await res.json(); toast.error('上传失败: ' + (err.detail || '')) }
    } catch { toast.error('上传失败') }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleAssign = async (skillId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/skills/assign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId, skill_id: skillId }),
      })
      if (res.ok) { toast.success('授权成功'); await loadData() }
      else { const err = await res.json(); toast.error('授权失败: ' + (err.detail || '')) }
    } catch { toast.error('授权失败') }
  }

  const handleRevoke = async (skillId: string) => {
    if (!confirm('确定要撤销该技能的授权吗？')) return
    try {
      const res = await fetch(`${API_BASE}/api/skills/revoke`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId, skill_id: skillId }),
      })
      if (res.ok) { toast.success('撤销成功'); await loadData() }
      else { const err = await res.json(); toast.error('撤销失败') }
    } catch { toast.error('撤销失败') }
  }

  const isAssigned = (skillId: string) => userSkills.some((s) => s.skill_id === skillId)
  const displayed = activeTab === 'all' ? allSkills : userSkills

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <h1 className="text-2xl font-bold">技能管理</h1>
        <p className="text-red-500 mt-1">{error}</p>
        <button onClick={loadData} className="mt-2 rounded-md border px-4 py-2 text-sm hover:bg-accent">重试</button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-4"><h1 className="text-2xl font-bold">技能管理</h1><p className="text-sm text-muted-foreground">管理技能包、分配用户权限</p></div>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium">目标用户ID:</label>
        <input type="text" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} placeholder="输入用户ID" className="h-10 w-48 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <button onClick={loadData} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">加载用户技能</button>
      </div>
      <div className="mb-4">
        <input type="file" ref={fileInputRef} accept=".zip" onChange={handleUpload} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {uploading ? '上传中...' : '+ 上传新技能'}
        </button>
      </div>
      <div className="mb-4 flex gap-2 border-b pb-2">
        {(['all', 'assigned'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab === 'all' ? `系统技能 (${allSkills.length})` : `用户已有 (${userSkills.length})`}
          </button>
        ))}
      </div>
      {loading ? <div className="py-12 text-center text-muted-foreground">加载中...</div>
      : displayed.length === 0 ? <div className="py-12 text-center text-muted-foreground">暂无技能</div>
      : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((skill) => (
            <div key={skill.skill_id} className="flex flex-col rounded-xl border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{skill.name}
                  {skill.skill_type === 'personal' && <span className="ml-2 inline-flex items-center rounded-full bg-purple-500 px-2 py-0.5 text-xs text-white">个人技能</span>}
                </h3>
                <span className="text-xs text-muted-foreground shrink-0">v{skill.version}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{skill.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">{(skill.tags || []).map((tag, i) => <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs">{tag}</span>)}</div>
              <div className="flex justify-end mt-auto pt-2">
                {skill.skill_type === 'personal' ? (
                  <span className="rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">个人技能（自动拥有）</span>
                ) : isAssigned(skill.skill_id) ? (
                  <button onClick={() => handleRevoke(skill.skill_id)} className="rounded-md bg-red-500 px-4 py-1.5 text-xs text-white hover:bg-red-600">撤销授权</button>
                ) : (
                  <button onClick={() => handleAssign(skill.skill_id)} className="rounded-md bg-primary px-4 py-1.5 text-xs text-primary-foreground hover:bg-primary/90">授权用户</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
