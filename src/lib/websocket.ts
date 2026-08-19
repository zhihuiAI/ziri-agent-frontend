/**
 * WebSocket client for Electron tool execution.
 * Migrated from frontend-react/src/services/websocket.ts
 */

const WS_BASE_URL = 'ws://111.229.0.159:8009'

type MessageHandler = (data: unknown) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private userId: string | null = null
  private clientId: string | null = null
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private isConnected = false

  connect(userId: string) {
    if (this.ws && this.isConnected) return
    this.userId = userId

    try {
      this.ws = new WebSocket(`${WS_BASE_URL}/ws/client`)
    } catch {
      console.error('[WS] Failed to create WebSocket')
      return
    }

    this.ws.onopen = () => {
      console.log('[WS] Connected')
      this.isConnected = true

      // Register as Electron client (generate a unique client ID)
      this.clientId = `electron_${this.userId}_${Date.now()}`
      this.send({ type: 'register', user_id: this.userId, client_id: this.clientId, client_env: 'electron' })

      // Start heartbeat
      this.pingTimer = setInterval(() => {
        this.send({ type: 'ping' })
      }, 30000)
    }

    this.ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        const type = data.type as string
        // Handle tool execution requests from server
        if (type === 'execute_tool') {
          handleExecuteTool(data)
          return
        }
        this.handlers.get(type)?.forEach((handler) => handler(data))
        this.handlers.get('*')?.forEach((handler) => handler(data))
      } catch {
        // ignore parse errors
      }
    }

  const handleExecuteTool = async (data: any) => {
    const { task_id, tool, args } = data
    console.log('[WS] Execute tool:', tool, args)
    const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
    if (!api) {
      this.send({ type: 'tool_result', task_id, result: { success: false, error: 'No Electron API available' } })
      return
    }
    try {
      let result: any
      switch (tool) {
        case 'run_terminal_command':
          result = await api.runCommand?.(args?.command, args?.cwd)
          break
        case 'list_directory':
          result = await api.listDirectory?.(args?.path)
          break
        case 'read_file':
          result = await api.readFile?.(args?.path)
          break
        case 'write_file':
          result = await api.writeFile?.(args?.path, args?.content)
          break
        case 'delete_file':
          result = await api.deleteFile?.(args?.path)
          break
        case 'create_directory':
          result = await api.createDirectory?.(args?.path)
          break
        case 'copy_file':
          result = await api.copyFile?.(args?.source, args?.dest)
          break
        case 'move_file':
          result = await api.moveFile?.(args?.source, args?.dest)
          break
        case 'get_file_info':
          result = await api.getFileInfo?.(args?.path)
          break
        case 'run_python':
          result = await api.runPython?.(args)
          break
        default:
          result = { success: false, error: `Unknown tool: ${tool}` }
      }
      console.log('[WS] Tool result:', tool, result)
      this.send({ type: 'tool_result', task_id, result })
    } catch (err: any) {
      console.error('[WS] Tool execution error:', err)
      this.send({ type: 'tool_result', task_id, result: { success: false, error: err.message || String(err) } })
    }
  }

    this.ws.onclose = () => {
      console.log('[WS] Disconnected')
      this.isConnected = false
      this.clearPing()
      this.scheduleReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error)
    }
  }

  disconnect() {
    this.clearReconnect()
    this.clearPing()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  send(data: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
  }

  off(type: string, handler: MessageHandler) {
    this.handlers.get(type)?.delete(handler)
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.userId) {
        console.log('[WS] Reconnecting...')
        this.connect(this.userId)
      }
    }, 5000)
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private clearPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }
}

export const wsClient = new WebSocketClient()
