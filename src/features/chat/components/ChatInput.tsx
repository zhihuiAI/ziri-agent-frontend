'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, type KeyboardEvent } from 'react'
import { SendHorizonal, Maximize2, Minimize2, Bot, Paperclip, X, Layout, Check, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChatInputHandle {
  removeTrailingAt: () => void
  setInputText: (text: string) => void
}

interface ChatInputProps {
  onSend: (message: string) => void
  isProcessing: boolean
  selectedSkillCount?: number
  onAtTrigger?: () => void
  onFileUpload?: () => void
  onSkillSelect?: () => void
  models?: string[]
  selectedModel?: string
  onSelectModel?: (model: string) => void
  approvalMode?: 'auto' | 'manual' | 'smart'
  onSetApprovalMode?: (mode: 'auto' | 'manual' | 'smart') => void
  selectedMode?: string
  onSelectMode?: (mode: string) => void
  workDir?: string
  onSelectWorkDir?: () => void
  isElectron?: boolean
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  function ChatInput({ onSend, isProcessing, selectedSkillCount = 0, onAtTrigger, onFileUpload, onSkillSelect, models = [], selectedModel = '', onSelectModel, approvalMode = 'smart', onSetApprovalMode, selectedMode = 'plan', onSelectMode, workDir, onSelectWorkDir, isElectron }, ref) {
    const [input, setInput] = useState('')
    const [expanded, setExpanded] = useState(false)
    const [showModelMenu, setShowModelMenu] = useState(false)
    const [showPlusMenu, setShowPlusMenu] = useState(false)
    const [showApproval, setShowApproval] = useState(false)
    const [showModeMenu, setShowModeMenu] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close all popups when clicking outside the input container
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setShowModelMenu(false)
          setShowModeMenu(false)
          setShowPlusMenu(false)
          setShowApproval(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [])

    useImperativeHandle(ref, () => ({
      removeTrailingAt: () => {
        setInput((prev) => {
          const idx = prev.lastIndexOf('@')
          return idx !== -1 ? prev.slice(0, idx) : prev
        })
      },
      setInputText: (text: string) => {
        setInput(text)
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
        }
      },
    }))

    const handleSend = () => {
      if (!input.trim() || isProcessing) return
      onSend(input.trim())
      setInput('')
      setExpanded(false)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setInput(newValue)
      if (newValue.endsWith('@') && onAtTrigger) onAtTrigger()
    }

    const toggleExpand = () => setExpanded((prev) => !prev)

    const placeholder = selectedSkillCount > 0
      ? `已选择 ${selectedSkillCount} 个技能，输入问题... (@选择技能, Enter发送)`
      : '输入问题... 输入 @ 选择技能 (Enter发送, Shift+Enter换行)'

    const containerClass = expanded
      ? 'absolute inset-0 z-40 flex flex-col bg-card p-4'
      : 'relative flex flex-col rounded-xl border bg-card'

    return (
      <div ref={containerRef} className={cn(containerClass, 'flex-1')}>
        {/* Textarea */}
        <textarea ref={textareaRef} value={input} onChange={handleChange}
          onKeyDown={handleKeyDown} placeholder={placeholder}
          disabled={isProcessing} rows={1}
          className={cn(
            'w-full resize-none bg-transparent px-3 py-3 text-sm',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            expanded ? 'flex-1' : 'min-h-[80px]'
          )}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            {/* Model selector */}
            <div className="relative">
              <button onMouseDown={() => {}}onClick={() => setShowModelMenu(!showModelMenu)} disabled={isProcessing}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                title="选择模型">
                <Bot className="size-4" />
                {selectedModel && <span className="max-w-[80px] truncate">{selectedModel}</span>}
              </button>
              {showModelMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-48 rounded-md border bg-popover shadow-lg z-50" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">选择模型</div>
                  {models.map((m) => (
                    <button key={m}
                      onMouseDown={() => {}}onClick={() => { onSelectModel?.(m); setShowModelMenu(false) }}
                      className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent',
                        selectedModel === m && 'bg-primary/5 text-primary')}>
                      <Bot className="size-3.5" /> {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mode selector */}
            <div className="relative">
              <button onMouseDown={() => {}}onClick={() => setShowModeMenu(!showModeMenu)} disabled={isProcessing}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                title="选择模式">
                <Layout className="size-4" />
                <span>{selectedMode === 'plan' ? '计划模式' : '通用模式'}</span>
              </button>
              {showModeMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-52 rounded-md border bg-popover shadow-lg z-50 p-2 text-xs" onMouseDown={(e) => e.stopPropagation()}>
                  <button onMouseDown={() => {}}onClick={() => { onSelectMode?.('general'); setShowModeMenu(false) }}
                    className={cn('w-full rounded-md px-3 py-2 text-left hover:bg-accent', selectedMode === 'general' && 'bg-blue-50')}>
                    <div className="font-medium">通用模式</div>
                    <div className="mt-0.5 text-muted-foreground">AI自主决定是否规划执行</div>
                  </button>
                  <button onMouseDown={() => {}}onClick={() => { onSelectMode?.('plan'); setShowModeMenu(false) }}
                    className={cn('mt-1 w-full rounded-md px-3 py-2 text-left hover:bg-accent', selectedMode === 'plan' && 'bg-blue-50')}>
                    <div className="font-medium">计划模式</div>
                    <div className="mt-0.5 text-muted-foreground">AI先制定TODO计划再执行</div>
                  </button>
                </div>
              )}
            </div>

            {/* + button */}
            <div className="relative">
              <button onMouseDown={() => {}}onClick={() => setShowPlusMenu(!showPlusMenu)} disabled={isProcessing}
                className="flex h-7 w-7 items-center justify-center rounded-md text-lg font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                title="添加内容">
                +
              </button>
              {showPlusMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-44 rounded-md border bg-popover shadow-lg z-50" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">添加内容</div>
                  <button onMouseDown={() => {}}onClick={() => { setShowPlusMenu(false); onFileUpload?.() }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                    <Paperclip className="size-4" /> 上传文件
                  </button>
                  <button onMouseDown={() => {}}onClick={() => { setShowPlusMenu(false); onSkillSelect?.() }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                    🔧 选择技能
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Working directory */}
            <button onClick={onSelectWorkDir} disabled={isProcessing || !isElectron}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              title={isElectron ? (workDir || '点击选择工作目录') : '请使用桌面应用选择本地工作目录'}>
              <Folder className="size-3.5" />
              <span className="max-w-[100px] truncate">
                {isElectron && workDir ? `本地-${workDir.split(/[\\/]/).pop() || workDir}` : '工作目录'}
              </span>
            </button>

            {/* Approval mode toggle */}
            <div className="relative">
              <button onMouseDown={() => {}}onClick={() => setShowApproval(!showApproval)} disabled={isProcessing}
                className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-xs disabled:opacity-50',
                  approvalMode === 'auto' ? 'text-green-600 hover:bg-green-50' : approvalMode === 'smart' ? 'text-blue-600 hover:bg-blue-50' : 'text-orange-500 hover:bg-orange-50')}
                title={approvalMode === 'auto' ? '自动审批' : approvalMode === 'smart' ? '替我审批' : '手动审批'}>
                {approvalMode === 'auto' ? '自动审批' : approvalMode === 'smart' ? '替我审批' : '手动审批'}
              </button>
              {showApproval && (
                <div className="absolute bottom-full right-0 mb-1 w-52 rounded-md border bg-popover shadow-lg z-50 p-3 text-xs" onMouseDown={(e) => e.stopPropagation()}>
                  <button onMouseDown={() => {}}onClick={() => { onSetApprovalMode?.('auto'); setShowApproval(false) }}
                    className={cn('w-full rounded-md px-3 py-2 text-left hover:bg-accent', approvalMode === 'auto' && 'bg-green-50')}>
                    <div className="font-medium text-green-600">✅ 自动审批</div>
                    <div className="mt-0.5 text-muted-foreground">所有操作自动执行，无需确认</div>
                  </button>
                  <button onMouseDown={() => {}}onClick={() => { onSetApprovalMode?.('smart'); setShowApproval(false) }}
                    className={cn('mt-1 w-full rounded-md px-3 py-2 text-left hover:bg-accent', approvalMode === 'smart' && 'bg-blue-50')}>
                    <div className="font-medium text-blue-600">🤖 替我审批</div>
                    <div className="mt-0.5 text-muted-foreground">安全操作自动通过，其他需确认</div>
                  </button>
                  <button onMouseDown={() => {}}onClick={() => { onSetApprovalMode?.('manual'); setShowApproval(false) }}
                    className={cn('mt-1 w-full rounded-md px-3 py-2 text-left hover:bg-accent', approvalMode === 'manual' && 'bg-orange-50')}>
                    <div className="font-medium text-orange-500">🛡️ 手动审批</div>
                    <div className="mt-0.5 text-muted-foreground">每次工具调用需要手动确认</div>
                  </button>
                </div>
              )}
            </div>

            {/* Expand button */}
            <button onClick={toggleExpand} disabled={isProcessing}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              title={expanded ? '收起' : '展开'}>
              {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>

            {/* Send button */}
            <button onClick={handleSend} disabled={!input.trim() || isProcessing}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                input.trim() && !isProcessing
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground',
                'disabled:opacity-50'
              )}>
              <SendHorizonal className="size-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <button onClick={toggleExpand} className="absolute right-4 top-4 rounded-md p-1 hover:bg-accent">
            <Minimize2 className="size-5" />
          </button>
        )}
      </div>
    )
  }
)
