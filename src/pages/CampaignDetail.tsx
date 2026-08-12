import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { campaignsApi, applicationsApi } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'
import { Campaign } from '@/types'
import '@/styles/campaign-detail-page.css'

export default function CampaignDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    instagram: '',
    message: '',
  })

  useEffect(() => {
    loadCampaign()
  }, [id])

  const loadCampaign = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const response = await campaignsApi.getById(id)
      setCampaign(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn) {
      alert(t('auth.login') + ' ' + t('auth.error'))
      return
    }

    setSubmitting(true)
    try {
      await applicationsApi.submit({
        campaignId: id,
        userId: user?._id,
        ...formData,
      })
      setSubmitted(true)
      setFormData({ name: '', email: '', instagram: '', message: '' })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="campaign-detail-page">{t('auth.loading')}</div>
  if (error) return <div className="campaign-detail-page error">{error}</div>
  if (!campaign) return <div className="campaign-detail-page">{t('campaigns.noCampaigns')}</div>

  return (
    <div className="campaign-detail-page">
      <div className="wrap">
        {/* Hero Image */}
        <div className="campaign-hero">
          <img src={campaign.imageUrl} alt={campaign.title} />
          <div className="campaign-overlay">
            <span className="campaign-tag">{campaign.category}</span>
            <h1>{campaign.title}</h1>
            <p className="campaign-brand-hero">{campaign.brand}</p>
          </div>
        </div>

        {/* Details */}
        <div className="campaign-details">
          <div className="details-section">
            <h2>{t('campaigns.description')}</h2>
            <p>{campaign.description}</p>
          </div>

          <div className="details-section">
            <h2>{t('campaign.guidelines')}</h2>
            <ul className="guidelines-list">
              {campaign.guidelines.map((guideline, i) => (
                <li key={i}>{guideline}</li>
              ))}
            </ul>
          </div>

          <div className="details-section">
            <h2>{t('campaign.targetAudience')}</h2>
            <ul className="audience-list">
              {campaign.targetAudience.map((audience, i) => (
                <li key={i}>{audience}</li>
              ))}
            </ul>
          </div>

          <div className="details-info">
            <div className="info-card">
              <span className="info-label">{t('campaigns.budget')}</span>
              <span className="info-value">{campaign.budget}</span>
            </div>
            <div className="info-card">
              <span className="info-label">{t('campaigns.spots')}</span>
              <span className="info-value">{campaign.spots}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Status</span>
              <span className="info-value">{campaign.status}</span>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="application-section">
          <h2>{t('campaign.apply')}</h2>

          {submitted ? (
            <div className="success-message">✓ {t('campaign.applicationSubmitted')}</div>
          ) : (
            <form onSubmit={handleSubmit} className="application-form">
              <div className="form-group">
                <label htmlFor="name">{t('auth.name')} *</label>
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
                <label htmlFor="email">{t('auth.email')} *</label>
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
                <label htmlFor="instagram">{t('campaign.instagram')}</label>
                <input
                  id="instagram"
                  type="text"
                  name="instagram"
                  placeholder="@yourhandle"
                  value={formData.instagram}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">{t('campaign.message')}</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-accent" disabled={submitting}>
                {submitting ? t('auth.loading') : t('campaign.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
