import Sidebar from './Sidebar'

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
  const dateStr = new Date().toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar activeTab={activeTab} setTab={setTab} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          padding: '13px 28px',
          borderBottom: '1px solid #1e2a3a',
          background: 'rgba(13,17,23,.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <span style={{ fontSize: 14, color: '#A0AEC0', fontWeight: 500 }}>
            {NAV_LABELS[activeTab]}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, color: '#4A5568' }}>{dateStr}</span>
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
    </div>
  )
}
