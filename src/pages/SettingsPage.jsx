import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FIELDS = [
  { key: 'company',    label: 'Название организации',     ph: 'ООО "Ваш Бизнес"',          full: true },
  { key: 'inn',        label: 'ИНН',                      ph: '123456789' },
  { key: 'oked',       label: 'ОКЭД (вид деятельности)',   ph: '62010 — IT услуги' },
  { key: 'tax_system', label: 'Система налогообложения',   ph: 'УСН / ОСН' },
  { key: 'address',    label: 'Юридический адрес',         ph: 'г. Ташкент, ул. Амира Темура, 1', full: true },
  { key: 'bank',       label: 'Банк',                     ph: 'Ipak Yuli Bank' },
  { key: 'account',    label: 'Расчётный счёт',            ph: '20208000000000000001' },
  { key: 'director',   label: 'Директор (ФИО)',            ph: 'Иванов Иван Иванович' },
  { key: 'accountant', label: 'Главный бухгалтер',         ph: 'ИИ-Бухгалтер' },
]

export default function SettingsPage() {
  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (data) setForm(data);
      setLoading(false);
    }
    fetchSettings();
  }, [])

  const save = async () => {
    setLoading(true)
    if (form.id) {
      await supabase.from('settings').update({ ...form, updated_at: new Date() }).eq('id', form.id)
    } else {
      const { data } = await supabase.from('settings').insert(form).select().single()
      if (data) setForm(data)
    }
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const reset = async () => {
    if (!confirm('Сбросить все настройки в базе?')) return
    if (form.id) {
      await supabase.from('settings').delete().eq('id', form.id)
    }
    setForm({})
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="page-header">
        <h1 className="page-title">⚙️ Настройки компании</h1>
        <p className="page-subtitle">Реквизиты автоматически подставляются во все документы</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 860 }}>
        {/* Form */}
        <div className="card" style={{ padding: 28, gridColumn: '1 / -1' }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>📋 Реквизиты</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {FIELDS.map(f => (
              <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                <label className="label">{f.label}</label>
                <input
                  className="input"
                  placeholder={f.ph}
                  value={form[f.key] || ''}
                  onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 22 }}>
            <button className="btn btn-primary" onClick={save} disabled={loading} style={{ padding: '11px 28px' }}>
              {loading ? '💾 Загрузка...' : saved ? '✅ Сохранено в БД!' : '💾 Сохранить в БД'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={reset}>🗑 Сбросить</button>
            {saved && <span style={{ fontSize: 14, color: '#48bb78' }}>Данные сохранены в Supabase</span>}
          </div>
        </div>

        {/* Info */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📦 Данные Supabase</h3>
          <p style={{ fontSize: 13, color: '#A0AEC0', lineHeight: 1.7, marginBottom: 14 }}>
            Все документы, транзакции и сотрудники хранятся в вашем Supabase проекте.
            Настройте переменные окружения:
          </p>
          <div style={{ background: '#0F1117', border: '1px solid #2D3748', borderRadius: 10, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, lineHeight: 2 }}>
            <div style={{ color: '#68d391' }}>VITE_SUPABASE_URL=...</div>
            <div style={{ color: '#68d391' }}>VITE_SUPABASE_ANON_KEY=...</div>
            <div style={{ color: '#90cdf4' }}>GEMINI_API_KEY=...</div>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank" rel="noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12, display: 'inline-flex' }}
          >🔗 Открыть Supabase Dashboard</a>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🚀 Деплой на Vercel</h3>
          <p style={{ fontSize: 13, color: '#A0AEC0', lineHeight: 1.7, marginBottom: 14 }}>
            Проект готов к деплою. Добавьте env переменные в настройках проекта на Vercel.
          </p>
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            Gemini API ключ хранится только на сервере (serverless function), не в браузере.
          </div>
          <a
            href="https://vercel.com/new"
            target="_blank" rel="noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex' }}
          >🔗 Открыть Vercel</a>
        </div>
      </div>
    </div>
  )
}
