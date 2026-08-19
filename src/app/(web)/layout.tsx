'use client'

import { AuthGuard } from '@/components/auth/auth-guard'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export default function WebLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthGuard>
  )
}
