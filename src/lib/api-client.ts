import axios from 'axios'
import { getToken, getUserId } from '@/lib/auth-storage'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  const userId = getUserId()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (userId) {
    config.headers['X-User-Id'] = userId
  }

  return config
})
