import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DOC_TYPES = [
  { icon: '📄', key: 'invoice',   label: 'Счёт-фактура',        fields: ['Кому (организация/ФИО)', 'ИНН получателя', 'Наименование услуги/товара', 'Количество', 'Цена (сум)', 'НДС (да/нет)'] },
  { icon: '✅', key: 'act',      label: 'Акт выполненных работ', fields: ['Заказчик', 'ИНН заказчика', 'Описание работ', 'Сумма (сум)'] },
  { icon: '📦', key: 'waybill',  label: 'Накладная',             fields: ['Получатель', 'ИНН', 'Наименование товара', 'Количество', 'Цена (сум)'] },
  { icon: '📝', key: 'contract', label: 'Договор услуг',         fields: ['Заказчик', 'ИНН заказчика', 'Описание услуг', 'Сумма (сум)', 'Срок исполнения'] },
  { icon: '💵', key: 'payslip',  label: 'Расчётный лист',        fields: ['ФИО сотрудника', 'Должность', 'Оклад (сум)', 'Месяц/год'] },
]

async function generateDoc(type, fields, settings) {
  const company = settings?.company || 'Ваша компания'
  const inn = settings?.inn || '—'
  const director = settings?.director || '—'
  const prompt = `Сгенерируй документ "${type}" для компании "${company}" (ИНН: ${inn}), директор: ${director}.\nДанные:\n${JSON.stringify(fields, null, 2)}\nОформи красиво с разделителями. Укажи все обязательные реквизиты по законодательству РУз.`

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', text: prompt }] }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

function CreateModal({ docType, onClose, onCreated }) {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const settings = (() => { try { return JSON.parse(localStorage.getItem('hisob_settings') || '{}') } catch { return {} } })()

  const generate = async () => {
    setLoading(true); setError(''); setPreview('')
    try {
      const text = await generateDoc(docType.label, form, settings)
      setPreview(text)

      const amount = parseFloat(form['Цена (сум)'] || form['Сумма (сум)'] || form['Оклад (сум)'] || 0)
      const name = `${docType.label} — ${form['Кому (организация/ФИО)'] || form['Заказчик'] || form['Получатель'] || form['ФИО сотрудника'] || 'Новый'}`

      const { error: dbErr } = await supabase.from('documents').insert({
        type: docType.label,
        name,
        content: text,
        amount,
        date: new Date().toISOString().slice(0, 10),
      })
      if (dbErr) console.warn('Supabase insert error:', dbErr.message)
      onCreated?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">{docType.icon} {docType.label}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {docType.fields.map(f => (
            <div key={f} className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">{f}</label>
              <input
                className="input"
                placeholder={f}
                value={form[f] || ''}
                onChange={e => setForm(fm => ({ ...fm, [f]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ width: '100%', padding: '12px' }}>
          {loading ? 'Генерация...' : '✨ Сгенерировать через ИИ'}
        </button>

        {error && <div className="alert alert-warning" style={{ marginTop: 12 }}>❌ {error}</div>}

        {preview && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              background: '#0F1117', border: '1px solid #2D3748', borderRadius: 12,
              padding: 16, fontSize: 13, lineHeight: 1.8,
              whiteSpace: 'pre-wrap', maxHeight: 320, overflowY: 'auto',
            }}>
              {preview}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(preview)}>📋 Копировать</button>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                const b = new Blob([preview], { type: 'text/plain' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(b)
                a.download = `${docType.label}.txt`
                a.click()
              }}>⬇️ Скачать .txt</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ViewModal({ doc, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">{doc.name}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{
          background: '#0F1117', border: '1px solid #2D3748', borderRadius: 12,
          padding: 16, fontSize: 13, lineHeight: 1.8,
          whiteSpace: 'pre-wrap', maxHeight: 420, overflowY: 'auto',
        }}>
          {doc.content || '(нет содержимого)'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(doc.content || '')}>📋 Копировать</button>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const b = new Blob([doc.content || ''], { type: 'text/plain' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(b)
            a.download = `${doc.name}.txt`
            a.click()
          }}>⬇️ Скачать</button>
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)

  const fetchDocs = async () => {
    setLoading(true)
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(50)
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchDocs() }, [])

  const deleteDoc = async (id) => {
    if (!confirm('Удалить документ?')) return
    await supabase.from('documents').delete().eq('id', id)
    fetchDocs()
  }

  const fmt = n => Number(n || 0).toLocaleString('ru-RU')

  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="page-header">
        <h1 className="page-title">🧾 Документы</h1>
        <p className="page-subtitle">Создавайте бухгалтерские документы через ИИ</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
        {/* Left: create */}
        <div>
          <p style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Создать документ</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DOC_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveModal(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px',
                  background: '#171923', border: '1px solid #2D3748',
                  borderRadius: 12, cursor: 'pointer', color: '#fff',
                  textAlign: 'left', fontFamily: 'inherit', transition: 'all .2s',
                  width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#4F8EF7'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2D3748'}
              >
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>Через ИИ</div>
                </div>
                <span style={{ color: '#4F8EF7' }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: history */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>История документов</p>
            <button className="btn btn-ghost btn-sm" onClick={fetchDocs}>🔄 Обновить</button>
          </div>
          <div className="card table-wrap">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#A0AEC0' }}>Загрузка...</div>
            ) : docs.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📂</div>
                <h3>Документов нет</h3>
                <p>Создайте первый документ слева</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Тип</th>
                    <th>Название</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d.id}>
                      <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{d.type}</span></td>
                      <td style={{ color: '#E2E8F0', maxWidth: 200 }}>{d.name}</td>
                      <td style={{ color: '#A0AEC0', fontSize: 13 }}>{d.date}</td>
                      <td style={{ color: '#48bb78', fontWeight: 600 }}>{fmt(d.amount)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon" onClick={() => setViewDoc(d)}>👁</button>
                          <button className="btn-icon" onClick={() => deleteDoc(d.id)} style={{ color: '#fc8181' }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {activeModal && (
        <CreateModal
          docType={activeModal}
          onClose={() => setActiveModal(null)}
          onCreated={() => { fetchDocs() }}
        />
      )}
      {viewDoc && <ViewModal doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  )
}
