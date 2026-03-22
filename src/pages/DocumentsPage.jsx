import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const DOC_TYPES = [
  { icon: '📄', key: 'invoice', label: 'Счёт-фактура', fields: ['Кому (Организация/ФИО)', 'ИНН покупателя', 'Адрес покупателя', 'Р/с и Банк покупателя', 'МФО', 'Наименование услуги/товара', 'Количество', 'Цена (сум)', 'НДС (если есть)'] },
  { icon: '✅', key: 'act', label: 'Акт выполненных работ', fields: ['Заказчик (Организация/ФИО)', 'ИНН заказчика', 'Адрес заказчика', 'Р/с и Банк заказчика', 'МФО', 'Телефоны сторон', 'Описание работ', 'Сумма (сум)'] },
  { icon: '📦', key: 'waybill', label: 'Накладная', fields: ['Получатель', 'ИНН получателя', 'Адрес доставки', 'Водитель/Автомобиль', 'Наименование товара', 'Количество', 'Цена (сум)'] },
  { icon: '📝', key: 'contract', label: 'Договор услуг', fields: ['Заказчик', 'ИНН заказчика', 'Адрес (юридический)', 'Р/с, Банк, МФО', 'Ф.И.О. руководителя Заказчика', 'Предмет договора (описание)', 'Сумма (сум)', 'Срок исполнения (дней)'] },
  { icon: '💵', key: 'payslip', label: 'Расчётный лист', fields: ['ФИО сотрудника', 'ПИНФЛ и ИНПС', 'Должность', 'Оклад (сум)', 'Премия/Удержания', 'Месяц/год'] },
]

async function generateDoc(type, fields) {
  const { data: settings } = await supabase.from('settings').select('*').limit(1).maybeSingle()
  const company = settings?.company || 'Ваша компания'
  const inn = settings?.inn || '—'
  const director = settings?.director || '—'
  const prompt = `Сгенерируй ГОТОВЫЙ документ "${type}" для компании "${company}" (ИНН: ${inn}, Директор: ${director}).
Данные:
${JSON.stringify(fields, null, 2)}
ВАЖНО:
1. Выведи ТОЛЬКО текст документа, никаких "Вот ваш документ" в начале или конце.
2. Категорически ЗАПРЕЩАЮ использовать квадратные или круглые скобки вроде [Указать адрес] или (Пример). Если данных нет в "Данные:" выше, оставляй просто пустое место "_______________" для заполнения от руки.
3. Оформи максимально красиво в Markdown, соблюдая все реквизиты.`;

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', text: prompt }] }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

function CreateDocumentView({ docType, onClose, onCreated }) {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true); setError(''); setPreview('')
    try {
      const text = await generateDoc(docType.label, form)
      setPreview(text)

      const amount = parseFloat(form['Цена (сум)'] || form['Сумма (сум)'] || form['Оклад (сум)'] || 0)
      const name = `${docType.label} — ${form['Кому (Организация/ФИО)'] || form['Заказчик (Организация/ФИО)'] || form['Заказчик'] || form['Получатель'] || form['ФИО сотрудника'] || 'Новый'}`

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
    <div className="fade-up" style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ marginBottom: 20 }}>← Назад к списку</button>
      <div className="page-header">
        <h1 className="page-title">{docType.icon} Создание: {docType.label}</h1>
        <p className="page-subtitle">Заполните данные, и ИИ сгенерирует готовый документ</p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
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
        
        <button className="btn btn-primary btn-lg" onClick={generate} disabled={loading} style={{ width: '100%', marginTop: 24 }}>
          {loading ? 'Генерация...' : '✨ Сгенерировать документ'}
        </button>
      </div>

      {error && <div className="alert alert-warning" style={{ marginBottom: 24 }}>❌ {error}</div>}

      {preview && (
        <div className="card fade-up" style={{ padding: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>📄 Предпросмотр документа</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(preview)}>📋 Скопировать</button>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                const prtContent = document.getElementById(`pdf-create-${docType.key}`);
                const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900');
                WinPrint.document.write(`<html><head><title>${docType.label}</title><style>body{font-family:sans-serif;padding:40px;color:#000;line-height:1.6} table{width:100%;border-collapse:collapse;margin:20px 0} th,td{border:1px solid #333;padding:10px;text-align:left} h1,h2,h3{margin-bottom:10px}</style></head><body>${prtContent.innerHTML}</body></html>`);
                WinPrint.document.close();
                WinPrint.focus();
                WinPrint.setTimeout(() => { WinPrint.print(); WinPrint.close(); }, 250);
              }}>🖨️ Печать</button>
              <button className="btn btn-primary btn-sm" onClick={() => {
                const element = document.getElementById(`pdf-create-${docType.key}`);
                const clone = element.cloneNode(true);
                clone.style.background = '#ffffff';
                clone.style.color = '#000000';
                clone.style.padding = '40px';
                clone.style.borderRadius = '0';
                clone.style.fontSize = '12px';
                clone.style.maxHeight = 'none';
                clone.style.overflow = 'visible';
                const tds = clone.querySelectorAll('th, td');
                tds.forEach(td => td.style.border = '1px solid #ccc');
                const ths = clone.querySelectorAll('th');
                ths.forEach(th => th.style.background = '#f5f5f5');
                const headings = clone.querySelectorAll('h1, h2, h3, h4');
                headings.forEach(h => h.style.color = '#000000');
                
                window.html2pdf().set({
                  margin: 10,
                  filename: `${docType.label}.pdf`,
                  pagebreak: { mode: 'avoid-all' },
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                }).from(clone).save();
              }}>⬇️ Скачать PDF</button>
            </div>
          </div>
          <div id={`pdf-create-${docType.key}`} className="markdown-body" style={{
            background: '#ffffff', color: '#000', borderRadius: 8,
            padding: '40px 50px', fontSize: 13, lineHeight: 1.6,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}

function FullScreenView({ doc, onClose }) {
  return (
    <div className="fade-up" style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ marginBottom: 20 }}>← Назад к списку</button>
      
      <div className="card" style={{ padding: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{doc.name}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(doc.content || '')}>📋 Скопировать</button>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              const prtContent = document.getElementById(`pdf-view-${doc.id}`);
              const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900');
              WinPrint.document.write(`<html><head><title>${doc.name}</title><style>body{font-family:sans-serif;padding:40px;color:#000;line-height:1.6} table{width:100%;border-collapse:collapse;margin:20px 0} th,td{border:1px solid #333;padding:10px;text-align:left} h1,h2,h3{margin-bottom:10px}</style></head><body>${prtContent.innerHTML}</body></html>`);
              WinPrint.document.close();
              WinPrint.focus();
              WinPrint.setTimeout(() => { WinPrint.print(); WinPrint.close(); }, 250);
            }}>🖨️ Печать</button>
            <button className="btn btn-primary btn-sm" onClick={() => {
              const element = document.getElementById(`pdf-view-${doc.id}`);
              const clone = element.cloneNode(true);
              clone.style.background = '#ffffff';
              clone.style.color = '#000000';
              clone.style.padding = '40px';
              clone.style.borderRadius = '0';
              clone.style.fontSize = '12px';
              clone.style.maxHeight = 'none';
              clone.style.overflow = 'visible';
              const tds = clone.querySelectorAll('th, td');
              tds.forEach(td => td.style.border = '1px solid #ccc');
              const ths = clone.querySelectorAll('th');
              ths.forEach(th => th.style.background = '#f5f5f5');
              const headings = clone.querySelectorAll('h1, h2, h3, h4');
              headings.forEach(h => h.style.color = '#000000');
              
              window.html2pdf().set({
                margin: 10,
                filename: `${doc.name}.pdf`,
                pagebreak: { mode: 'avoid-all' },
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              }).from(clone).save();
            }}>⬇️ Скачать PDF</button>
          </div>
        </div>

        <div id={`pdf-view-${doc.id}`} className="markdown-body" style={{
          background: '#ffffff', color: '#000', borderRadius: 8,
          padding: '40px 50px', fontSize: 13, lineHeight: 1.6,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content || '(нет содержимого)'}</ReactMarkdown>
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

  if (activeModal) {
    return <CreateDocumentView docType={activeModal} onClose={() => setActiveModal(null)} onCreated={() => { fetchDocs(); setActiveModal(null) }} />
  }

  if (viewDoc) {
    return <FullScreenView doc={viewDoc} onClose={() => setViewDoc(null)} />
  }

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

    </div>
  )
}
