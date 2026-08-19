'use client'

import { useEffect, useState } from 'react'
import { getAllTasks, pauseTask, resumeTask, getTaskStats, type ScheduledTask } from '@/features/tasks/services/tasks'
import { Pause, Play } from 'lucide-react'
import { toast } from 'sonner'

const statusLabels: Record<string, string> = {
  active: '运行中',
  paused: '已暂停',
  completed: '已完成',
  failed: '失败',
}

export default function TaskManagePage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const loadTasks = () => {
    setLoading(true)
    getAllTasks({ page, page_size: 20 })
      .then((data) => {
        setTasks(data.tasks || [])
        setTotal(data.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTasks()
  }, [page])

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'active') {
        await pauseTask(taskId)
        toast.success('任务已暂停')
      } else {
        await resumeTask(taskId)
        toast.success('任务已恢复')
      }
      loadTasks()
    } catch {
      toast.error('操作失败')
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
      <h1 className="text-2xl font-bold">任务管理</h1>
      <p className="text-sm text-muted-foreground">管理系统中的所有定时任务（管理员）</p>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">任务名称</th>
              <th className="px-4 py-3 text-left font-medium">所属用户</th>
              <th className="px-4 py-3 text-left font-medium">类型</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">运行次数</th>
              <th className="px-4 py-3 text-left font-medium">上次运行</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  暂无任务
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.task_id} className="border-t">
                  <td className="px-4 py-3 font-medium">{task.task_name}</td>
                  <td className="px-4 py-3">{task.user_id}</td>
                  <td className="px-4 py-3">{task.task_type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        task.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : task.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabels[task.status] || task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{task.run_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {task.last_run_time
                      ? new Date(task.last_run_time).toLocaleString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(task.task_id, task.status)}
                      className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      {task.status === 'active' ? (
                        <>
                          <Pause className="size-3" /> 暂停
                        </>
                      ) : (
                        <>
                          <Play className="size-3" /> 恢复
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border px-3 py-1 text-sm hover:bg-accent disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {Math.ceil(total / 20)} 页
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
            className="rounded-md border px-3 py-1 text-sm hover:bg-accent disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
