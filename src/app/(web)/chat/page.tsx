'use client'

import { useEffect, useRef, useCallback, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useChat } from '@/features/chat/hooks/useChat'
import { ChatInput, type ChatInputHandle } from '@/features/chat/components/ChatInput'
import { MessageBubble, ThinkingProcess } from '@/features/chat/components/MessageBubble'
import { useChatStore } from '@/stores/chat-store'
import { getSessions, createSession, getHistory } from '@/features/chat/services/chat'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2, X, Check, ChevronDown, ChevronRight, FolderOpen, FileText, Mail, Compass } from 'lucide-react'
import { toast } from 'sonner'
import { wsClient } from '@/lib/websocket'

import type { Message } from '@/types'

interface Skill { skill_id: string; name: string; description: string; version: string; tags: string[] }
interface SelectedItem { type: 'skill'; id: string; name: string }

const API_BASE = 'http://111.229.0.159:8009'

// ─── Helpers ────────────────────────────────────────────────────
const TODO_RE = /<todo>([\s\S]*?)<\/todo>/gi
const TASK_RE = /^\s*[-*+]\s+\[([ x])\]\s*(.+)$/

function extractTodo(content: string) { const m = content.match(/<todo>([\s\S]*?)<\/todo>/i); return m ? m[1].trim() : null }
function stripTodo(content: string) { return content.replace(TODO_RE, '').replace(/\n{3,}/g, '\n\n').trim() }
function parseItems(todo: string) { return todo.split('\n').map(l => { const m = l.match(TASK_RE); return m ? { text: m[2].trim(), checked: m[1] === 'x' } : null }).filter(Boolean) as { text: string; checked: boolean }[] }

// ─── CollapsibleTodo ───────────────────────────────────────────
function CollapsibleTodo({ items }: { items: { text: string; checked: boolean }[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-lg border border-primary/20 ml-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 bg-primary/5 px-3 py-1.5 text-left text-xs font-medium text-primary hover:bg-primary/10">
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        📋 任务计划 ({items.filter(i => i.checked).length}/{items.length})
      </button>
      {open && (
        <ul className="list-none space-y-1 px-4 py-1.5">
          {items.map((item, idx) => (
            <li key={idx} className={`text-sm ${item.checked ? 'line-through text-muted-foreground/60' : ''}`}>
              - [{item.checked ? 'x' : ' '}] {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── StatusIndicator ────────────────────────────────────────────
function StatusIndicator() {
  const [idx, setIdx] = useState(0)
  const messages = ['AI 正在处理，请稍候...', '正在分析问题...', '正在执行操作...', '正在整理回复...', '处理中，请耐心等待...', '工具执行中...', '生成内容中...', '即将完成...']
  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % messages.length), 3000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      <span>{messages[idx]}</span>
    </div>
  )
}

// ─── MessageList ────────────────────────────────────────────────
function MessageList({ messages, isProcessing, currentSessionId, userId }: {
  messages: Message[]; isProcessing: boolean; currentSessionId: string; userId: string | null
}) {
  // Collect all <todo> occurrences — keep only status from latest
  let baseItems: { text: string; checked: boolean }[] | null = null
  const todoIndices: number[] = []
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'assistant') {
      const t = extractTodo(messages[i].content)
      if (t) {
        todoIndices.push(i)
        const items = parseItems(t)
        if (!baseItems) {
          baseItems = items // first occurrence defines the base
        } else if (items.length === baseItems.length) {
          // Merge latest checked status into base
          baseItems = baseItems.map((bi, idx) => ({ text: bi.text, checked: items[idx]?.checked ?? bi.checked }))
        }
      }
    }
  }
  const allTodoIndices = new Set(todoIndices)
  const firstTodoIdx = todoIndices[0] ?? -1

  // Build merged, collapsible TODO panel
  const TodoPanel = baseItems ? (
    <CollapsibleTodo key="merged-todo" items={baseItems} />
  ) : null

  // Find last final assistant index
  let lastFinalIdx = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant' && messages[i].isFinal) { lastFinalIdx = i; break }
  }

  const rows: React.ReactNode[] = []
  let i = 0

  while (i < messages.length) {
    const msg = messages[i]

    if (msg.role === 'user') {
      rows.push(<MessageBubble key={`u-${i}`} message={msg} />)
      const thinkStart = i + 1
      const thinkMsgs: Message[] = []
      for (let j = thinkStart; j < messages.length; j++) {
        if (j === lastFinalIdx) break
        if (messages[j].role === 'user') break
        let tm = messages[j]
        if (tm.role === 'assistant' && allTodoIndices.has(j)) {
          // Strip <todo> tag from all messages — TODO panel shown separately
          tm = { ...tm, content: stripTodo(tm.content) }
        }
        thinkMsgs.push(tm)
      }
      if (thinkMsgs.length > 0) {
        // Insert merged TODO panel at first occurrence position within thinking section
        const children: React.ReactNode[] = []
        let todoInserted = false
        thinkMsgs.forEach((m, mi) => {
          const origIdx = thinkStart + mi
          if (!todoInserted && TodoPanel && origIdx >= firstTodoIdx) {
            children.push(TodoPanel)
            todoInserted = true
          }
          children.push(<MessageBubble key={`ti-${i}-${mi}`} message={m} />)
        })
        if (!todoInserted && TodoPanel) children.push(TodoPanel)

        rows.push(
          <ThinkingProcess key={`think-${i}-${isProcessing}`} defaultOpen={isProcessing} label={isProcessing ? '思考中...' : '思考过程'}>
            {children}
          </ThinkingProcess>
        )
        i = thinkStart + thinkMsgs.length - 1
      }
    } else if (msg.role === 'assistant' && msg.isFinal && i === lastFinalIdx) {
      let displayMsg = msg
      if (allTodoIndices.has(i)) displayMsg = { ...msg, content: stripTodo(msg.content) }
      rows.push(
        <MessageBubble key={`final-${i}`} message={displayMsg} sessionId={currentSessionId} userId={userId} />
      )
    } else if (msg.role === 'tool' && i === 0) {
      rows.push(<MessageBubble key={`t-${i}`} message={msg} />)
    }
    i++
  }

  if (isProcessing && messages.length > 0) {
    rows.push(<StatusIndicator key="status" />)
  }

  return <>{rows}</>
}

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { messages, isProcessing, sendMessage, setHistory, clearMessages, setApprovalHandler } = useChat()
  const [approvalMode, setApprovalMode] = useState<'auto' | 'manual' | 'smart'>('smart')
  const [chatMode, setChatMode] = useState('plan')
  const [pendingApproval, setPendingApproval] = useState<{ tool: string; args: Record<string, unknown>; sessionId: string; resolve: (v: { approved: boolean; rejectReason?: string }) => void } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const { sessions, currentSessionId, setSessions, setCurrentSessionId, setIsLoadingSessions } = useChatStore()
  const userId = useAuthStore((s) => s.userId)
  const isElectronEnv = typeof window !== 'undefined' ? !!(window as any).electronAPI : false
  // Restore saved workDir from localStorage, or default
  const [workDir, setWorkDir] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('work_dir')
      if (saved) return saved
    }
    return ''
  })
  // For web users, set server default
  useEffect(() => {
    if (!workDir && userId && !isElectronEnv) {
      setWorkDir(`/tmp/ai/user/${userId}`)
    }
  }, [userId, workDir, isElectronEnv])
  // Persist workDir to localStorage on change
  const updateWorkDir = (path: string) => {
    setWorkDir(path)
    if (typeof window !== 'undefined') localStorage.setItem('work_dir', path)
  }
  // Connect WebSocket when in Electron with a logged-in user
  useEffect(() => {
    if (isElectronEnv && userId) {
      console.log('[Chat] Connecting WebSocket for Electron, user:', userId)
      wsClient.connect(userId)
    }
    return () => { wsClient.disconnect() }
  }, [userId, isElectronEnv])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const loadedSessionRef = useRef<string>('')
  const popupRef = useRef<HTMLDivElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)

  const [userSkills, setUserSkills] = useState<Skill[]>([])
  const initialSkillId = searchParams.get('selected_skill_id')
  const initialSkillName = searchParams.get('selected_skill_name')
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(() => {
    if (initialSkillId && initialSkillName) return [{ type: 'skill', id: initialSkillId, name: initialSkillName }]
    return []
  })
  const [showSkillPopup, setShowSkillPopup] = useState(false)
  const [popupSearch, setPopupSearch] = useState('')
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set())
  const [selectedModel, setSelectedModel] = useState('本地大模型')
  const models = ['本地大模型', 'deepseek-v4-pro', 'gpt-4o', 'gpt-4o-mini', 'claude-sonnet-5', 'claude-opus-4-8']

  // Upload state
  interface UploadedFile { local_path: string; file_type: string; original_name: string; storage_location: string }
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  // Approval handler: when tool_approval_required event arrives, pause stream until user decides
  useEffect(() => {
    setApprovalHandler(async (tool, args, sessionId) => {
      return new Promise<{ approved: boolean; rejectReason?: string }>((resolve) => {
        setRejectReason('')
        setPendingApproval({ tool, args, sessionId, resolve })
      })
    })
  }, [setApprovalHandler])

  // Load user skills
  useEffect(() => {
    if (!userId) return
    fetch(`${API_BASE}/api/skills/user/${userId}`).then((r) => r.json()).then((d) => setUserSkills(d.skills || [])).catch(() => {})
  }, [userId])

  // Handle initial skill from URL
  useEffect(() => {
    if (initialSkillId && initialSkillName) {
      const exists = selectedItems.some((it) => it.id === initialSkillId)
      if (!exists) setSelectedItems((prev) => [...prev, { type: 'skill', id: initialSkillId, name: initialSkillName }])
    }
  }, [initialSkillId, initialSkillName])

  // Reset on new chat
  useEffect(() => {
    const urlSid = searchParams.get('session')
    if (!urlSid && !currentSessionId) { clearMessages(); loadedSessionRef.current = '' }
  }, [searchParams, currentSessionId, clearMessages])

  // Click outside popup/menu
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) { setShowSkillPopup(false); setTempSelectedIds(new Set()) }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Auto scroll
  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [])
  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Load sessions
  useEffect(() => {
    if (!userId) return
    setIsLoadingSessions(true)
    getSessions().then((data) => { setSessions(data) }).catch(() => {}).finally(() => setIsLoadingSessions(false))
  }, [userId])

  // Load history
  useEffect(() => {
    const sid = searchParams.get('session') || currentSessionId
    if (sid && sid !== loadedSessionRef.current) {
      loadedSessionRef.current = sid; setCurrentSessionId(sid); clearMessages()
      getHistory(sid).then((msgs) => {
          if (msgs.length > 0) {
            // Mark all history assistant messages as final
            const marked = msgs.map((m: Message) => m.role === 'assistant' ? { ...m, isFinal: true } : m)
            setHistory(marked)
          }
        }).catch(() => {})
    }
  }, [searchParams, currentSessionId])

  const handleSend = async (query: string) => {
    let sid = currentSessionId
    if (!sid) {
      try {
        const s = await createSession(); sid = s.session_id; setCurrentSessionId(sid); loadedSessionRef.current = sid
        const data = await getSessions(); setSessions(data)
        router.replace(`/chat?session=${sid}`)
      } catch { return }
    }
    let fullQuery = query
    if (chatMode === 'plan') {
      fullQuery = `先制定TODO计划，规划好后再进行：${fullQuery}`
    }
    if (selectedItems.length > 0) {
      const names = selectedItems.map((s) => s.name).join('、')
      fullQuery = fullQuery ? `[已选择技能: ${names}]\n${fullQuery}` : `[已选择技能: ${names}]`
    }
    if (uploadedFiles.length > 0) {
      const fileList = uploadedFiles.map((f) => `[${f.original_name}](${f.local_path})`).join(', ')
      fullQuery = fullQuery ? `${fullQuery}\n\n📎 附件: ${fileList}` : `📎 附件: ${fileList}`
    }
    setUploadedFiles([])
    await sendMessage(fullQuery, sid, selectedItems.filter((s) => s.type === 'skill').map((s) => s.id), approvalMode !== 'auto', workDir, approvalMode)
  }

  // Upload files to backend, show progress
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const fd = new FormData()
    for (let i = 0; i < files.length; i++) fd.append('files', files[i])
    if (userId) fd.append('user_id', userId)
    try {
      const res = await fetch(`${API_BASE}/api/upload/files`, { method: 'POST', body: fd })
      const result = await res.json()
      if (result.success) {
        const newFiles = result.files.filter((f: any) => f.success).map((f: any) => ({
          local_path: f.local_path, file_type: f.file_type, original_name: f.original_name, storage_location: f.storage_location,
        }))
        setUploadedFiles((prev) => [...prev, ...newFiles])
        toast.success(`成功上传 ${newFiles.length} 个文件`)
      } else {
        toast.error(`上传失败: ${result.error || ''}`)
      }
    } catch { toast.error('上传失败') }
    finally { setUploading(false) }
  }

  // Open skill popup — bottom aligned to input area top border
  const openSkillPopup = () => {
    const el = inputContainerRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      const popupH = 400
      // Popup bottom = input container top (no gap)
      let top = rect.top - popupH
      if (top < 8) top = rect.bottom + 4  // fallback: show below if no room above
      if (top + popupH > window.innerHeight - 8) top = window.innerHeight - popupH - 8
      setPopupPos({ x: rect.left, y: Math.max(8, top) })
    }
    setShowSkillPopup(true)
    setPopupSearch('')
    setTempSelectedIds(new Set(selectedItems.map((s) => s.id)))
  }

  // @ trigger handler
  const handleAtTrigger = () => {
    console.log('[ChatPage] handleAtTrigger called, skills:', userSkills.length)
    openSkillPopup()
  }

  const toggleTemp = (id: string) => { setTempSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n }) }
  const confirmSelection = () => {
    const items: SelectedItem[] = []; tempSelectedIds.forEach((id) => { const sk = userSkills.find((s) => s.skill_id === id); if (sk) items.push({ type: 'skill', id: sk.skill_id, name: sk.name }) })
    setSelectedItems(items); setShowSkillPopup(false); setTempSelectedIds(new Set())
    // Remove the @ from input after selecting skills
    chatInputRef.current?.removeTrailingAt()
  }
  const removeItem = (id: string) => setSelectedItems((prev) => prev.filter((i) => i.id !== id))

  const filteredSkills = userSkills.filter((s) => !popupSearch || s.name.toLowerCase().includes(popupSearch.toLowerCase()))
  const showWelcome = messages.length === 0 && !isProcessing

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {showWelcome ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-2xl text-center px-4">
              <h2 className="text-2xl font-bold">🍃 企业智能助手</h2>
              <p className="mt-2 text-sm text-muted-foreground">有什么我可以帮助你的吗？</p>
              <div className="mt-6 grid grid-cols-4 gap-3">
                <button onClick={() => {
                  setSelectedItems([])
                  chatInputRef.current?.setInputText('请帮我将本地目录文件分类整理')
                }} className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors">
                  <FolderOpen className="size-5 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium">本地文件整理</div>
                    <div className="text-xs text-muted-foreground mt-0.5">分类整理本地目录文件</div>
                  </div>
                </button>
                <button onClick={() => {
                  setSelectedItems([{ type: 'skill', id: 'PPTX', name: 'PPTX' }])
                  chatInputRef.current?.setInputText('请帮我制作汇报材料')
                }} className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors">
                  <FileText className="size-5 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium">汇报材料制作</div>
                    <div className="text-xs text-muted-foreground mt-0.5">自动生成汇报PPT</div>
                  </div>
                </button>
                <button onClick={() => {
                  setSelectedItems([{ type: 'skill', id: 'email-assistant', name: 'email-assistant' }])
                  chatInputRef.current?.setInputText('请帮我总结本周邮件')
                }} className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors">
                  <Mail className="size-5 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">邮件内容总结</div>
                    <div className="text-xs text-muted-foreground mt-0.5">自动总结邮件内容</div>
                  </div>
                </button>
                <button onClick={() => {
                  setSelectedItems([])
                  openSkillPopup()
                }} className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors">
                  <Compass className="size-5 text-purple-500" />
                  <div>
                    <div className="text-sm font-medium">探索更多功能</div>
                    <div className="text-xs text-muted-foreground mt-0.5">使用技能解决更多问题</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isProcessing={isProcessing} currentSessionId={currentSessionId} userId={userId} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-card" ref={inputContainerRef}>
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3">
            {selectedItems.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                🔧 {item.name}
                <button onClick={() => removeItem(item.id)} className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"><X className="size-3" /></button>
              </span>
            ))}
            {selectedItems.length > 1 && (
              <button onClick={() => setSelectedItems([])} className="text-xs text-muted-foreground hover:text-foreground ml-1">清空</button>
            )}
          </div>
        )}

        {/* Uploaded file tags */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-1">
            <span className="text-xs text-muted-foreground">📎 已上传 {uploadedFiles.length} 个文件</span>
            {uploadedFiles.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                {f.original_name}
                <button onClick={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-0.5 hover:text-red-500"><X className="size-3" /></button>
              </span>
            ))}
            <button onClick={() => setUploadedFiles([])} className="text-xs text-muted-foreground hover:text-foreground">清空</button>
          </div>
        )}

        {/* Uploading indicator */}
        {uploading && (
          <div className="flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> 正在上传文件...
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          <input id="file-upload-input" type="file" multiple className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png,.gif,.mp3,.wav"
            onChange={(e) => { const fs = e.target.files; if (fs && fs.length) handleFileUpload(fs); if (e.target) e.target.value = '' }} />

          <ChatInput ref={chatInputRef} onSend={handleSend} isProcessing={isProcessing || uploading}
            selectedSkillCount={selectedItems.length} onAtTrigger={handleAtTrigger}
            onFileUpload={() => document.getElementById('file-upload-input')?.click()}
            onSkillSelect={openSkillPopup}
            models={models} selectedModel={selectedModel} onSelectModel={setSelectedModel}
            approvalMode={approvalMode} onSetApprovalMode={setApprovalMode}
            selectedMode={chatMode} onSelectMode={setChatMode}
            workDir={workDir} isElectron={isElectronEnv}
            onSelectWorkDir={async () => {
              const api = (window as any).electronAPI
              if (api?.selectDirectory) {
                const result = await api.selectDirectory()
                if (result.success && result.path) updateWorkDir(result.path)
              }
            }} />
        </div>
      </div>

      {/* Pending approval dialog */}
      {pendingApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl mx-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⏳</span>
              <div>
                <h3 className="font-semibold">工具执行审批</h3>
                <p className="text-xs text-muted-foreground">手动审批模式 — 请确认是否执行此工具</p>
              </div>
            </div>
            <div className="rounded-md bg-muted/50 p-3 mb-4">
              <p className="text-sm font-medium">🔧 {pendingApproval.tool}</p>
              <pre className="mt-2 max-h-32 overflow-auto text-xs text-muted-foreground">{JSON.stringify(pendingApproval.args, null, 2)}</pre>
            </div>
            {/* Rejection reason input */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground">拒绝原因（可选，将返回给AI）</label>
              <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="输入拒绝原因或自定义话术..."
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { pendingApproval.resolve({ approved: false, rejectReason: rejectReason || undefined }); setPendingApproval(null); setRejectReason('') }}
                className="rounded-md border px-4 py-2 text-sm hover:bg-accent">❌ 拒绝执行</button>
              <button onClick={() => { pendingApproval.resolve({ approved: true }); setPendingApproval(null); setRejectReason('') }}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">✅ 批准执行</button>
            </div>
          </div>
        </div>
      )}

      {/* Skill popup — dynamically positioned relative to input area */}
      {showSkillPopup && (
        <div ref={popupRef} className="fixed z-50 w-80 rounded-lg border bg-popover shadow-xl"
          style={{ left: `${popupPos.x}px`, top: `${popupPos.y}px` }}>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">选择技能（可多选）</span>
            <button onClick={() => { setShowSkillPopup(false); setTempSelectedIds(new Set()) }} className="rounded p-1 hover:bg-accent"><X className="size-4" /></button>
          </div>
          <div className="px-3 py-2">
            <input type="text" placeholder="搜索技能..." value={popupSearch} onChange={(e) => setPopupSearch(e.target.value)}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="max-h-60 overflow-y-auto px-1">
            {filteredSkills.length === 0
              ? <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                  {userSkills.length === 0 ? '技能加载中，请稍后...' : popupSearch ? '未找到匹配项' : '暂无可用技能'}
                </p>
            : filteredSkills.map((sk) => { const checked = tempSelectedIds.has(sk.skill_id)
              return (
                <button key={sk.skill_id} onClick={() => toggleTemp(sk.skill_id)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent ${checked ? 'bg-primary/5' : ''}`}>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                    {checked && <Check className="size-3" />}
                  </span>
                  <span className="text-left">🔧 {sk.name}</span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <button onClick={() => { setShowSkillPopup(false); setTempSelectedIds(new Set()) }} className="text-sm text-muted-foreground hover:text-foreground">取消</button>
            <button onClick={confirmSelection} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">确定（已选 {tempSelectedIds.size} 个）</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  return <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}><ChatContent /></Suspense>
}
