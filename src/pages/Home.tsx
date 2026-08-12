import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import '@/styles/home-page.css'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-content">
            <span className="hero-eyebrow">Global Expansion</span>
            <h1>Verify Markets Through Local Creators</h1>
            <p className="hero-subheading">
              Vively connects Korean brands with creators worldwide to test markets before scaling.
              Zero influencer costs. Real market validation.
            </p>
            <div className="hero-ctas">
              <Link to="/campaigns" className="btn btn-accent">
                {t('nav.campaigns')}
              </Link>
              <a href="contact.html" className="btn btn-ghost">
                {t('nav.contact')} ↓
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="placeholder-box">
              <img src="assets/img/content-00.jpeg" alt="Creator content" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="wrap">
          <h2>How Vively Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">1</div>
              <h3>Match Creators</h3>
              <p>We connect you with 30+ creators suited to your brand and target market.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">2</div>
              <h3>Launch Campaign</h3>
              <p>Creators produce authentic content and engage their local audiences.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">3</div>
              <h3>Validate Market</h3>
              <p>Get real consumer feedback before your major market entry investment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="wrap">
          <h2>Ready to expand globally?</h2>
          <p>Start your market validation journey today.</p>
          <a href="contact.html" className="btn btn-accent btn-large">
            {t('nav.contact')}
          </a>
        </div>
      </section>
    </div>
  )
}
