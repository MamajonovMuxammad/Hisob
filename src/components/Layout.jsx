import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { supabase } from '../lib/supabase'

const NAV_LABELS = {
  chat: '💬 ИИ-Бухгалтер',
  documents: '🧾 Документы',
  income: '💰 Доходы и расходы',
  tax: '📊 Налоги',
  employees: '👥 Сотрудники',
  calendar: '📅 Календарь',
  settings: '⚙️ Настройки',
}

export default function Layout({ children, activeTab, setTab }) {
  const [now, setNow] = useState(new Date())
  const [company, setCompany] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    supabase.from('settings').select('company').limit(1).maybeSingle().then(({ data }) => {
      if (data?.company) setCompany(data.company)
    })
  }, [activeTab])

  const dateStr = now.toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'long',
  })
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar activeTab={activeTab} setTab={setTab} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          padding: '11px 28px',
          borderBottom: '1px solid #1e2a3a',
          background: 'rgba(13,17,23,.92)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 14, color: '#A0AEC0', fontWeight: 500 }}>
              {NAV_LABELS[activeTab]}
            </span>
            {company && (
              <span style={{
                fontSize: 12, color: '#4F8EF7', background: '#172040',
                border: '1px solid #2563eb33', borderRadius: 20,
                padding: '3px 10px', fontWeight: 500,
              }}>
                {company}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* AI online badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#0a2a1a', border: '1px solid #22543d',
              borderRadius: 20, padding: '4px 12px',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#48bb78',
                display: 'inline-block', boxShadow: '0 0 6px #48bb78',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 12, color: '#68d391', fontWeight: 600 }}>ИИ онлайн</span>
            </div>

            <span style={{ fontSize: 12, color: '#4A5568' }}>
              {dateStr} · {timeStr}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#553c9a,#805ad5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>👤</div>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
