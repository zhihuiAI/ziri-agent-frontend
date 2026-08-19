'use client'

import { ThemeProvider } from '@/context/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    init()
    setReady(true)
  }, [init])

  if (!ready) return null
  return <>{children}</>
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (typeof error === 'object' && error !== null) {
                const status = (error as { status?: number }).status
                if (status === 401 || status === 403) return false
              }
              return failureCount < 3
            },
            staleTime: 30 * 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthInitializer>
          {children}
        </AuthInitializer>
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
