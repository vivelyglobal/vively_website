import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { adminApi, authApi } from '@/utils/api'
import { Campaign } from '@/types'
import '@/styles/admin-page.css'

export default function AdminPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('dashboard')

  const [adminLoginForm, setAdminLoginForm] = useState({
    email: '',
    password: '',
  })
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)

  // Check if user is admin
  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin') {
      setIsAdminLoggedIn(true)
      loadCampaigns()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn, user])

  const loadCampaigns = async () => {
    try {
      const response = await adminApi.getCampaigns()
      setCampaigns(response.data)
    } catch (err: any) {
      console.error('Failed to load campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminError(null)
    try {
      const response = await authApi.login(adminLoginForm.email, adminLoginForm.password)
      if (response.data.user.role !== 'admin') {
        throw new Error('Not authorized')
      }
      useAuthStore.setState({
        user: response.data.user,
        token: response.data.token,
        isLoggedIn: true,
      })
      localStorage.setItem('vively_user_token', response.data.token)
      localStorage.setItem('vively_user_data', JSON.stringify(response.data.user))
      setIsAdminLoggedIn(true)
      loadCampaigns()
    } catch (err: any) {
      setAdminError('Invalid admin credentials')
    }
  }

  // If not admin, show login form
  if (!isAdminLoggedIn) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <div className="login-box">
            <h2>{t('admin.dashboard')}</h2>
            <p>Authorized administrators only</p>
            <form onSubmit={handleAdminLogin}>
              {adminError && <p className="error">{adminError}</p>}
              <div className="form-group">
                <label>{t('auth.email')}</label>
                <input
                  type="email"
                  value={adminLoginForm.email}
                  onChange={(e) =>
                    setAdminLoginForm({ ...adminLoginForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('auth.password')}</label>
                <input
                  type="password"
                  value={adminLoginForm.password}
                  onChange={(e) =>
                    setAdminLoginForm({ ...adminLoginForm, password: e.target.value })
                  }
                  required
                />
              </div>
              <button type="submit" className="btn btn-accent">
                {t('auth.login')}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h2>Admin</h2>
        </div>
        <nav className="admin-nav">
          <button
            className={`nav-item ${section === 'dashboard' ? 'active' : ''}`}
            onClick={() => setSection('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-item ${section === 'campaigns' ? 'active' : ''}`}
            onClick={() => setSection('campaigns')}
          >
            {t('admin.campaigns')}
          </button>
          <button
            className={`nav-item ${section === 'applications' ? 'active' : ''}`}
            onClick={() => setSection('applications')}
          >
            {t('admin.applications')}
          </button>
          <button
            className="nav-item logout"
            onClick={() => {
              useAuthStore.setState({ user: null, token: null, isLoggedIn: false })
              localStorage.clear()
            }}
          >
            {t('auth.logout')}
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>
            {section === 'dashboard' && t('admin.dashboard')}
            {section === 'campaigns' && t('admin.campaigns')}
            {section === 'applications' && t('admin.applications')}
          </h1>
        </header>

        {/* Dashboard Section */}
        {section === 'dashboard' && (
          <section className="admin-section">
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Campaigns</span>
                <span className="stat-value">{campaigns.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Active Campaigns</span>
                <span className="stat-value">{campaigns.filter((c) => c.status === 'active').length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Applicants</span>
                <span className="stat-value">{campaigns.reduce((sum, c) => sum + c.applicants.length, 0)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Campaigns Section */}
        {section === 'campaigns' && (
          <section className="admin-section">
            <div className="section-header">
              <h2>{t('admin.campaigns')}</h2>
              <button className="btn btn-primary">+ {t('admin.newCampaign')}</button>
            </div>
            {loading ? (
              <p>{t('auth.loading')}</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Brand</th>
                    <th>Status</th>
                    <th>Applicants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign._id}>
                      <td>{campaign.title}</td>
                      <td>{campaign.brand}</td>
                      <td>{campaign.status}</td>
                      <td>{campaign.applicants.length}</td>
                      <td>
                        <button className="btn btn-sm">{t('admin.edit')}</button>
                        <button className="btn btn-sm">{t('admin.delete')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* Applications Section */}
        {section === 'applications' && (
          <section className="admin-section">
            <h2>{t('admin.applications')}</h2>
            <p>Applications management coming soon...</p>
          </section>
        )}
      </main>
    </div>
  )
}
