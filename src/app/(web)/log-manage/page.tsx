'use client'

import { useState, useEffect } from 'react'

interface SessionItem { user_id: string; session_id: string; first_message_time: string; last_message_time: string; message_count: number; user_messages_count: number; turn_count: number }
interface TurnItem { turn_id: string; user_message: { content?: string }; timestamp: string; tool_calls_count: number; final_answer_preview: string; total_duration_ms: number }
interface TimelineItem { type: 'tool_call' | 'tool_result' | 'assistant'; loop: number; tool_name?: string; arguments?: Record<string,unknown>; result?: Record<string,unknown>; content?: string; is_final?: boolean; duration_ms?: number; success?: boolean; error?: string; timestamp: string }
interface TurnDetail { turn_id: string; user_id: string; session_id: string; user_message: { content?: string }; timeline: TimelineItem[]; tool_calls_count: number; total_duration_ms: number; final_answer: string }

const API_BASE = 'http://111.229.0.159:8009'

function fmtTime(s: string) { if (!s) return '-'; try { return new Date(s).toLocaleString('zh-CN') } catch { return s } }
function fmtDur(ms: number) { if (!ms) return '-'; return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(2)}s` }

export default function LogManagePage() {
  const currentUserRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') || 'user' : 'user'
  const isAdmin = currentUserRole === 'admin'
  const [filterUserId, setFilterUserId] = useState(''); const [startTime, setStartTime] = useState(''); const [endTime, setEndTime] = useState(''); const [keyword, setKeyword] = useState('')
  const [sessions, setSessions] = useState<SessionItem[]>([]); const [loading, setLoading] = useState(false); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const pageSize = 20
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null); const [turns, setTurns] = useState<TurnItem[]>([]); const [selectedTurn, setSelectedTurn] = useState<TurnItem | null>(null)
  const [turnDetail, setTurnDetail] = useState<TurnDetail | null>(null); const [detailLoading, setDetailLoading] = useState(false); const [userList, setUserList] = useState<string[]>([])

  useEffect(() => { fetch(`${API_BASE}/api/logs/users`).then((r) => r.json()).then((d) => setUserList(d.users || [])).catch(() => {}) }, [])
  const loadSessions = async () => { setLoading(true); try { const res = await fetch(`${API_BASE}/api/logs/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: filterUserId || undefined, start_time: startTime || undefined, end_time: endTime || undefined, limit: pageSize, offset: (page - 1) * pageSize }) }); const data = await res.json(); setSessions(data.items || []); setTotal(data.total || 0) } catch { /* */ } finally { setLoading(false) } }
  useEffect(() => { loadSessions() }, [page])
  const handleSearch = () => { setPage(1); loadSessions() }
  const handleReset = () => { setFilterUserId(''); setStartTime(''); setEndTime(''); setKeyword(''); setPage(1); loadSessions() }
  const loadTurns = async (session: SessionItem) => { setSelectedSession(session); setSelectedTurn(null); setTurnDetail(null); try { const res = await fetch(`${API_BASE}/api/logs/sessions/${session.user_id}/${session.session_id}/turns`); const data = await res.json(); setTurns(data.turns || []) } catch { setTurns([]) } }
  const loadTurnDetail = async (turn: TurnItem) => { if (!selectedSession) return; setSelectedTurn(turn); setDetailLoading(true); try { const res = await fetch(`${API_BASE}/api/logs/turns/${selectedSession.user_id}/${selectedSession.session_id}/${turn.turn_id}`); setTurnDetail(await res.json()) } catch { /* */ } finally { setDetailLoading(false) } }

  if (!isAdmin) return <div className="flex h-full items-center justify-center"><div className="text-center"><h2 className="text-xl font-bold">权限不足</h2><p className="text-muted-foreground">只有管理员可以访问会话管理页面</p></div></div>

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-card px-4 py-3 space-y-2"><div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1"><label className="text-xs text-muted-foreground">用户ID</label><select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="">全部用户</option>{userList.map((uid) => <option key={uid} value={uid}>{uid}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label className="text-xs text-muted-foreground">开始时间</label><input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" /></div>
        <div className="flex flex-col gap-1"><label className="text-xs text-muted-foreground">结束时间</label><input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" /></div>
        <div className="flex flex-col gap-1"><label className="text-xs text-muted-foreground">关键词</label><input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索消息内容..." className="h-9 w-40 rounded-md border bg-background px-2 text-sm" /></div>
        <div className="flex gap-2 pb-px"><button onClick={handleSearch} className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">搜索</button><button onClick={handleReset} className="rounded-md border px-4 py-1.5 text-sm hover:bg-accent">重置</button></div>
      </div></div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 shrink-0 border-r flex flex-col"><div className="shrink-0 px-4 py-3 border-b"><h3 className="text-sm font-semibold">会话列表</h3><span className="text-xs text-muted-foreground">共 {total} 个会话</span></div><div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-4 text-center text-sm text-muted-foreground">加载中...</div> : sessions.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">暂无会话记录</div> : sessions.map((s) => (
            <button key={`${s.user_id}_${s.session_id}`} onClick={() => loadTurns(s)} className={`w-full border-b px-4 py-3 text-left hover:bg-accent transition-colors ${selectedSession?.session_id === s.session_id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
              <div className="flex items-center justify-between"><span className="text-sm font-medium truncate">👤 {s.user_id}</span><span className="text-xs text-muted-foreground">{fmtTime(s.last_message_time)}</span></div>
              <div className="mt-1 flex gap-2 text-xs text-muted-foreground"><span>💬 {s.message_count}</span><span>🔄 {s.turn_count}</span></div>
            </button>
          ))}
        </div>{total > pageSize && (<div className="shrink-0 flex items-center justify-center gap-2 border-t px-2 py-2"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50">上一页</button><span className="text-xs text-muted-foreground">{page} / {Math.ceil(total / pageSize)}</span><button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => p + 1)} className="rounded border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50">下一页</button></div>)}</div>
        <div className="w-72 shrink-0 border-r flex flex-col"><div className="shrink-0 px-4 py-3 border-b"><h3 className="text-sm font-semibold">对话轮次</h3>{selectedSession && <span className="text-xs text-muted-foreground">会话: {selectedSession.session_id?.slice(-12)}</span>}</div><div className="flex-1 overflow-y-auto">
          {!selectedSession ? <div className="p-4 text-center text-sm text-muted-foreground">请先从左侧选择一个会话</div> : turns.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">暂无对话记录</div> : turns.map((turn) => (
            <button key={turn.turn_id} onClick={() => loadTurnDetail(turn)} className={`w-full border-b px-4 py-3 text-left hover:bg-accent transition-colors ${selectedTurn?.turn_id === turn.turn_id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
              <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{fmtTime(turn.timestamp)}</span><span className="flex gap-1 text-xs text-muted-foreground"><span>🔧{turn.tool_calls_count}</span><span>⏱️{fmtDur(turn.total_duration_ms)}</span></span></div>
              <p className="mt-1 text-xs line-clamp-2">{turn.user_message?.content?.substring(0, 80) || '(无内容)'}</p>
              {turn.final_answer_preview && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">💡{turn.final_answer_preview}</p>}
            </button>
          ))}
        </div></div>
        <div className="flex-1 flex flex-col overflow-hidden"><div className="shrink-0 px-4 py-3 border-b"><h3 className="text-sm font-semibold">对话详情</h3></div><div className="flex-1 overflow-y-auto p-4">
          {!selectedTurn ? <div className="text-center text-sm text-muted-foreground py-8">请从中间选择一个对话轮次</div> : detailLoading ? <div className="text-center text-sm text-muted-foreground py-8">加载详情中...</div> : turnDetail ? (<div className="space-y-4">
            <div className="rounded-lg border p-3"><div className="mb-2 text-sm font-medium">👤 用户问题</div><div className="text-sm whitespace-pre-wrap">{turnDetail.user_message?.content || '(无内容)'}</div></div>
            <div className="rounded-lg border p-3"><div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium">⏱️ 执行时间线</span><span className="text-xs text-muted-foreground">共 {turnDetail.tool_calls_count} 次工具调用 | 总耗时 {fmtDur(turnDetail.total_duration_ms)}</span></div><div className="space-y-3">
              {turnDetail.timeline.map((item, idx) => (<div key={idx} className={`rounded-md border p-3 ${item.type === 'tool_call' ? 'bg-blue-50/50' : item.type === 'tool_result' ? 'bg-green-50/50' : 'bg-purple-50/50'}`}>
                <div className="flex items-center gap-2 mb-1"><span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted">{item.type === 'tool_call' ? '🔧 工具调用' : item.type === 'tool_result' ? '📊 工具结果' : item.is_final ? '✅ 最终回复' : '🤖 中间回复'}</span><span className="text-xs text-muted-foreground">Loop {item.loop}</span></div>
                {item.type === 'tool_call' && <div className="text-xs"><span className="text-muted-foreground">工具: </span><code className="rounded bg-muted px-1 py-0.5">{item.tool_name}</code></div>}
                {item.type === 'tool_result' && <div className="text-xs space-y-1"><div><span className="text-muted-foreground">工具: </span><code className="rounded bg-muted px-1 py-0.5">{item.tool_name}</code></div><div>结果: <span className={`font-medium ${item.success ? 'text-green-600' : 'text-red-600'}`}>{item.success ? '✅ 成功' : '❌ 失败'}</span>{item.duration_ms && <span> 耗时 {fmtDur(item.duration_ms)}</span>}</div>{item.error && <div className="text-red-500">错误: {item.error}</div>}</div>}
                {item.type === 'assistant' && <div className="text-xs whitespace-pre-wrap">{item.content || '(无内容)'}</div>}
              </div>))}
            </div></div>
            {turnDetail.final_answer && <div className="rounded-lg border p-3"><div className="mb-2 text-sm font-medium">✅ 最终答案</div><div className="text-sm whitespace-pre-wrap">{turnDetail.final_answer}</div></div>}
          </div>) : <div className="text-center text-sm text-muted-foreground py-8">加载失败</div>}
        </div></div>
      </div>
    </div>
  )
}
