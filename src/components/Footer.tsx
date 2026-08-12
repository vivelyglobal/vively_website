import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/styles/footer.css'

export default function Footer() {
  const { t } = useTranslation()
  const [year, setYear] = useState(new Date().getFullYear())

  return (
    <footer className="footer">
      <div className="wrap footer-content">
        <div className="footer-section">
          <h3>{t('footer.company')}</h3>
          <ul>
            <li><a href="#about">{t('footer.about')}</a></li>
            <li><a href="contact.html">{t('nav.contact')}</a></li>
            <li><a href="#careers">Careers</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li><a href="#privacy">{t('footer.privacy')}</a></li>
            <li><a href="#terms">{t('footer.terms')}</a></li>
            <li><a href="#cookies">Cookies</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Connect</h3>
          <ul>
            <li><a href="https://instagram.com/vivelyglobal" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="https://linkedin.com/company/vively" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href="https://twitter.com/vivelyglobal" target="_blank" rel="noopener noreferrer">Twitter</a></li>
          </ul>
        </div>

        <div className="footer-bottom">
          <p>&copy; {year} Vively. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
