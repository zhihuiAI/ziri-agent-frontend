import { getUserId } from '@/lib/auth-storage'

const API_BASE = '/api'

export type TaskStatus = 'active' | 'paused' | 'completed' | 'failed'
export type TaskType = 'skill' | 'knowledge'

export interface TaskSchedule {
  year?: number
  month?: number
  day?: number
  week?: number
  day_of_week?: string
  hour?: number
  minute?: number
  second?: number
  start_date?: string
  end_date?: string
  timezone?: string
}

export interface ScheduledTask {
  task_id: string
  user_id: string
  task_name: string
  task_type: TaskType
  skill_id?: string
  skill_name?: string
  knowledge_id?: string
  default_prompt: string
  schedule: TaskSchedule
  status: TaskStatus
  last_run_time?: string
  next_run_time?: string
  run_count: number
  last_error?: string
  created_at: string
  updated_at: string
}

export interface CreateTaskRequest {
  task_name: string
  task_type: TaskType
  skill_id?: string
  knowledge_id?: string
  default_prompt: string
  schedule: TaskSchedule
  status?: TaskStatus
}

export interface UpdateTaskRequest {
  task_name?: string
  skill_id?: string
  knowledge_id?: string
  default_prompt?: string
  schedule?: TaskSchedule
  status?: TaskStatus
}

export async function getMyTasks(): Promise<ScheduledTask[]> {
  const userId = getUserId()
  const response = await fetch(`${API_BASE}/tasks/my-tasks?user_id=${userId}`)
  const data = await response.json()
  return data.tasks || []
}

export async function createTask(task: CreateTaskRequest) {
  const userId = getUserId()
  const response = await fetch(`${API_BASE}/tasks/my-tasks?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  return response.json()
}

export async function updateTask(taskId: string, updates: UpdateTaskRequest) {
  const userId = getUserId()
  const response = await fetch(`${API_BASE}/tasks/my-tasks/${taskId}?user_id=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return response.json()
}

export async function deleteTask(taskId: string) {
  const userId = getUserId()
  const response = await fetch(`${API_BASE}/tasks/my-tasks/${taskId}?user_id=${userId}`, {
    method: 'DELETE',
  })
  return response.json()
}

export async function pauseTask(taskId: string) {
  const userId = getUserId()
  const response = await fetch(`${API_BASE}/tasks/my-tasks/${taskId}/pause?user_id=${userId}`, {
    method: 'POST',
  })
  return response.json()
}

export async function resumeTask(taskId: string) {
  const userId = getUserId()
  const response = await fetch(`${API_BASE}/tasks/my-tasks/${taskId}/resume?user_id=${userId}`, {
    method: 'POST',
  })
  return response.json()
}

export async function runTaskNow(taskId: string) {
  const userId = getUserId()
  const response = await fetch(`${API_BASE}/tasks/my-tasks/${taskId}/run-now?user_id=${userId}`, {
    method: 'POST',
  })
  return response.json()
}

export async function getAllTasks(params: {
  user_id?: string
  status?: TaskStatus
  page?: number
  page_size?: number
}) {
  const queryParams = new URLSearchParams()
  if (params.user_id) queryParams.append('user_id', params.user_id)
  if (params.status) queryParams.append('status', params.status)
  if (params.page) queryParams.append('page', String(params.page))
  if (params.page_size) queryParams.append('page_size', String(params.page_size))
  const response = await fetch(`${API_BASE}/tasks/admin/all?${queryParams}`)
  return response.json()
}

export async function getTaskStats() {
  const response = await fetch(`${API_BASE}/tasks/admin/task-stats`)
  return response.json()
}
