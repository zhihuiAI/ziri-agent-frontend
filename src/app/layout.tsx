import type { Metadata } from 'next'
import { AppProviders } from '@/providers/app-providers'
import { fontVariables } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import './globals.css'

export const metadata: Metadata = {
  title: '企业智能助手',
  description: '企业级 AI Agent 平台',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh"
      suppressHydrationWarning
      className={cn(fontVariables, 'font-brand')}
    >
      <body className="min-h-svh antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
