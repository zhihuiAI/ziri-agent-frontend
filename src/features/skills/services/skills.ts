import type { Skill, SkillAssignment } from '@/types'
import { getUserId } from '@/lib/auth-storage'

const API_BASE = '/api'

export async function getAllSkills(): Promise<Skill[]> {
  const response = await fetch(`${API_BASE}/skills`)
  const data = await response.json()
  return Array.isArray(data) ? data : (data.skills || [])
}

export async function getSkill(skillId: string): Promise<Skill> {
  const response = await fetch(`${API_BASE}/skills/${skillId}`)
  return response.json()
}

export async function getUserSkills(): Promise<Skill[]> {
  const userId = getUserId()
  if (!userId) return []
  const response = await fetch(`${API_BASE}/skills/user/${userId}`)
  const data = await response.json()
  return data.skills || []
}

export async function assignSkill(userId: string, skillId: string) {
  const response = await fetch(`${API_BASE}/skills/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, skill_id: skillId }),
  })
  return response.json()
}

export async function batchAssignSkills(userId: string, skillIds: string[]) {
  const response = await fetch(`${API_BASE}/skills/batch-assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, skill_ids: skillIds }),
  })
  return response.json()
}

export async function revokeSkill(userId: string, skillId: string) {
  const response = await fetch(`${API_BASE}/skills/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, skill_id: skillId }),
  })
  return response.json()
}

export async function uploadSkill(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_BASE}/skills/upload`, {
    method: 'POST',
    body: formData,
  })
  return response.json()
}

// Personal skills
export async function getPersonalSkills(userId: string) {
  const response = await fetch(`${API_BASE}/skills/personal/${userId}`)
  return response.json()
}

export async function getPersonalSkill(userId: string, skillId: string) {
  const response = await fetch(`${API_BASE}/skills/personal/${userId}/${skillId}`)
  return response.json()
}

export async function updatePersonalSkill(userId: string, skillId: string, data: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/skills/personal/${userId}/${skillId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function deletePersonalSkill(userId: string, skillId: string) {
  const response = await fetch(`${API_BASE}/skills/personal/${userId}/${skillId}`, {
    method: 'DELETE',
  })
  return response.json()
}
