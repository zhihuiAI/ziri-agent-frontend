'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { getElectronAPI } from '@/lib/tool-executor'
import { Trash2, Loader2 } from 'lucide-react'

interface Skill { skill_id: string; name: string; description: string; version: string; tags: string[]; skill_type?: string }
interface InstallStep { name: string; status: string; message: string; output?: string; manualInstruction?: string; manualUrl?: string; requiresConfirmation?: boolean }
interface InstallResult { success: boolean | null; steps: InstallStep[]; overallStatus: string; message: string; sessionId?: string; waitingForConfirmation?: boolean; completed?: boolean }

const API_BASE = 'http://111.229.0.159:8009'

function needsInstall(skill: Skill) { return skill.skill_id === 'opencli-browser' || skill.skill_id === 'office-cli' }
function isPersonal(skill: Skill) { return skill.skill_type === 'personal' || (skill.tags && skill.tags.includes('个人技能')) }

export default function MySkillsPage() {
  const router = useRouter()
  const userId = useAuthStore((s) => s.userId)
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState('全部')
  const [allTags, setAllTags] = useState<string[]>(['全部'])
  const [showInstall, setShowInstall] = useState(false)
  const [installingSkill, setInstallingSkill] = useState<Skill | null>(null)
  const [installSteps, setInstallSteps] = useState<InstallStep[]>([])
  const [isInstalling, setIsInstalling] = useState(false)
  const [installMsg, setInstallMsg] = useState('')
  const [installStatus, setInstallStatus] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [waitingConfirm, setWaitingConfirm] = useState(false)
  const [isElectron, setIsElectron] = useState(false)
  const [delSkill, setDelSkill] = useState<Skill | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { setIsElectron(!!getElectronAPI()) }, [])

  const loadSkills = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/skills/user/${userId}`)
      const data = await res.json()
      const list: Skill[] = data.skills || []
      setSkills(list)
      const tags = new Set(['全部']); list.forEach((s) => s.tags?.forEach((t) => tags.add(t)))
      setAllTags(Array.from(tags))
    } catch { /* */ } finally { setLoading(false) }
  }
  useEffect(() => { if (userId) loadSkills() }, [userId])

  const handleStartChat = (skillId: string, skillName: string) => {
    router.push(`/chat?selected_skill_id=${encodeURIComponent(skillId)}&selected_skill_name=${encodeURIComponent(skillName)}`)
  }

  const handleDelete = async () => {
    if (!delSkill || !userId) return; setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/api/skills/personal/${userId}/${delSkill.skill_id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) { toast.success(`已删除: ${delSkill.name}`); setDelSkill(null); await loadSkills() }
      else toast.error(d.message || '删除失败')
    } catch { toast.error('删除失败') } finally { setDeleting(false) }
  }

  const getInstallFn = (skillId: string) => {
    const api = getElectronAPI()
    if (!api) return null
    return skillId === 'opencli-browser' ? api.installOpenCLI : skillId === 'office-cli' ? api.installOfficeCLI : null
  }

  const handleInstall = async (skill: Skill) => {
    const api = getElectronAPI()
    if (!api) { toast.error('请在桌面应用中安装插件'); return }
    const fn = getInstallFn(skill.skill_id); if (!fn) { toast.error('暂不支持自动安装'); return }
    setInstallingSkill(skill); setShowInstall(true); setIsInstalling(true); setInstallSteps([]); setInstallStatus(''); setInstallMsg(''); setSessionId(null); setWaitingConfirm(false)
    try {
      if (skill.skill_id === 'opencli-browser') {
        const nc = await api.checkNodeVersion?.()
        if (!nc || !nc.installed) { setInstallSteps([{ name: '检查环境', status: 'failed', message: '未检测到 Node.js，请先安装 Node.js 21+' }]); setIsInstalling(false); return }
        if (!nc.isV21OrHigher) { setInstallSteps([{ name: '检查环境', status: 'failed', message: `Node.js 版本过低 (${nc.version})，需要 >= 21` }]); setIsInstalling(false); return }
      }
      const result: InstallResult = await fn!()
      if (result.steps) { for (const step of result.steps) { setInstallSteps((prev) => [...prev, step]); await new Promise((r) => setTimeout(r, 200)) } }
      if ((result as any).waitingForConfirmation && (result as any).sessionId) { setSessionId((result as any).sessionId); setWaitingConfirm(true); setInstallStatus('pending'); setInstallMsg(result.message || '请安装浏览器扩展后继续') }
      else { setInstallStatus(result.overallStatus || (result.success ? 'success' : 'failed')); setInstallMsg(result.message || (result.success ? '安装完成' : '安装未完成')) }
    } catch (err) { setInstallSteps([{ name: '安装失败', status: 'failed', message: err instanceof Error ? err.message : '未知错误' }]); setInstallStatus('failed') }
    finally { setIsInstalling(false) }
  }

  const continueVerify = async () => {
    const api = getElectronAPI()
    if (!api || !sessionId) return; setIsInstalling(true)
    try {
      setInstallSteps((prev) => { if (!prev.some((s) => s.name === '验证安装')) return [...prev, { name: '验证安装', status: 'running', message: '正在验证...' }]; return prev })
      const result = await api.continueInstallOpenCLI?.({ sessionId }) || { success: false, steps: [], overallStatus: 'failed', message: '' }
      if (result.steps) { setInstallSteps((prev) => { const o = prev.filter((s) => s.name !== '验证安装'); const v = result.steps.find((s) => s.name === '验证安装'); return v ? [...o, v] : result.steps }) }
      setInstallStatus(result.overallStatus); setInstallMsg(result.message)
      if (result.completed) { setWaitingConfirm(false); setSessionId(null) }
      else if (result.waitingForConfirmation && result.sessionId) { setSessionId(result.sessionId); setWaitingConfirm(true) }
    } catch { toast.error('验证失败') } finally { setIsInstalling(false) }
  }

  const closeInstall = () => { if (isInstalling) return; setShowInstall(false); setInstallingSkill(null); setInstallSteps([]); setInstallStatus(''); setInstallMsg(''); setSessionId(null); setWaitingConfirm(false) }

  const filtered = activeTag === '全部' ? skills : skills.filter((s) => s.tags?.includes(activeTag))

  if (loading) return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">加载中...</p></div>

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-4"><h1 className="text-2xl font-bold">我的技能</h1><p className="text-sm text-muted-foreground">查看已授权的技能，点击开始对话可直接使用</p>{!isElectron && <p className="mt-1 text-xs text-yellow-600">非桌面环境，插件安装功能不可用</p>}</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {allTags.map((tag) => <button key={tag} onClick={() => setActiveTag(tag)} className={`rounded-full px-3 py-1 text-xs font-medium ${activeTag === tag ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}>{tag}</button>)}
      </div>
      {filtered.length === 0 ? <div className="py-12 text-center text-muted-foreground">暂无技能，请联系管理员授权</div>
      : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill) => (
          <div key={skill.skill_id} className="flex flex-col rounded-xl border p-4 hover:shadow-md transition-shadow" onClick={() => isPersonal(skill) && router.push(`/personal-skill/${userId}/${skill.skill_id}`)} style={{ cursor: isPersonal(skill) ? 'pointer' : 'default' }}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold">{skill.name}{isPersonal(skill) && <span className="ml-2 rounded-full bg-purple-500 px-2 py-0.5 text-xs text-white">个人技能</span>}</h3>
              <span className="text-xs text-muted-foreground shrink-0">v{skill.version}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{skill.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">{(skill.tags || []).map((t, i) => <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs">{t}</span>)}</div>
            <div className="flex justify-end gap-2 mt-auto pt-2">
              {needsInstall(skill) && (
                <button onClick={(e) => { e.stopPropagation(); handleInstall(skill) }} disabled={isInstalling}
                  className="rounded-md bg-orange-500 px-3 py-1.5 text-xs text-white hover:bg-orange-600 disabled:opacity-50">
                  {isInstalling && installingSkill?.skill_id === skill.skill_id ? '安装中...' : '安装插件'}
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); handleStartChat(skill.skill_id, skill.name) }}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90">
                开始对话
              </button>
              {isPersonal(skill) && (
                <button onClick={(e) => { e.stopPropagation(); setDelSkill(skill) }} disabled={deleting}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50">
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>}
      {showInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={isInstalling || waitingConfirm ? undefined : closeInstall}>
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h2 className="text-lg font-bold">安装 {installingSkill?.name}</h2>{!isInstalling && !waitingConfirm && <button onClick={closeInstall} className="text-lg">&times;</button>}</div>
            <div className="space-y-3">
              {installSteps.map((step, i) => (
                <div key={i} className={`rounded border p-3 ${step.status === 'failed' ? 'border-red-200 bg-red-50' : step.status === 'success' ? 'border-green-200 bg-green-50' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-2"><span>{step.status === 'success' ? 'OK' : step.status === 'failed' ? 'FAIL' : '...'}</span><span className="text-sm font-medium">{step.name}</span><span className="text-xs text-muted-foreground">{step.message}</span></div>
                  {step.output && <pre className="mt-1 text-xs">{step.output}</pre>}
                  {step.status === 'need_manual' && step.manualInstruction && <div className="mt-1 text-xs"><p>{step.manualInstruction}</p>{step.manualUrl && <button onClick={() => window.open(step.manualUrl, '_blank')} className="text-primary hover:underline">打开链接</button>}</div>}
                </div>
              ))}
              {isInstalling && installSteps.length === 0 && <div className="py-4 text-center"><Loader2 className="size-6 animate-spin mx-auto mb-2" /><p className="text-sm">正在准备安装环境...</p></div>}
            </div>
            {waitingConfirm && !isInstalling && <div className="mt-4 text-center"><p className="text-sm mb-3">请先在 Chrome 中安装 OpenCLI 扩展</p><button onClick={continueVerify} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">我已安装扩展，继续验证</button></div>}
            {installStatus && !isInstalling && !waitingConfirm && <div className={`mt-4 rounded-md p-3 text-sm ${installStatus === 'success' ? 'bg-green-50 text-green-700' : installStatus === 'failed' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{installStatus === 'success' ? '安装完成！' : installStatus === 'failed' ? '安装失败' : installMsg}</div>}
            {!isInstalling && !waitingConfirm && <div className="mt-4 flex justify-end"><button onClick={closeInstall} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">关闭</button></div>}
          </div>
        </div>
      )}
      {delSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDelSkill(null)}>
          <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">确认删除</h2><p className="mt-2 text-sm">确定要删除 <strong>"{delSkill.name}"</strong> 吗？此操作不可撤销。</p>
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setDelSkill(null)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">取消</button><button onClick={handleDelete} disabled={deleting} className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50">{deleting ? '删除中...' : '确认删除'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
