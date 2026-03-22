import { supabase } from '../lib/supabase'

const NAV = [
  { id: 'chat',      icon: '💬', label: 'ИИ-Бухгалтер' },
  { id: 'documents', icon: '🧾', label: 'Документы' },
  { id: 'income',    icon: '💰', label: 'Доходы и расходы' },
  { id: 'tax',       icon: '📊', label: 'Налоги' },
  { id: 'employees', icon: '👥', label: 'Сотрудники' },
  { id: 'calendar',  icon: '📅', label: 'Календарь' },
  { id: 'settings',  icon: '⚙️',  label: 'Настройки' },
]

export default function Sidebar({ activeTab, setTab }) {
  const company = (() => {
    try { return JSON.parse(localStorage.getItem('hisob_settings') || '{}').company || '' }
    catch { return '' }
  })()

  return (
    <aside style={{
      width: 230,
      background: '#0d1117',
      borderRight: '1px solid #1e2a3a',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '10px 14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#1e3a8a,#4F8EF7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🤖</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>Hisob.AI</div>
            <div style={{ fontSize: 11, color: '#A0AEC0' }}>ИИ-Бухгалтер</div>
          </div>
        </div>
        {company && (
          <div style={{
            marginTop: 12, padding: '7px 10px',
            background: '#172040', borderRadius: 8,
            border: '1px solid #2563eb33',
            fontSize: 11, color: '#90cdf4', fontWeight: 500,
          }}>
            {company}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-item${activeTab === n.id ? ' active' : ''}`}
            onClick={() => setTab(n.id)}
            style={{ width: '100%', textAlign: 'left', background: 'none', fontFamily: 'inherit' }}
          >
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
        <button
          className="nav-item"
          onClick={() => supabase.auth.signOut()}
          style={{ width: '100%', textAlign: 'left', background: 'none', fontFamily: 'inherit', color: '#fc8181', marginTop: 'auto' }}
        >
          <span className="nav-icon">🚪</span>
          <span>Выйти</span>
        </button>
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px', borderTop: '1px solid #1e2a3a', marginTop: 8 }}>
        <div style={{ fontSize: 11, color: '#4A5568', marginBottom: 4 }}>Узбекистан · РУз</div>
        <a
          href="https://my.soliq.uz"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 11, color: '#4F8EF7', textDecoration: 'none' }}
        >
          🔗 my.soliq.uz
        </a>
      </div>
    </aside>
  )
}
