import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const fmt = n => Number(n || 0).toLocaleString('ru-RU')

function EmployeeCard({ emp, onDelete, onPayslip }) {
  const initials = emp.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
  return (
    <div className="card fade-up" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1e3a8a,#4F8EF7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, flexShrink: 0,
          }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.name}</div>
            <div style={{ color: '#A0AEC0', fontSize: 13 }}>{emp.position}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className={`badge ${emp.type === 'staff' ? 'badge-blue' : 'badge-yellow'}`}>
            {emp.type === 'staff' ? 'Штат' : 'ГПД'}
          </span>
          <button className="btn-icon" onClick={() => onDelete(emp.id)} style={{ color: '#fc8181' }}>🗑</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { l: 'ПИНФЛ', v: emp.pinfl || '—' },
          { l: 'Дата приёма', v: emp.hire_date || '—' },
          { l: 'Оклад', v: fmt(emp.salary) + ' сум' },
        ].map(item => (
          <div key={item.l} style={{ background: '#0F1117', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 2 }}>{item.l}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.v}</div>
          </div>
        ))}
      </div>

      <button className="btn btn-ghost" onClick={() => onPayslip(emp)} style={{ width: '100%', fontSize: 13 }}>
        📄 Расчётный лист
      </button>
    </div>
  )
}

function AddModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', pinfl: '', position: '', hire_date: '', salary: '', type: 'staff' })
  const [loading, setLoading] = useState(false)

  const save = async () => {
    if (!form.name || !form.salary) return
    setLoading(true)
    const { error } = await supabase.from('employees').insert({
      ...form, salary: parseFloat(form.salary),
    })
    setLoading(false)
    if (!error) { onAdded(); onClose() }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up">
        <div className="modal-header">
          <span className="modal-title">Добавить сотрудника</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { l: 'ФИО *',         k: 'name',      t: 'text' },
            { l: 'ПИНФЛ',         k: 'pinfl',     t: 'text' },
            { l: 'Должность',     k: 'position',  t: 'text' },
            { l: 'Дата приёма',   k: 'hire_date', t: 'date' },
            { l: 'Оклад (сум) *', k: 'salary',    t: 'number' },
          ].map(f => (
            <div key={f.k} className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">{f.l}</label>
              <input className="input" type={f.t} value={form[f.k]}
                onChange={e => setForm(fm => ({ ...fm, [f.k]: e.target.value }))} />
            </div>
          ))}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Тип</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="staff">Штатный</option>
              <option value="gpd">ГПД (договор)</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={loading} style={{ width: '100%', padding: 12, marginTop: 16 }}>
          {loading ? 'Сохранение...' : 'Добавить сотрудника'}
        </button>
      </div>
    </div>
  )
}

function PayslipModal({ emp, onClose }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const month = new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
    const prompt = `Составь расчётный лист за ${month} для:\nФИО: ${emp.name}\nДолжность: ${emp.position}\nОклад: ${Number(emp.salary).toLocaleString('ru-RU')} сум\nРассчитай НДФЛ 12%, ИНПС 4%, соцналог 12%, сумму на руки. Оформи как официальный расчётный лист с разделителями по стандартам РУз.`

    fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', text: prompt }] }),
    })
      .then(r => r.json())
      .then(d => setText(d.text || d.error || 'Ошибка'))
      .catch(e => setText('❌ ' + e.message))
      .finally(() => setLoading(false))
  }, [emp])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <span className="modal-title">📄 Расчётный лист — {emp.name}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }} className="typing"><span /><span /><span /></div>
        ) : (
          <>
            <div id={`pdf-payslip-${emp.id}`} className="markdown-body" style={{
              background: '#0F1117', border: '1px solid #2D3748', borderRadius: 12,
              padding: 20, fontSize: 13, lineHeight: 1.6,
              maxHeight: 400, overflowY: 'auto',
            }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(text)}>📋 Скопировать текст</button>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                const prtContent = document.getElementById(`pdf-payslip-${emp.id}`);
                const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900');
                WinPrint.document.write(`<html><head><title>Расчётный лист - ${emp.name}</title><style>body{font-family:sans-serif;padding:40px;color:#000;line-height:1.6} table{width:100%;border-collapse:collapse;margin:20px 0} th,td{border:1px solid #333;padding:10px;text-align:left} h1,h2,h3{margin-bottom:10px}</style></head><body>${prtContent.innerHTML}</body></html>`);
                WinPrint.document.close();
                WinPrint.focus();
                WinPrint.setTimeout(() => { WinPrint.print(); WinPrint.close(); }, 250);
              }}>🖨️ Печать</button>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                const element = document.getElementById(`pdf-payslip-${emp.id}`);
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
                  pagebreak: { mode: 'avoid-all' },
                  filename: `расчётный_лист_${emp.name}.pdf`,
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                }).from(clone).save();
              }}>⬇️ Скачать PDF</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [payslipEmp, setPayslipEmp] = useState(null)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false })
    setEmployees(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const deleteEmp = async (id) => {
    if (!confirm('Удалить сотрудника?')) return
    await supabase.from('employees').delete().eq('id', id)
    fetch()
  }

  const totalSalary = employees.reduce((s, e) => s + Number(e.salary || 0), 0)

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">👥 Сотрудники</h1>
          <p className="page-subtitle">Управление персоналом и расчётными листами</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Добавить</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Всего сотрудников', val: employees.length, icon: '👥', unit: 'чел.' },
          { label: 'ФОТ (оклады)', val: totalSalary.toLocaleString('ru-RU'), icon: '💰', unit: 'сум' },
          { label: 'Соцналог (12% от ФОТ)', val: (totalSalary * 0.12).toLocaleString('ru-RU'), icon: '📊', unit: 'сум' },
        ].map(s => (
          <div key={s.label} className="stat-card stat-blue fade-up">
            <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 8 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#90cdf4' }}>{s.val}</div>
            <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 4 }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#A0AEC0' }}>Загрузка...</div>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👤</div>
          <h3>Сотрудников нет</h3>
          <p>Добавьте первого сотрудника</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {employees.map(e => (
            <EmployeeCard key={e.id} emp={e} onDelete={deleteEmp} onPayslip={setPayslipEmp} />
          ))}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={fetch} />}
      {payslipEmp && <PayslipModal emp={payslipEmp} onClose={() => setPayslipEmp(null)} />}
    </div>
  )
}
