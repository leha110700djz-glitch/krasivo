import axios, { AxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_BASE = `${API_URL}/api/v1`

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

function authHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = {
  get: async <T>(path: string, token?: string, params?: Record<string, unknown>): Promise<T> => {
    const config: AxiosRequestConfig = {
      headers: authHeader(token),
      params,
    }
    const response = await client.get<T>(path, config)
    return response.data
  },

  post: async <T>(path: string, body: unknown, token?: string): Promise<T> => {
    const config: AxiosRequestConfig = {
      headers: authHeader(token),
    }
    const response = await client.post<T>(path, body, config)
    return response.data
  },

  put: async <T>(path: string, body: unknown, token?: string): Promise<T> => {
    const config: AxiosRequestConfig = {
      headers: authHeader(token),
    }
    const response = await client.put<T>(path, body, config)
    return response.data
  },

  patch: async <T>(path: string, body: unknown, token?: string): Promise<T> => {
    const config: AxiosRequestConfig = {
      headers: authHeader(token),
    }
    const response = await client.patch<T>(path, body, config)
    return response.data
  },

  delete: async <T>(path: string, token?: string): Promise<T> => {
    const config: AxiosRequestConfig = {
      headers: authHeader(token),
    }
    const response = await client.delete<T>(path, config)
    return response.data
  },

  uploadFile: async (path: string, file: File, token: string): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await client.post<{ url: string }>(path, formData, {
      headers: {
        ...authHeader(token),
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

export function getImageUrl(path?: string | null): string {
  if (!path) return '/placeholder.jpg'
  if (path.startsWith('http')) return path
  return `${API_URL}${path}`
}

export default api
