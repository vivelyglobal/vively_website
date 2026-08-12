import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  setAuth: (token: string, user: User) => void
  logout: () => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  setAuth: (token: string, user: User) => {
    localStorage.setItem('vively_user_token', token)
    localStorage.setItem('vively_user_data', JSON.stringify(user))
    set({ user, token, isLoggedIn: true })
  },

  logout: () => {
    localStorage.removeItem('vively_user_token')
    localStorage.removeItem('vively_user_data')
    set({ user: null, token: null, isLoggedIn: false })
  },

  checkAuth: () => {
    const token = localStorage.getItem('vively_user_token')
    const userData = localStorage.getItem('vively_user_data')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        set({ token, user, isLoggedIn: true })
      } catch (e) {
        set({ token: null, user: null, isLoggedIn: false })
      }
    }
  },
}))
