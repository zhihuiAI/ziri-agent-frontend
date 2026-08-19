'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { setSession } from '@/lib/auth-storage'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  user_id: z.string().min(1, '请输入用户ID'),
  password: z.string().min(1, '请输入密码'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function SignInPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user_id, password: data.password }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSession(result.token, result.user_id, result.user_name, result.role)
        setUser(result.user_id, result.user_name, result.role)

        // Sync to Electron if available
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          ;(window as any).electronAPI.setUserId(result.user_id)
        }

        router.replace('/chat')
      } else {
        setError(result.message || result.detail || '登录失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/50">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">🍃 企业智能助手</h1>
          <p className="mt-2 text-sm text-muted-foreground">欢迎回来，请登录您的账号</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="user_id" className="text-sm font-medium">
              用户ID
            </label>
            <input
              id="user_id"
              type="text"
              {...register('user_id')}
              placeholder="请输入用户ID"
              disabled={loading}
              autoFocus
              className={cn(
                'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                errors.user_id && 'border-destructive'
              )}
            />
            {errors.user_id && (
              <p className="text-xs text-destructive">{errors.user_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              placeholder="请输入密码"
              disabled={loading}
              className={cn(
                'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                errors.password && 'border-destructive'
              )}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground',
              'hover:bg-primary/90',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          请联系管理员创建账号
        </p>
      </div>
    </div>
  )
}
