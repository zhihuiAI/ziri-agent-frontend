'use client'

import { GuestGuard } from '@/components/auth/guest-guard'

export default function AuthRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <GuestGuard>{children}</GuestGuard>
}
