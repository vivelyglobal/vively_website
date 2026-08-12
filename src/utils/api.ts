import axios from 'axios'
import { Campaign, Application, AuthToken, ApiResponse } from '@/types'

const API_BASE = '/.netlify/functions'
const client = axios.create({
  baseURL: API_BASE,
})

// Interceptor to add auth token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('vively_user_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Campaigns
export const campaignsApi = {
  getAll: () => client.get<Campaign[]>('/campaigns'),
  getById: (id: string) => client.get<Campaign>(`/campaigns?id=${id}`),
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    client.post<AuthToken>('/auth-login', {
      email,
      password,
      action: 'login',
    }),
  signup: (email: string, password: string, name: string) =>
    client.post<AuthToken>('/auth-login', {
      email,
      password,
      name,
      action: 'register',
    }),
}

// Applications
export const applicationsApi = {
  submit: (data: Partial<Application>) =>
    client.post<Application>('/applications', data),
  getByUser: () => client.get<Application[]>('/applications'),
}

// Admin
export const adminApi = {
  getCampaigns: () => client.get<Campaign[]>('/admin-campaigns'),
  createCampaign: (data: Partial<Campaign>) =>
    client.post<Campaign>('/admin-campaigns', data),
  updateCampaign: (id: string, data: Partial<Campaign>) =>
    client.put<Campaign>(`/admin-campaigns?id=${id}`, data),
  deleteCampaign: (id: string) =>
    client.delete(`/admin-campaigns?id=${id}`),
  getApplications: () => client.get<Application[]>('/applications'),
}

export default client
