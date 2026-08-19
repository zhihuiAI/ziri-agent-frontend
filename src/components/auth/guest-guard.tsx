'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth-storage'

type GuestGuardProps = {
  children: React.ReactNode
}

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      const redirectTo = searchParams.get('redirect') ?? '/chat'
      router.replace(redirectTo)
      return
    }

    setReady(true)
  }, [router, searchParams])

  if (!ready) {
    return null
  }

  return <>{children}</>
}
