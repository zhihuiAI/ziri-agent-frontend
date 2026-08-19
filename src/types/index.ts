export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp?: string
  isFinal?: boolean
  isThinking?: boolean
  toolName?: string
  toolData?: {
    toolName: string
    result: string
    isExpanded?: boolean
  }
}

export interface AssistantDelta {
  type: 'assistant_delta'
  loop: number
  content: string
  accumulated: string
}

export interface ToolResult {
  type: 'tool_result'
  tool: string
  result: unknown
}

export interface DoneEvent {
  type: 'done'
  content: string
  completed: boolean
}

export interface VerificationEvent {
  type: 'final_verification'
  content: string
}

export interface ToolApprovalRequired {
  type: 'tool_approval_required'
  tool: string
  args: Record<string, unknown>
  session_id: string
  call_id: string
}

export type SSEEvent = AssistantDelta | ToolResult | DoneEvent | VerificationEvent | ToolApprovalRequired

export interface Session {
  session_id: string
  name: string
  created_at: string
  updated_at?: string
  last_preview?: string
}

export interface Skill {
  skill_id: string
  name: string
  description: string
  version: string
  tags: string[]
  folder: string
  installed: boolean
  created_at: string
  updated_at: string
}

export interface SkillAssignment {
  user_id: string
  skill_id: string
  assigned_by: string
  assigned_at: string
  expires_at: string | null
}

export interface DynamicMenu {
  menu_id: string
  parent_id: string | null
  menu_name: string
  menu_type: 'group' | 'item'
  path: string | null
  icon: string | null
  sort_order: number
  children: DynamicMenu[]
}

export interface AuthUser {
  userId: string
  userName: string
  userRole: string
}
