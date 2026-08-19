'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPersonalSkill, updatePersonalSkill, deletePersonalSkill } from '@/features/skills/services/skills'
import { useAuthStore } from '@/stores/auth-store'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PersonalSkillDetailPage() {
  const params = useParams<{ userId: string; skillId: string }>()
  const router = useRouter()
  const userId = params.userId

  const [skill, setSkill] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!userId || !params.skillId) return
    getPersonalSkill(userId, params.skillId)
      .then((data) => {
        setSkill(data)
        setContent(typeof data.content === 'string' ? data.content : JSON.stringify(data, null, 2))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId, params.skillId])

  const handleSave = async () => {
    if (!userId || !params.skillId) return
    setSaving(true)
    try {
      await updatePersonalSkill(userId, params.skillId, { content })
      toast.success('保存成功')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!userId || !params.skillId || !confirm('确定要删除这个技能吗？')) return
    try {
      await deletePersonalSkill(userId, params.skillId)
      toast.success('删除成功')
      router.push('/my-skills')
    } catch {
      toast.error('删除失败')
    }
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-md p-1 hover:bg-accent"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {skill?.name ? String(skill.name) : params.skillId}
            </h1>
            <p className="text-sm text-muted-foreground">个人技能编辑</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 rounded-md border border-destructive px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
            删除
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-96 w-full rounded-md border bg-background p-4 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="技能内容..."
        />
      </div>
    </div>
  )
}
