'use client'

import React, { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'
import { Bot, User, ChevronDown, ChevronRight, Copy, ThumbsUp, ThumbsDown, Download, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE = 'http://111.229.0.159:8009'

function MessageActions({ content, sessionId, userId, contentRef }: {
  content: string; sessionId: string; userId: string | null
  contentRef?: { current: HTMLDivElement | null }
}) {
  const [extracting, setExtracting] = useState(false)
  const [likeStatus, setLikeStatus] = useState<'like' | 'dislike' | null>(null)

  const handleCopy = async () => {
    if (!content) { toast.error('没有可复制的内容'); return }
    try { await navigator.clipboard.writeText(content); toast.success('已复制到剪贴板') }
    catch { toast.error('复制失败') }
  }
  const handleLike = () => { setLikeStatus(likeStatus === 'like' ? null : 'like') }
  const handleDislike = () => { setLikeStatus(likeStatus === 'dislike' ? null : 'dislike') }
  const handleExtract = async () => {
    setExtracting(true)
    try {
      const res = await fetch(`${API_BASE}/api/skills/extract`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, user_id: userId }),
      })
      const data = await res.json()
      if (data.success) toast.success(`技能萃取成功！已生成: ${data.name}`)
      else toast.error(data.error || '萃取失败')
    } catch { toast.error('萃取失败') }
    finally { setExtracting(false) }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 border-t pt-2">
      <button onClick={handleCopy} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><Copy className="size-3" /> 复制</button>
      <button onClick={handleLike} className={cn('inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent', likeStatus === 'like' ? 'text-blue-500' : 'text-muted-foreground hover:text-foreground')}><ThumbsUp className="size-3" /> 有帮助</button>
      <button onClick={handleDislike} className={cn('inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent', likeStatus === 'dislike' ? 'text-red-500' : 'text-muted-foreground hover:text-foreground')}><ThumbsDown className="size-3" /> 没有帮助</button>
      <button onClick={handleExtract} disabled={extracting} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"><Sparkles className="size-3" /> {extracting ? '萃取中...' : '经验萃取'}</button>
      <button onClick={() => {
          const rendered = contentRef?.current?.innerHTML || content.replace(/\n/g, '<br>')
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Microsoft YaHei',sans-serif;line-height:1.8;padding:40px}table{border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px}code{background:#f0f0f0;padding:2px 5px}pre{background:#f5f5f5;padding:12px}</style></head><body>${rendered}</body></html>`
          // Add UTF-8 BOM so Word correctly detects encoding
          const blob = new Blob(['﻿' + html], { type: 'application/msword;charset=utf-8' })
          const url = URL.createObjectURL(blob); const a = document.createElement('a')
          a.href = url; a.download = `reply-${Date.now()}.doc`; a.click(); URL.revokeObjectURL(url)
        }} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><Download className="size-3" /> 导出</button>
    </div>
  )
}

function ToolCard({ message, defaultExpanded }: { message: Message; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  return (
    <div className="my-1 overflow-hidden rounded-md border text-xs">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-2 bg-muted/50 px-3 py-1.5 text-left hover:bg-muted">
        <span className="text-sm">🔧</span>
        <span className="flex-1 font-medium">执行工具: {message.toolName || message.toolData?.toolName || '未知'}</span>
        <span className="text-muted-foreground">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && <pre className="max-h-48 overflow-auto whitespace-pre-wrap bg-muted/20 px-3 py-2">{message.toolData?.result || message.content}</pre>}
    </div>
  )
}

// ─── TaskListWrapper: collapsible TODO plan ────────────────────
function TaskListWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-primary/20">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 bg-primary/5 px-3 py-2 text-left text-xs font-medium text-primary hover:bg-primary/10">
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        📋 任务计划
      </button>
      {open && <ul className="list-none space-y-1 px-3 py-2">{children}</ul>}
    </div>
  )
}

export function MessageBubble({ message, sessionId = '', userId = null }: {
  message: Message; sessionId?: string; userId?: string | null
}) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'
  const isAssistant = message.role === 'assistant'
  const contentRef = useRef<HTMLDivElement>(null)

  if (isTool) {
    return (
      <div className="flex gap-3 px-4 py-1.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted"><span className="text-sm">🔧</span></div>
        <div className="flex-1"><ToolCard message={message} defaultExpanded={false} /></div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser && 'justify-end')}>
      {!isUser && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">{isAssistant ? <Bot className="size-4 text-primary" /> : <span className="text-sm">🤖</span>}</div>}
      <div className={cn('max-w-[80%] rounded-lg px-4 py-2.5 text-sm', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
        {isUser ? (<p className="whitespace-pre-wrap">{message.content}</p>) : (<>
          <div ref={contentRef} className="max-w-none break-words space-y-3 text-sm leading-relaxed
            [&_p]:my-1 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
            [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1
            [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ul]:space-y-0.5
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_ol]:space-y-0.5
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground
            [&_table]:w-full [&_table]:overflow-auto [&_table]:block [&_table]:my-2
            [&_th]:border [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-muted [&_th]:text-left [&_th]:text-xs
            [&_td]:border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-xs
            [&_code]:rounded [&_code]:bg-muted-foreground/15 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono
            [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted-foreground/10 [&_pre]:p-3 [&_pre]:my-2 [&_pre]:text-xs
            [&_a]:text-primary [&_a]:underline [&_a]:break-all
            [&_a]:text-primary [&_a]:underline [&_a]:break-all">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
              components={{
                ul: ({ children, ...props }: any) => {
                  let isTask = false
                  React.Children.forEach(children, (c: any) => { if (c?.props?.checked !== undefined) isTask = true })
                  if (isTask) return <TaskListWrapper>{children}</TaskListWrapper>
                  return <ul {...props}>{children}</ul>
                },
                li: ({ children, checked, ...props }: any) => {
                  if (checked !== undefined) {
                    return <li className={checked ? 'line-through text-muted-foreground/60' : ''} {...props}>{children}</li>
                  }
                  return <li {...props}>{children}</li>
                },
              }}>
              {message.content.replace(/<\/?todo>/gi, '')}
            </ReactMarkdown>
          </div>
          {sessionId && <MessageActions content={message.content} sessionId={sessionId} userId={userId} contentRef={contentRef} />}
        </>)}
      </div>
      {isUser && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent"><User className="size-4" /></div>}
    </div>
  )
}

export function ThinkingProcess({ children, defaultOpen = false, label = '思考过程' }: { children: React.ReactNode; defaultOpen?: boolean; label?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mx-4 my-2 overflow-hidden rounded-lg border">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 bg-muted/30 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/50">
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        {label}
      </button>
      {open && <div className="border-t bg-muted/10 py-1">{children}</div>}
    </div>
  )
}
