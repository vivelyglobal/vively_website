import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { campaignsApi } from '@/utils/api'
import { Campaign } from '@/types'
import '@/styles/campaigns-page.css'

export default function CampaignsPage() {
  const { t } = useTranslation()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['all', 'beauty', 'fashion', 'tech', 'travel', 'food']

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await campaignsApi.getAll()
      setCampaigns(response.data)
      setFilteredCampaigns(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = campaigns

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category.toLowerCase() === selectedCategory)
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredCampaigns(filtered)
  }, [selectedCategory, searchQuery, campaigns])

  return (
    <div className="campaigns-page">
      <div className="wrap">
        <h1>{t('campaigns.title')}</h1>

        {/* Filters */}
        <div className="campaigns-filters">
          <div className="filter-group">
            <label htmlFor="category">{t('campaigns.filter')}</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <input
              type="search"
              placeholder={t('campaigns.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && <p className="loading">{t('auth.loading')}</p>}
        {error && <p className="error">{error}</p>}

        {/* Campaigns Grid */}
        {!loading && filteredCampaigns.length > 0 ? (
          <div className="campaigns-grid">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign._id} className="campaign-card">
                <div className="campaign-image">
                  <img src={campaign.imageUrl} alt={campaign.title} />
                  <span className="campaign-category">{campaign.category}</span>
                </div>

                <div className="campaign-content">
                  <h3>{campaign.title}</h3>
                  <p className="campaign-brand">{campaign.brand}</p>
                  <p className="campaign-description">{campaign.description.substring(0, 100)}...</p>

                  <div className="campaign-meta">
                    <div>
                      <span className="meta-label">{t('campaigns.budget')}</span>
                      <span className="campaign-budget">{campaign.budget}</span>
                    </div>
                    <div>
                      <span className="meta-label">{t('campaigns.spots')}</span>
                      <span className="campaign-spots">{campaign.spots} {t('campaigns.spots')}</span>
                    </div>
                  </div>

                  <Link to={`/campaign/${campaign._id}`} className="btn btn-accent">
                    {t('campaigns.viewDetails')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && <p className="no-campaigns">{t('campaigns.noCampaigns')}</p>
        )}
      </div>
    </div>
  )
}
