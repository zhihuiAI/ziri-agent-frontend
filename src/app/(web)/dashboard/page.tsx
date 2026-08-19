import Link from 'next/link'
import { MessageSquare, Sparkles, Clock, Settings } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-bold">🍃 企业智能助手</h1>
        <p className="mt-3 text-muted-foreground">
          基于 AI Agent 的企业级智能平台，支持多渠道接入与自动化任务调度
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link
            href="/chat"
            className="flex flex-col items-center gap-2 rounded-xl border p-6 hover:bg-accent transition-colors"
          >
            <MessageSquare className="size-8 text-primary" />
            <span className="font-medium">开始对话</span>
            <span className="text-xs text-muted-foreground">与 AI 助手对话</span>
          </Link>

          <Link
            href="/my-skills"
            className="flex flex-col items-center gap-2 rounded-xl border p-6 hover:bg-accent transition-colors"
          >
            <Sparkles className="size-8 text-primary" />
            <span className="font-medium">我的技能</span>
            <span className="text-xs text-muted-foreground">查看可用技能</span>
          </Link>

          <Link
            href="/my-tasks"
            className="flex flex-col items-center gap-2 rounded-xl border p-6 hover:bg-accent transition-colors"
          >
            <Clock className="size-8 text-primary" />
            <span className="font-medium">定时任务</span>
            <span className="text-xs text-muted-foreground">管理自动化任务</span>
          </Link>

          <Link
            href="/skill-manage"
            className="flex flex-col items-center gap-2 rounded-xl border p-6 hover:bg-accent transition-colors"
          >
            <Settings className="size-8 text-primary" />
            <span className="font-medium">系统设置</span>
            <span className="text-xs text-muted-foreground">管理后台</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
