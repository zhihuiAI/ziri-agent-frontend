const API_BASE = '/api'

export interface ChannelConfig {
  id: string
  channel_type: 'feishu' | 'wecom' | 'dingtalk' | 'wechat'
  channel_name: string
  app_id: string
  app_secret: string
  encrypt_key?: string
  verification_token?: string
  webhook_url?: string
  skill_ids: string[]
  knowledge_base_ids: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserChannelBinding {
  id: string
  user_id: string
  channel_type: string
  channel_user_id: string
  channel_user_name?: string
  channel_config_id?: string
  is_active: boolean
  bind_time: string
  last_active: string
}

export const channelConfigApi = {
  list: async (channelType?: string): Promise<ChannelConfig[]> => {
    const url = channelType
      ? `${API_BASE}/channels/configs?channel_type=${channelType}`
      : `${API_BASE}/channels/configs`
    const response = await fetch(url)
    return response.json()
  },

  get: async (id: string): Promise<ChannelConfig> => {
    const response = await fetch(`${API_BASE}/channels/configs/${id}`)
    return response.json()
  },

  create: async (data: Partial<ChannelConfig>): Promise<ChannelConfig> => {
    const response = await fetch(`${API_BASE}/channels/configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('创建渠道失败')
    return response.json()
  },

  update: async (id: string, data: Partial<ChannelConfig>): Promise<ChannelConfig> => {
    const response = await fetch(`${API_BASE}/channels/configs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('更新渠道失败')
    return response.json()
  },

  delete: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/channels/configs/${id}`, { method: 'DELETE' })
  },
}

export const channelBindingApi = {
  list: async (userId?: string, channelType?: string): Promise<UserChannelBinding[]> => {
    const params = new URLSearchParams()
    if (userId) params.append('user_id', userId)
    if (channelType) params.append('channel_type', channelType)
    const url = `${API_BASE}/channels/bindings${params.toString() ? '?' + params : ''}`
    const response = await fetch(url)
    return response.json()
  },

  create: async (data: Record<string, unknown>): Promise<UserChannelBinding> => {
    const response = await fetch(`${API_BASE}/channels/bindings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('创建绑定失败')
    return response.json()
  },

  delete: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/channels/bindings/${id}`, { method: 'DELETE' })
  },
}

export const CHANNEL_TYPES = [
  { value: 'feishu', label: '飞书', description: '飞书企业自建应用' },
  { value: 'wecom', label: '企业微信', description: '企业微信自建应用' },
  { value: 'dingtalk', label: '钉钉', description: '钉钉企业自建应用' },
  { value: 'wechat', label: '微信', description: '微信公众号/服务号' },
]
