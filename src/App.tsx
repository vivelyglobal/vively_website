import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomePage from '@/pages/Home'
import CampaignsPage from '@/pages/Campaigns'
import CampaignDetailPage from '@/pages/CampaignDetail'
import AdminPage from '@/pages/Admin'
import '@/styles/globals.css'

function App() {
  const { i18n } = useTranslation()
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:lang" element={<HomePage />} />
            <Route path="/:lang/campaigns" element={<CampaignsPage />} />
            <Route path="/:lang/campaign/:id" element={<CampaignDetailPage />} />
            <Route path="/:lang/admin" element={<AdminPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaign/:id" element={<CampaignDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
