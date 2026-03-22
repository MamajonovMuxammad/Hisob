import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATS_INCOME  = ['Оплата от клиента', 'Прочие доходы']
const CATS_EXPENSE = ['Зарплата', 'Аренда', 'Налоги', 'Материалы', 'Реклама', 'Прочее']
const fmt = n => Number(n || 0).toLocaleString('ru-RU')

function AddModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    category: 'Оплата от клиента',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [loading, setLoading] = useState(false)

  const cats = form.type === 'income' ? CATS_INCOME : CATS_EXPENSE

  const save = async () => {
    if (!form.amount) return
    setLoading(true)
    const { error } = await supabase.from('transactions').insert({
      type: form.type,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
    })
    setLoading(false)
    if (!error) { onAdded(); onClose() }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up">
        <div className="modal-header">
          <span className="modal-title">Добавить запись</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="toggle-group" style={{ marginBottom: 18 }}>
          {[['income', '💚 Доход'], ['expense', '🔴 Расход']].map(([v, l]) => (
            <button
              key={v}
              className={`toggle-btn${form.type === v ? ' active' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: v, category: v === 'income' ? CATS_INCOME[0] : CATS_EXPENSE[0] }))}
            >{l}</button>
          ))}
        </div>

        {[
          { label: 'Сумма (сум)', key: 'amount', type: 'number', ph: '1 000 000' },
          { label: 'Описание', key: 'description', type: 'text', ph: 'Краткое описание' },
          { label: 'Дата', key: 'date', type: 'date' },
        ].map(f => (
          <div key={f.key} className="form-group">
            <label className="label">{f.label}</label>
            <input className="input" type={f.type} placeholder={f.ph}
              value={form[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
          </div>
        ))}

        <div className="form-group">
          <label className="label">Категория</label>
          <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={loading} style={{ width: '100%', padding: 12 }}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}

export default function IncomePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetchRecords = async () => {
    setLoading(true)
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100)
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const deleteRecord = async (id) => {
    if (!confirm('Удалить запись?')) return
    await supabase.from('transactions').delete().eq('id', id)
    fetchRecords()
  }

  const totalIncome  = records.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
  const profit       = totalIncome - totalExpense

  // Weekly bar chart data (current month)
  const weeks = [1, 2, 3, 4]
  const getWeek = d => Math.min(4, Math.ceil(new Date(d).getDate() / 7))
  const wData = weeks.map(w => ({
    inc: records.filter(r => r.type === 'income'  && getWeek(r.date) === w).reduce((s, r) => s + Number(r.amount), 0),
    exp: records.filter(r => r.type === 'expense' && getWeek(r.date) === w).reduce((s, r) => s + Number(r.amount), 0),
  }))
  const maxVal = Math.max(...wData.flatMap(w => [w.inc, w.exp]), 1)

  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter)

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">💰 Доходы и расходы</h1>
          <p className="page-subtitle">Финансовый учёт за все периоды</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Добавить</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Доходы', val: totalIncome,  cls: 'stat-green',  color: '#48bb78', icon: '💚' },
          { label: 'Расходы', val: totalExpense, cls: 'stat-red',    color: '#fc8181', icon: '🔴' },
          { label: 'Прибыль', val: profit,       cls: profit >= 0 ? 'stat-yellow' : 'stat-red', color: profit >= 0 ? '#f6e05e' : '#fc8181', icon: '💛' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls} fade-up`}>
            <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 8 }}>{s.icon} {s.label} (всего)</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{fmt(s.val)}</div>
            <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 4 }}>сум</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#A0AEC0', marginBottom: 14 }}>Доходы vs Расходы по неделям</p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 110 }}>
          {wData.map((w, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', display: 'flex', gap: 4, alignItems: 'flex-end', height: 90 }}>
                <div style={{ flex: 1, background: '#48bb78', borderRadius: '4px 4px 0 0', height: `${(w.inc / maxVal) * 100}%`, minHeight: 3, transition: 'height .5s' }} />
                <div style={{ flex: 1, background: '#fc8181', borderRadius: '4px 4px 0 0', height: `${(w.exp / maxVal) * 100}%`, minHeight: 3, transition: 'height .5s' }} />
              </div>
              <span style={{ fontSize: 11, color: '#A0AEC0' }}>Нед {i + 1}</span>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12, paddingBottom: 20 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#A0AEC0' }}><span style={{ width: 10, height: 10, background: '#48bb78', borderRadius: 2, display: 'inline-block' }} /> Доходы</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#A0AEC0' }}><span style={{ width: 10, height: 10, background: '#fc8181', borderRadius: 2, display: 'inline-block' }} /> Расходы</div>
          </div>
        </div>
      </div>

      {/* Filter + Table */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['all', 'Все'], ['income', '💚 Доходы'], ['expense', '🔴 Расходы']].map(([v, l]) => (
          <button key={v} className={`btn${filter === v ? ' btn-primary' : ' btn-ghost'} btn-sm`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#A0AEC0' }}>Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💸</div>
            <h3>Записей нет</h3>
            <p>Добавьте первую транзакцию</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Тип</th><th>Категория</th><th>Описание</th><th>Дата</th><th>Сумма</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><span className={`badge ${r.type === 'income' ? 'badge-green' : 'badge-red'}`}>{r.type === 'income' ? 'Доход' : 'Расход'}</span></td>
                  <td style={{ color: '#A0AEC0', fontSize: 13 }}>{r.category}</td>
                  <td style={{ color: '#E2E8F0' }}>{r.description}</td>
                  <td style={{ color: '#A0AEC0', fontSize: 13 }}>{r.date}</td>
                  <td style={{ color: r.type === 'income' ? '#48bb78' : '#fc8181', fontWeight: 700 }}>
                    {r.type === 'income' ? '+' : '−'}{fmt(r.amount)}
                  </td>
                  <td><button className="btn-icon" onClick={() => deleteRecord(r.id)} style={{ color: '#fc8181' }}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdded={fetchRecords} />}
    </div>
  )
}
