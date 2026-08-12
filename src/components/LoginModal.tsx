import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/utils/api'
import '@/styles/modal.css'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { t } = useTranslation()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await authApi.login(formData.email, formData.password)
      setAuth(response.data.token, response.data.user)
      setFormData({ email: '', password: '', name: '' })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await authApi.signup(formData.email, formData.password, formData.name)
      setAuth(response.data.token, response.data.user)
      setFormData({ email: '', password: '', name: '' })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    alert('Google OAuth coming soon!')
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        {isSignup ? (
          <form onSubmit={handleSignup} className="auth-form">
            <h2>{t('auth.signup')}</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">{t('auth.name')}</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('auth.password')}</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-accent" disabled={loading}>
              {loading ? t('auth.loading') : t('auth.signup')}
            </button>

            <p className="form-footer">
              {t('auth.loginToggle')}
              <a href="#" onClick={(e) => {
                e.preventDefault()
                setIsSignup(false)
                setError(null)
              }}>
                {t('auth.login')}
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>{t('auth.login')}</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('auth.password')}</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-accent" disabled={loading}>
              {loading ? t('auth.loading') : t('auth.login')}
            </button>

            <div className="divider">{t('auth.or')}</div>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {t('auth.googleLogin')}
            </button>

            <p className="form-footer">
              {t('auth.signupToggle')}
              <a href="#" onClick={(e) => {
                e.preventDefault()
                setIsSignup(true)
                setError(null)
              }}>
                {t('auth.signup')}
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
