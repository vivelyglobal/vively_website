import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LoginModal from './LoginModal'
import '@/styles/header.css'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { isLoggedIn, user, logout } = useAuthStore()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'en' ? 'ko' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const handleLogout = () => {
    logout()
  }

  const navLinks = [
    { href: '#work', label: t('nav.work') },
    { href: '#services', label: t('nav.services') },
    { href: '#brand', label: t('nav.brand') },
    { href: 'contact.html', label: t('nav.contact') },
    { href: '/campaigns', label: t('nav.campaigns') },
  ]

  return (
    <>
      <header className="header">
        <nav className="nav">
          <div className="wrap nav-wrapper">
            <Link to="/" className="nav-logo">
              <img src="assets/logo/vively-logo-black.png" alt="Vively" />
            </Link>

            <div className="nav-links">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="nav-link">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="nav-auth">
              <button className="lang-toggle" onClick={handleLanguageToggle}>
                {i18n.language === 'en' ? '한국어' : 'English'}
              </button>

              {isLoggedIn ? (
                <div className="user-profile">
                  <span className="user-name">{user?.name}</span>
                  <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                    {t('auth.logout')}
                  </button>
                </div>
              ) : (
                <button className="btn btn-accent btn-sm" onClick={() => setShowLoginModal(true)}>
                  {t('auth.login')}
                </button>
              )}
            </div>

            <button
              className={`nav-burger ${mobileMenuOpen ? 'is-open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mobile-menu">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr />
              <button className="lang-toggle mobile" onClick={handleLanguageToggle}>
                {i18n.language === 'en' ? '한국어' : 'English'}
              </button>
              {isLoggedIn ? (
                <>
                  <div className="mobile-user">{user?.name}</div>
                  <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                    {t('auth.logout')}
                  </button>
                </>
              ) : (
                <button className="btn btn-accent btn-sm" onClick={() => {
                  setShowLoginModal(true)
                  setMobileMenuOpen(false)
                }}>
                  {t('auth.login')}
                </button>
              )}
            </div>
          )}
        </nav>
      </header>

      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}
