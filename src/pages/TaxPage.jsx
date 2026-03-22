import { useState } from 'react'

const fmt = n => Number(n || 0).toLocaleString('ru-RU')

function ResultRow({ label, val, color, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px',
      background: '#0F1117', borderRadius: 10, border: '1px solid #2D3748',
    }}>
      <span style={{ fontSize: 13, color: '#A0AEC0' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 800 : 600, color }}>{fmt(val)} сум</span>
    </div>
  )
}

export default function TaxPage({ onNavigate }) {
  const [mode, setMode] = useState('usn4')
  const [rev, setRev] = useState('')
  const [period, setPeriod] = useState('month')
  const [result, setResult] = useState(null)

  const [sal, setSal] = useState('')
  const [salResult, setSalResult] = useState(null)

  const calcTax = () => {
    const r = parseFloat(rev.replace(/\s/g, '')) || 0
    if (mode === 'usn4') {
      const tax  = r * 0.04
      const soc  = r * 0.12
      const inps = r * 0.04
      setResult({
        rows: [
          { label: 'Выручка',               val: r,               color: '#90cdf4' },
          { label: 'Налог с оборота (4%)',   val: tax,             color: '#fc8181' },
          { label: 'Социальный налог (12%)', val: soc,             color: '#f6ad55' },
          { label: 'ИНПС (4%)',              val: inps,            color: '#f6ad55' },
          { label: '💰 ИТОГО к уплате',      val: tax + soc + inps, color: '#fc8181', bold: true },
        ],
        note: 'ИП (УСН торговля 4%) · Срок: до 15 числа следующего месяца',
      })
    } else if (mode === 'usn6') {
      const tax  = r * 0.06
      const soc  = r * 0.12
      const inps = r * 0.04
      setResult({
        rows: [
          { label: 'Выручка',               val: r,               color: '#90cdf4' },
          { label: 'Налог с оборота (6%)',   val: tax,             color: '#fc8181' },
          { label: 'Социальный налог (12%)', val: soc,             color: '#f6ad55' },
          { label: 'ИНПС (4%)',              val: inps,            color: '#f6ad55' },
          { label: '💰 ИТОГО к уплате',      val: tax + soc + inps, color: '#fc8181', bold: true },
        ],
        note: 'ИП (УСН услуги 6%) · Срок: до 15 числа следующего месяца',
      })
    } else {
      const nds    = r * 0.12
      const profit = r * 0.25
      const soc    = r * 0.12
      setResult({
        rows: [
          { label: 'Выручка',               val: r,                    color: '#90cdf4' },
          { label: 'НДС (12%)',              val: nds,                  color: '#fc8181' },
          { label: 'Налог на прибыль (25%)', val: profit,               color: '#fc8181' },
          { label: 'Социальный налог (12%)', val: soc,                  color: '#f6ad55' },
          { label: '💰 ИТОГО к уплате',      val: nds + profit + soc,   color: '#fc8181', bold: true },
        ],
        note: 'ООО (ОСН) · Квартальная отчётность по НДС и налогу на прибыль',
      })
    }
  }

  const calcSalary = () => {
    const s    = parseFloat(sal.replace(/\s/g, '')) || 0
    const ndfl = s * 0.12
    const inps = s * 0.04
    const soc  = s * 0.12
    const net  = s - ndfl - inps
    setSalResult({
      rows: [
        { label: 'Оклад (брутто)',                    val: s,      color: '#90cdf4' },
        { label: 'НДФЛ 12% (удерж. с сотрудника)',    val: ndfl,   color: '#fc8181' },
        { label: 'ИНПС 4% (удерж. с сотрудника)',     val: inps,   color: '#f6ad55' },
        { label: 'Соцналог 12% (платит работодатель)', val: soc,    color: '#f6ad55' },
        { label: '✅ На руки (нетто)',                 val: net,    color: '#48bb78', bold: true },
        { label: 'Итого расход работодателя',          val: s + soc, color: '#fc8181' },
      ],
    })
  }

  const MODES = [
    { v: 'usn4', l: 'ИП УСН 4%' },
    { v: 'usn6', l: 'ИП УСН 6%' },
    { v: 'osn',  l: 'ООО ОСН' },
  ]

  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="page-header">
        <h1 className="page-title">📊 Налоговые калькуляторы</h1>
        <p className="page-subtitle">Расчёт налогов по законодательству Республики Узбекистан</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Tax calculator */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 18, fontSize: 15 }}>🧮 Калькулятор налогов</h3>

          {/* Mode switcher */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            {MODES.map(({ v, l }) => (
              <button key={v}
                onClick={() => { setMode(v); setResult(null) }}
                style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: 'none',
                  background: mode === v ? '#4F8EF7' : '#1e2a4a',
                  color: mode === v ? '#fff' : '#A0AEC0',
                  transition: 'all .2s',
                }}
              >{l}</button>
            ))}
          </div>

          <div className="form-group">
            <label className="label">Выручка за период (сум)</label>
            <input className="input" type="text" placeholder="10 000 000"
              value={rev} onChange={e => setRev(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Период</label>
            <select className="input" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="month">Текущий месяц</option>
              <option value="quarter">Квартал</option>
              <option value="year">Год</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={calcTax} style={{ width: '100%', padding: 11 }}>
            Рассчитать налоги
          </button>

          {result && (
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.rows.map((r, i) => <ResultRow key={i} {...r} />)}
              <div className="alert alert-info">📅 {result.note}</div>
              <div className="alert alert-warning">⚠️ Проверьте актуальные ставки на my.soliq.uz</div>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: 4 }}
                onClick={() => onNavigate?.('Объясни подробнее как рассчитать мои налоги в Узбекистане')}
              >
                💬 Спросить ИИ подробнее
              </button>
            </div>
          )}
        </div>

        {/* Salary calculator */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>💼 Калькулятор зарплаты</h3>
          <p style={{ fontSize: 13, color: '#A0AEC0', marginBottom: 18 }}>Оклад → удержания → сумма на руки</p>

          <div className="form-group">
            <label className="label">Оклад сотрудника (сум)</label>
            <input className="input" type="text" placeholder="5 000 000"
              value={sal} onChange={e => setSal(e.target.value)} />
          </div>

          <button className="btn btn-primary" onClick={calcSalary} style={{ width: '100%', padding: 11 }}>
            Рассчитать зарплату
          </button>

          {salResult && (
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {salResult.rows.map((r, i) => <ResultRow key={i} {...r} />)}
              <div className="alert alert-warning">⚠️ Проверьте на my.soliq.uz</div>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: 4 }}
                onClick={() => onNavigate?.('Объясни как правильно рассчитать зарплату с учётом всех налогов в Узбекистане')}
              >
                💬 Спросить ИИ о зарплате
              </button>
            </div>
          )}

          <hr className="divider" />

          {/* Reference */}
          <div style={{ fontSize: 13, color: '#A0AEC0', lineHeight: 1.8 }}>
            <p style={{ fontWeight: 600, color: '#E2E8F0', marginBottom: 8 }}>📚 Справка по ставкам (2025)</p>
            {[
              ['НДФЛ',           '12% — удерживается с зарплаты сотрудника'],
              ['ИНПС',           '4% работник + 1% работодатель'],
              ['Соцналог',       '12% — платит работодатель сверху'],
              ['УСН (услуги)',    '6% от выручки'],
              ['УСН (торговля)', '4% от выручки'],
              ['НДС',            '12% при обороте > 1 млрд сум/год'],
            ].map(([t, d]) => (
              <div key={t} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#4F8EF7', fontWeight: 600, minWidth: 120 }}>{t}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
