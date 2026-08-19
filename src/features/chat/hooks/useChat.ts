'use client'

import { useState, useCallback, useRef } from 'react'
import { streamChat } from '../services/chat'
import type { Message, SSEEvent } from '@/types'

const API_DIRECT = 'http://111.229.0.159:8009'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const currentAssistantContent = useRef('')
  const currentLoop = useRef(-1)
  const currentTurnId = useRef('')
  const onApprovalRef = useRef<((tool: string, args: Record<string, unknown>, sessionId: string) => Promise<{ approved: boolean; rejectReason?: string }>) | null>(null)

  const setApprovalHandler = useCallback(
    (handler: (tool: string, args: Record<string, unknown>, sessionId: string) => Promise<{ approved: boolean; rejectReason?: string }>) => {
      onApprovalRef.current = handler
    }, [])

  const sendMessage = useCallback(
    async (query: string, sessionId: string, selectedSkillIds?: string[], requireApproval = false, workDir?: string, approvalMode = 'auto') => {
      if (!query.trim() || isProcessing) return

      setMessages((prev) => [...prev, { role: 'user', content: query }])
      setIsProcessing(true)
      currentAssistantContent.current = ''
      currentLoop.current = -1
      currentTurnId.current = `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

      await streamChat(query, sessionId,
        async (event: SSEEvent) => {
          if (event.type === 'assistant_delta') {
            const loop = event.loop ?? 0
            if (loop !== currentLoop.current) {
              setMessages((prev) => { const last = prev[prev.length - 1]; if (last?.role === 'assistant' && !last.isFinal) { const u = [...prev]; u[u.length - 1] = { ...last, isThinking: true }; return u }; return prev })
              currentLoop.current = loop; currentAssistantContent.current = ''
              setMessages((prev) => [...prev, { role: 'assistant', content: '', isThinking: true }])
            }
            currentAssistantContent.current += event.content
            setMessages((prev) => { const n = [...prev]; const li = n.length - 1; if (n[li]?.role === 'assistant') n[li] = { ...n[li], content: currentAssistantContent.current }; return n })
          } else if (event.type === 'tool_approval_required') {
            setMessages((prev) => [...prev, { role: 'tool', content: `等待审批: ${event.tool}`, toolName: event.tool, toolData: { toolName: event.tool, result: JSON.stringify(event.args, null, 2), isExpanded: false }, isThinking: true }])
            if (onApprovalRef.current) {
              const decision = await onApprovalRef.current(event.tool, event.args, event.session_id)
              await fetch(`${API_DIRECT}/api/agent/approve-tool`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: '', session_id: event.session_id, tool_name: event.tool, tool_args: event.args, approved: decision.approved, reject_reason: decision.rejectReason || '' }),
              })
              setMessages((prev) => [...prev, { role: 'tool', content: decision.approved ? `已批准: ${event.tool}` : `已拒绝: ${event.tool}${decision.rejectReason ? ' - ' + decision.rejectReason : ''}`, toolName: event.tool, isThinking: true }])
            }
          } else if (event.type === 'tool_result') {
            const toolName = event.tool || 'unknown'; let resultText = ''; const r = event.result as any
            if (r && typeof r === 'object') {
              if (r.stdout !== undefined) { resultText = `${r.command || ''}\n${r.stdout || ''}`; if (r.stderr) resultText += `\n${r.stderr}` }
              else if (r.entries !== undefined) { resultText = `${r.path}\n`; (r.entries as any[]).forEach((e: any) => { resultText += `${e.type === 'directory' ? 'D' : 'F'} ${e.name}\n` }) }
              else if (r.error) resultText = `Error: ${r.error}`
              else if (r.skipped) resultText = `${r.reason || 'Rejected'}`
              else resultText = JSON.stringify(r, null, 2)
            } else resultText = String(r)
            setMessages((prev) => [...prev, { role: 'tool', content: `${toolName}`, toolName, toolData: { toolName, result: resultText, isExpanded: false }, isThinking: true }])
          } else if (event.type === 'final_verification') {
            if (event.content && !event.content.startsWith('DONE:')) setMessages((prev) => [...prev, { role: 'assistant', content: `${event.content}`, isThinking: true }])
          } else if (event.type === 'done') {
            setMessages((prev) => { const u = [...prev]; for (let i = u.length - 1; i >= 0; i--) { if (u[i].role === 'assistant') { u[i] = { ...u[i], isFinal: true, isThinking: false }; break } }; return u })
          }
        },
        (error) => { console.error(error); setIsProcessing(false) },
        () => {
          setIsProcessing(false)
          setMessages((prev) => { const u = [...prev]; for (let i = u.length - 1; i >= 0; i--) { if (u[i].role === 'assistant' && !u[i].isFinal) { u[i] = { ...u[i], isFinal: true, isThinking: false }; break } }; return u })
        },
        selectedSkillIds, requireApproval, workDir, approvalMode)
    }, [isProcessing])

  const setHistory = useCallback((hm: Message[]) => { setMessages(hm) }, [])
  const clearMessages = useCallback(() => { setMessages([]); currentAssistantContent.current = ''; currentLoop.current = -1 }, [])

  return { messages, isProcessing, sendMessage, setHistory, clearMessages, setApprovalHandler }
}
