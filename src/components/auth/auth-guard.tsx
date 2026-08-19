'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth-storage'

type AuthGuardProps = {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    setReady(true)
  }, [pathname, router])

  if (!ready) {
    return null
  }

  return <>{children}</>
}
