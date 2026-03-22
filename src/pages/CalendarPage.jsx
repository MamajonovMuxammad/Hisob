export default function CalendarPage({ onNavigate }) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  // Build deadlines for current + next month
  const deadlines = [
    { date: new Date(y, m, 15),   label: 'Уплата налога с оборота (УСН)',      type: 'tax',    q: 'Как оплатить налог с оборота (УСН)? Куда платить и какие реквизиты?' },
    { date: new Date(y, m, 20),   label: 'Отчёт по зарплатным налогам',        type: 'report', q: 'Как сдать отчёт по зарплатным налогам НДФЛ/ИНПС в налоговую?' },
    { date: new Date(y, m, 25),   label: 'Квартальный отчёт по НДС',           type: 'report', q: 'Как сдать квартальный отчёт по НДС через my.soliq.uz?' },
    { date: new Date(y, m + 1, 1), label: 'Уплата социального налога',          type: 'tax',    q: 'Как оплатить социальный налог за сотрудников? Реквизиты и порядок.' },
    { date: new Date(y, m + 1, 10), label: 'Уплата ИНПС за сотрудников',       type: 'tax',    q: 'Как оплатить ИНПС за сотрудников? Ставки и сроки.' },
    { date: new Date(y, m + 1, 15), label: 'Уплата налога с оборота (УСН)',     type: 'tax',    q: 'Как оплатить налог с оборота (УСН)? Куда платить и какие реквизиты?' },
    { date: new Date(y, m + 1, 20), label: 'Сдача отчёта по НДФЛ',             type: 'report', q: 'Как сдать отчёт по НДФЛ через my.soliq.uz за прошлый месяц?' },
    { date: new Date(y, m + 1, 25), label: 'Ежемесячная статотчётность',        type: 'report', q: 'Какие статистические отчёты нужно сдавать ежемесячно для ИП/ООО?' },
  ].sort((a, b) => a.date - b.date)

  const getStatus = (date) => {
    const diff = (date - now) / (1000 * 60 * 60 * 24)
    if (diff < 0)  return { dot: '🔴', badge: 'badge-red',    text: 'Просрочено' }
    if (diff <= 5) return { dot: '🟡', badge: 'badge-yellow', text: `${Math.ceil(diff)} дн.` }
    return         { dot: '🟢', badge: 'badge-green',  text: `${Math.ceil(diff)} дн.` }
  }

  // Group by month
  const grouped = {}
  deadlines.forEach(d => {
    const key = d.date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(d)
  })

  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="page-header">
        <h1 className="page-title">📅 Календарь отчётности</h1>
        <p className="page-subtitle">Все налоговые дедлайны на текущий и следующий месяц</p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { dot: '🔴', label: 'Просрочено' },
          { dot: '🟡', label: 'Скоро (< 5 дней)' },
          { dot: '🟢', label: 'Есть время' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: '#A0AEC0' }}>
            {l.dot} {l.label}
          </div>
        ))}
      </div>

      {Object.entries(grouped).map(([month, items]) => (
        <div key={month} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            {month}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((d, i) => {
              const st = getStatus(d.date)
              const dateStr = d.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
              return (
                <div
                  key={i}
                  className="card fade-up"
                  style={{
                    padding: '15px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{st.dot}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 5 }}>{d.label}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#A0AEC0' }}>📅 {dateStr}</span>
                      <span className={`badge ${d.type === 'tax' ? 'badge-red' : 'badge-blue'}`} style={{ fontSize: 11 }}>
                        {d.type === 'tax' ? 'Уплата налога' : 'Сдача отчёта'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span className={`badge ${st.badge}`}>{st.text}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onNavigate?.(d.q)}
                    >💬 Как сдать?</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
