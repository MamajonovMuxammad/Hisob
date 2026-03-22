import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from '../components/Toast'

const UNITS_GOODS = ['шт', 'кг', 'г', 'т', 'л', 'мл', 'м', 'м²', 'м³', 'уп', 'компл', 'пара', 'рулон', 'лист', 'услуга']
const UNITS_WORK  = ['час', 'день', 'месяц', 'шт', 'услуга', 'работа', 'м²', 'м']

const VAT_OPTIONS = [
  { label: 'Без НДС', rate: 0 },
  { label: 'НДС 12%', rate: 0.12 },
]

const fmt = n => Number(n || 0).toLocaleString('ru-RU')
const newItem = () => ({ id: Date.now() + Math.random(), name: '', qty: '1', unit: 'шт', price: '' })
const newWork  = () => ({ id: Date.now() + Math.random(), name: '', unit: 'услуга', qty: '1', price: '' })

// ─────────────────── ITEMS TABLE component ───────────────────
function ItemsTable({ items, setItems, units, mode = 'goods' }) {
  const thStyle = {
    padding: '8px 8px', fontSize: 11, color: '#A0AEC0', fontWeight: 600,
    borderBottom: '1px solid #2D3748', textAlign: 'left', whiteSpace: 'nowrap',
    background: '#0d1117',
  }
  const inpStyle = {
    background: '#1a2133', border: '1px solid #2D3748', borderRadius: 6,
    padding: '5px 8px', color: '#fff', fontSize: 13, width: '100%',
    fontFamily: 'inherit', outline: 'none',
  }

  const update = (id, field, val) =>
    setItems(its => its.map(it => it.id === id ? { ...it, [field]: val } : it))

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #2D3748', borderRadius: 10, marginBottom: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 36 }}>№</th>
            <th style={{ ...thStyle }}>Наименование</th>
            {mode === 'goods' ? (
              <>
                <th style={{ ...thStyle, width: 90 }}>Кол-во</th>
                <th style={{ ...thStyle, width: 90 }}>Ед.изм</th>
                <th style={{ ...thStyle, width: 110 }}>Цена</th>
              </>
            ) : (
              <>
                <th style={{ ...thStyle, width: 90 }}>Ед.изм</th>
                <th style={{ ...thStyle, width: 90 }}>Кол-во</th>
                <th style={{ ...thStyle, width: 110 }}>Цена</th>
              </>
            )}
            <th style={{ ...thStyle, width: 110 }}>Сумма</th>
            <th style={{ ...thStyle, width: 36 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const total = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)
            return (
              <tr key={it.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '6px 8px', color: '#4A5568', fontSize: 12 }}>{i + 1}</td>
                <td style={{ padding: '6px 8px' }}>
                  <input style={inpStyle} placeholder="Наименование" value={it.name}
                    onChange={e => update(it.id, 'name', e.target.value)} />
                </td>
                {mode === 'goods' ? (
                  <>
                    <td style={{ padding: '6px 8px' }}>
                      <input style={inpStyle} type="number" min="0" placeholder="1" value={it.qty}
                        onChange={e => update(it.id, 'qty', e.target.value)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <select style={inpStyle} value={it.unit} onChange={e => update(it.id, 'unit', e.target.value)}>
                        {units.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '6px 8px' }}>
                      <select style={inpStyle} value={it.unit} onChange={e => update(it.id, 'unit', e.target.value)}>
                        {units.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input style={inpStyle} type="number" min="0" placeholder="1" value={it.qty}
                        onChange={e => update(it.id, 'qty', e.target.value)} />
                    </td>
                  </>
                )}
                <td style={{ padding: '6px 8px' }}>
                  <input style={inpStyle} type="number" min="0" placeholder="0" value={it.price}
                    onChange={e => update(it.id, 'price', e.target.value)} />
                </td>
                <td style={{ padding: '6px 8px', color: '#90cdf4', fontWeight: 600, fontSize: 13 }}>
                  {fmt(total)}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  {items.length > 1 && (
                    <button onClick={() => setItems(its => its.filter(x => x.id !== it.id))}
                      style={{ background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────── Счёт-фактура form ───────────────────
function InvoiceForm({ onGenerate, loading, settings }) {
  const [form, setForm] = useState({
    buyer: '', inn: '', address: '', bank: '',
    number: 'СФ-001', date: new Date().toISOString().slice(0, 10),
    vat: 0,
  })
  const [items, setItems] = useState([newItem()])

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0)
  const vat = subtotal * form.vat
  const total = subtotal + vat

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const inp = (label, key, ph) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="label">{label}</label>
      <input className="input" placeholder={ph || label} value={form[key]} onChange={e => f(key, e.target.value)} />
    </div>
  )

  const handleGenerate = () => {
    const itemsData = items.map((it, i) => ({
      num: i + 1, name: it.name,
      qty: it.qty, unit: it.unit, price: it.price,
      total: String((parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)),
    }))
    onGenerate({
      docType: 'invoice',
      fields: {
        Поставщик: settings.company || '___', 'ИНН поставщика': settings.inn || '___',
        Покупатель: form.buyer, 'ИНН покупателя': form.inn,
        'р/с, Банк': form.bank, 'Номер': form.number, 'Дата': form.date,
      },
      items: itemsData,
      subtotal: String(subtotal),
      vat: String(Math.round(vat)),
      total: String(Math.round(total)),
    })
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 16 }}>
        {inp('Номер', 'number', 'СФ-001')}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">Дата</label>
          <input className="input" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
        </div>
        {inp('Покупатель (организация/ФИО)', 'buyer')}
        {inp('ИНН покупателя', 'inn')}
        {inp('Адрес покупателя', 'address')}
        {inp('Банк и р/с покупателя', 'bank')}
      </div>

      <p style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Товары / услуги</p>
      <ItemsTable items={items} setItems={setItems} units={UNITS_GOODS} mode="goods" />
      <button onClick={() => setItems(its => [...its, newItem()])} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        + Добавить строку
      </button>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">НДС</label>
          <select className="input" style={{ width: 'auto' }} value={form.vat} onChange={e => f('vat', parseFloat(e.target.value))}>
            {VAT_OPTIONS.map(v => <option key={v.label} value={v.rate}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'space-between' }}>
            <span style={{ color: '#A0AEC0', fontSize: 13 }}>Итого:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{fmt(subtotal)} сум</span>
          </div>
          {vat > 0 && (
            <div style={{ display: 'flex', gap: 40, justifyContent: 'space-between' }}>
              <span style={{ color: '#A0AEC0', fontSize: 13 }}>НДС 12%:</span>
              <span style={{ color: '#f6ad55', fontWeight: 600 }}>{fmt(Math.round(vat))} сум</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'space-between' }}>
            <span style={{ color: '#4F8EF7', fontSize: 14, fontWeight: 700 }}>ИТОГО:</span>
            <span style={{ color: '#4F8EF7', fontWeight: 800, fontSize: 15 }}>{fmt(Math.round(total))} сум</span>
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ width: '100%', padding: 12 }}>
        {loading ? 'Генерация...' : '✨ Сгенерировать через ИИ'}
      </button>
    </div>
  )
}

// ─────────────────── Накладная form ───────────────────
function WaybillForm({ onGenerate, loading, settings }) {
  const [form, setForm] = useState({
    receiver: '', inn: '', address: '', driver: '',
    number: 'НК-001', date: new Date().toISOString().slice(0, 10),
    vat: 0,
  })
  const [items, setItems] = useState([newItem()])

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0)
  const vat = subtotal * form.vat
  const total = subtotal + vat

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleGenerate = () => {
    const itemsData = items.map((it, i) => ({
      num: i + 1, name: it.name, qty: it.qty, unit: it.unit, price: it.price,
      total: String((parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)),
    }))
    onGenerate({
      docType: 'waybill',
      fields: {
        Поставщик: settings.company || '___', 'ИНН поставщика': settings.inn || '___',
        Получатель: form.receiver, 'ИНН получателя': form.inn,
        'Адрес доставки': form.address, 'Водитель/Автомобиль': form.driver,
        'Номер': form.number, 'Дата': form.date,
      },
      items: itemsData,
      subtotal: String(subtotal),
      vat: String(Math.round(vat)),
      total: String(Math.round(total)),
    })
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          ['Номер', 'number', 'НК-001'],
          ['Получатель', 'receiver'],
          ['ИНН получателя', 'inn'],
          ['Адрес доставки', 'address'],
          ['Водитель/Автомобиль', 'driver'],
        ].map(([label, key, ph]) => (
          <div key={key} className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">{label}</label>
            <input className="input" placeholder={ph || label} value={form[key]} onChange={e => f(key, e.target.value)} />
          </div>
        ))}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">Дата</label>
          <input className="input" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Товары</p>
      <ItemsTable items={items} setItems={setItems} units={UNITS_GOODS} mode="goods" />
      <button onClick={() => setItems(its => [...its, newItem()])} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        + Добавить строку
      </button>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">НДС</label>
          <select className="input" style={{ width: 'auto' }} value={form.vat} onChange={e => f('vat', parseFloat(e.target.value))}>
            {VAT_OPTIONS.map(v => <option key={v.label} value={v.rate}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {vat > 0 && <div style={{ display: 'flex', gap: 40 }}><span style={{ color: '#A0AEC0', fontSize: 13 }}>НДС:</span><span style={{ color: '#f6ad55' }}>{fmt(Math.round(vat))} сум</span></div>}
          <div style={{ display: 'flex', gap: 40 }}><span style={{ color: '#4F8EF7', fontWeight: 700 }}>ИТОГО:</span><span style={{ color: '#4F8EF7', fontWeight: 800, fontSize: 15 }}>{fmt(Math.round(total))} сум</span></div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ width: '100%', padding: 12 }}>
        {loading ? 'Генерация...' : '✨ Сгенерировать через ИИ'}
      </button>
    </div>
  )
}

// ─────────────────── Акт form ───────────────────
function ActForm({ onGenerate, loading, settings }) {
  const [form, setForm] = useState({
    client: '', inn: '', address: '', bank: '',
    number: 'АВР-001', date: new Date().toISOString().slice(0, 10),
    vat: 0,
  })
  const [items, setItems] = useState([newWork()])

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0)
  const vat = subtotal * form.vat
  const total = subtotal + vat

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleGenerate = () => {
    const itemsData = items.map((it, i) => ({
      num: i + 1, name: it.name, unit: it.unit, qty: it.qty, price: it.price,
      total: String((parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)),
    }))
    onGenerate({
      docType: 'act',
      fields: {
        Исполнитель: settings.company || '___', 'ИНН исполнителя': settings.inn || '___',
        'Директор исполнителя': settings.director || '___',
        Заказчик: form.client, 'ИНН заказчика': form.inn,
        'Адрес заказчика': form.address, 'р/с, Банк': form.bank,
        'Номер': form.number, 'Дата': form.date,
      },
      items: itemsData,
      subtotal: String(subtotal),
      vat: String(Math.round(vat)),
      total: String(Math.round(total)),
    })
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          ['Номер', 'number', 'АВР-001'],
          ['Заказчик (организация/ФИО)', 'client'],
          ['ИНН заказчика', 'inn'],
          ['Адрес заказчика', 'address'],
          ['Банк и р/с заказчика', 'bank'],
        ].map(([label, key, ph]) => (
          <div key={key} className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">{label}</label>
            <input className="input" placeholder={ph || label} value={form[key]} onChange={e => f(key, e.target.value)} />
          </div>
        ))}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">Дата</label>
          <input className="input" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Выполненные работы / услуги</p>
      <ItemsTable items={items} setItems={setItems} units={UNITS_WORK} mode="work" />
      <button onClick={() => setItems(its => [...its, newWork()])} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        + Добавить строку
      </button>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">НДС</label>
          <select className="input" style={{ width: 'auto' }} value={form.vat} onChange={e => f('vat', parseFloat(e.target.value))}>
            {VAT_OPTIONS.map(v => <option key={v.label} value={v.rate}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {vat > 0 && <div style={{ display: 'flex', gap: 40 }}><span style={{ color: '#A0AEC0', fontSize: 13 }}>НДС:</span><span style={{ color: '#f6ad55' }}>{fmt(Math.round(vat))} сум</span></div>}
          <div style={{ display: 'flex', gap: 40 }}><span style={{ color: '#4F8EF7', fontWeight: 700 }}>ИТОГО:</span><span style={{ color: '#4F8EF7', fontWeight: 800, fontSize: 15 }}>{fmt(Math.round(total))} сум</span></div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ width: '100%', padding: 12 }}>
        {loading ? 'Генерация...' : '✨ Сгенерировать через ИИ'}
      </button>
    </div>
  )
}

// ─────────────────── Simple field form (Договор, Расчётный лист) ───────────────────
function SimpleForm({ docType, onGenerate, loading }) {
  const [form, setForm] = useState({})

  const handleGenerate = () => {
    onGenerate({ docType: docType.key, fields: form })
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
        {docType.fields.map(f => (
          <div key={f} className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">{f}</label>
            <input className="input" placeholder={f} value={form[f] || ''} onChange={e => setForm(fm => ({ ...fm, [f]: e.target.value }))} />
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ width: '100%', padding: 12 }}>
        {loading ? 'Генерация...' : '✨ Сгенерировать через ИИ'}
      </button>
    </div>
  )
}

// ─────────────────── Generate via AI ───────────────────
async function callAI(payload, settings) {
  const company = settings?.company || 'Ваша компания'
  const inn = settings?.inn || '—'
  const director = settings?.director || '—'

  let prompt
  if (payload.items) {
    prompt = `Создай документ "${payload.docType}" для компании "${company}" (ИНН: ${inn}, Директор: ${director}).
Реквизиты: ${JSON.stringify(payload.fields)}
Позиции: ${JSON.stringify(payload.items)}
Итого: ${payload.subtotal} сум, НДС: ${payload.vat} сум, ИТОГО: ${payload.total} сум.
Верни строго в формате [DOCUMENT]...[/DOCUMENT] с полным JSON включая поле items.`
  } else {
    prompt = `Создай документ "${payload.docType}" для компании "${company}" (ИНН: ${inn}, Директор: ${director}).
Данные: ${JSON.stringify(payload.fields)}
Верни строго в формате [DOCUMENT]...[/DOCUMENT] с валидным JSON.`
  }

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', text: prompt }] }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

function parseDoc(text) {
  const m = text.match(/\[DOCUMENT\]([\s\S]*?)\[\/DOCUMENT\]/)
  if (m) {
    try { return { type: 'document', data: JSON.parse(m[1].trim()) } } catch {}
  }
  return { type: 'text', data: text }
}

// ─────────────────── CreateDocumentView ───────────────────
import DocumentCard from '../components/DocumentCard'

const DOC_TYPES = [
  { icon: '📄', key: 'invoice',  label: 'Счёт-фактура',          hasItems: true,  itemMode: 'invoice' },
  { icon: '✅', key: 'act',      label: 'Акт выполненных работ',  hasItems: true,  itemMode: 'act'     },
  { icon: '📦', key: 'waybill',  label: 'Накладная',              hasItems: true,  itemMode: 'waybill' },
  { icon: '📝', key: 'contract', label: 'Договор услуг',          hasItems: false,
    fields: ['Номер договора', 'Заказчик', 'ИНН заказчика', 'Адрес заказчика', 'р/с, Банк, МФО заказчика', 'Предмет договора', 'Сумма (сум)', 'Срок (дней)'] },
  { icon: '💵', key: 'payslip',  label: 'Расчётный лист',         hasItems: false,
    fields: ['ФИО сотрудника', 'ПИНФЛ', 'Должность', 'Оклад (сум)', 'Премия (сум)', 'Отработано дней', 'Месяц/год'] },
]

function CreateDocumentView({ docType, onClose, onCreated }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState({})

  useEffect(() => {
    supabase.from('settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data)
    })
  }, [])

  const handleGenerate = async (payload) => {
    setLoading(true); setError(''); setPreview(null)
    try {
      const raw = await callAI(payload, settings)
      const parsed = parseDoc(raw)

      if (parsed.type === 'document') {
        setPreview(parsed.data)
        const amount = parseFloat(parsed.data.total || parsed.data.subtotal || 0)
        const name = parsed.data.title || docType.label
        await supabase.from('documents').insert({
          type: docType.label, name, amount,
          content: raw, date: new Date().toISOString().slice(0, 10),
        })
        toast('Документ сохранён ✓')
        onCreated?.()
      } else {
        setError('ИИ не вернул документ в нужном формате. Попробуйте ещё раз.')
        toast('Ошибка формата ✗', 'error')
      }
    } catch (e) {
      setError(e.message)
      toast('Ошибка генерации ✗', 'error')
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
        {docType.itemMode === 'invoice' && <InvoiceForm onGenerate={handleGenerate} loading={loading} settings={settings} />}
        {docType.itemMode === 'waybill' && <WaybillForm onGenerate={handleGenerate} loading={loading} settings={settings} />}
        {docType.itemMode === 'act'     && <ActForm     onGenerate={handleGenerate} loading={loading} settings={settings} />}
        {!docType.hasItems              && <SimpleForm  docType={docType} onGenerate={handleGenerate} loading={loading} />}
      </div>

      {error && <div className="alert alert-warning" style={{ marginBottom: 24 }}>❌ {error}</div>}

      {preview && (
        <div className="card fade-up" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📄 Предпросмотр</h3>
          <DocumentCard doc={preview} />
        </div>
      )}
    </div>
  )
}

// ─────────────────── FullScreenView ───────────────────
function FullScreenView({ doc, onClose }) {
  const parsed = (() => {
    if (!doc.content) return null
    const m = doc.content.match(/\[DOCUMENT\]([\s\S]*?)\[\/DOCUMENT\]/)
    if (m) { try { return JSON.parse(m[1].trim()) } catch {} }
    return null
  })()

  return (
    <div className="fade-up" style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ marginBottom: 20 }}>← Назад к списку</button>
      <div className="card" style={{ padding: 30 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{doc.name}</h3>
        {parsed ? (
          <DocumentCard doc={parsed} />
        ) : (
          <div id={`pdf-view-${doc.id}`} className="markdown-body" style={{
            background: '#fff', color: '#000', borderRadius: 8, padding: '40px 50px', fontSize: 13,
          }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content || '(нет содержимого)'}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────── Main DocumentsPage ───────────────────
export default function DocumentsPage() {
  const toast = useToast()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const [filterType, setFilterType] = useState('all')

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
    toast('Документ удалён')
    fetchDocs()
  }

  const filteredDocs = filterType === 'all' ? docs : docs.filter(d => d.type === filterType)
  const docTypeLabels = [...new Set(docs.map(d => d.type))].filter(Boolean)

  if (activeModal) {
    return <CreateDocumentView docType={activeModal} onClose={() => setActiveModal(null)} onCreated={() => { fetchDocs() }} />
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

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        {/* Left: create */}
        <div>
          <p style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Создать документ</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DOC_TYPES.map(t => (
              <button key={t.key} onClick={() => setActiveModal(t)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', background: '#171923', border: '1px solid #2D3748',
                borderRadius: 12, cursor: 'pointer', color: '#fff', textAlign: 'left',
                fontFamily: 'inherit', transition: 'all .2s', width: '100%',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#4F8EF7'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2D3748'}
              >
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>
                    {t.hasItems ? 'Таблица товаров/услуг' : 'Через ИИ'}
                  </div>
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
            <div style={{ display: 'flex', gap: 6 }}>
              <select className="input" style={{ height: 32, padding: '0 10px', width: 'auto', fontSize: 13 }}
                value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">Все типы</option>
                {docTypeLabels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={fetchDocs}>🔄</button>
            </div>
          </div>

          <div className="card table-wrap">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#A0AEC0' }}>Загрузка...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📂</div>
                <h3>Документов нет</h3>
                <p>Создайте первый документ слева</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Тип</th><th>Название</th><th>Дата</th><th>Сумма</th><th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map(d => (
                    <tr key={d.id}>
                      <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{d.type}</span></td>
                      <td style={{ color: '#E2E8F0', maxWidth: 240 }}>{d.name}</td>
                      <td style={{ color: '#A0AEC0', fontSize: 13 }}>{d.date}</td>
                      <td style={{ color: '#48bb78', fontWeight: 600 }}>{Number(d.amount || 0).toLocaleString('ru-RU')}</td>
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
