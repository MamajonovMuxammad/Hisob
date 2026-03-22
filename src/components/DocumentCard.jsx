const fmt = n => Number(n || 0).toLocaleString('ru-RU')

function buildText(doc) {
  let t = `${doc.title}\n`
  if (doc.date) t += `Дата: ${doc.date}\n`
  t += '\n'
  for (const [k, v] of Object.entries(doc.fields || {})) t += `${k}: ${v}\n`
  if (doc.items?.length) {
    t += '\n'
    if (doc.type === 'payroll') {
      t += '№ | ФИО | Должность | Оклад | Дни | Премия | НДФЛ | ИНПС | На руки\n'
      t += '---\n'
      doc.items.forEach(it =>
        t += `${it.num} | ${it.name} | ${it.position} | ${it.salary} | ${it.days} | ${it.bonus || 0} | ${it.ndfl} | ${it.inps} | ${it.net}\n`
      )
      t += '\n'
      if (doc.totalGross) t += `Итого (брутто): ${doc.totalGross} сум\n`
      if (doc.totalTax)   t += `Итого налогов: ${doc.totalTax} сум\n`
      if (doc.totalNet)   t += `Итого (нетто): ${doc.totalNet} сум\n`
    } else {
      t += '№ | Наименование | Ед. | Кол-во | Цена | Сумма\n'
      t += '---\n'
      doc.items.forEach(it =>
        t += `${it.num} | ${it.name} | ${it.unit} | ${it.qty} | ${it.price} | ${it.total}\n`
      )
      t += '\n'
      if (doc.subtotal)   t += `Итого: ${doc.subtotal} сум\n`
      if (doc.vat && doc.vat !== '0') t += `НДС 12%: ${doc.vat} сум\n`
      if (doc.total)      t += `ИТОГО К ОПЛАТЕ: ${doc.total} сум\n`
      if (doc.totalWords) t += `Прописью: ${doc.totalWords}\n`
    }
  }
  if (doc.footer) t += `\n${doc.footer}\n`
  return t
}

export default function DocumentCard({ doc }) {
  const isPayroll = doc.type === 'payroll'
  const hasItems  = doc.items?.length > 0

  const thStyle = {
    padding: '8px 10px', fontSize: 12, color: '#A0AEC0', fontWeight: 600,
    borderBottom: '1px solid #2D3748', textAlign: 'left', whiteSpace: 'nowrap',
    background: '#0d1117',
  }
  const tdStyle = {
    padding: '8px 10px', fontSize: 13, borderBottom: '1px solid #1e2a3a',
    color: '#E2E8F0',
  }

  return (
    <div style={{
      background: '#13151c', border: '1px solid #2D3748',
      borderRadius: 14, padding: 20, width: '100%', maxWidth: 640, color: '#fff',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 14, borderBottom: '1px solid #2D3748', paddingBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#4F8EF7', fontSize: 17 }}>{doc.title}</h3>
        {doc.date && <p style={{ margin: '4px 0 0', color: '#A0AEC0', fontSize: 13 }}>{doc.date}</p>}
      </div>

      {/* Fields */}
      {Object.keys(doc.fields || {}).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {Object.entries(doc.fields).map(([k, v], i, arr) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              borderBottom: i === arr.length - 1 ? 'none' : '1px solid #1e2a3a',
              paddingBottom: 6,
            }}>
              <span style={{ color: '#A0AEC0', fontSize: 13, flex: 1 }}>{k}</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 500, textAlign: 'right', flex: 1 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Items table */}
      {hasItems && (
        <div style={{ overflowX: 'auto', marginBottom: 14, borderRadius: 8, border: '1px solid #2D3748' }}>
          {isPayroll ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr>
                  {['№','ФИО','Должность','Оклад','Дни','Премия','НДФЛ','ИНПС','На руки'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc.items.map((it, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={tdStyle}>{it.num}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{it.name}</td>
                    <td style={{ ...tdStyle, color: '#A0AEC0' }}>{it.position}</td>
                    <td style={tdStyle}>{fmt(it.salary)}</td>
                    <td style={tdStyle}>{it.days}</td>
                    <td style={{ ...tdStyle, color: '#48bb78' }}>{fmt(it.bonus || 0)}</td>
                    <td style={{ ...tdStyle, color: '#fc8181' }}>{fmt(it.ndfl)}</td>
                    <td style={{ ...tdStyle, color: '#f6ad55' }}>{fmt(it.inps)}</td>
                    <td style={{ ...tdStyle, color: '#48bb78', fontWeight: 700 }}>{fmt(it.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
              <thead>
                <tr>
                  {['№','Наименование','Ед.', 'Кол-во','Цена','Сумма'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doc.items.map((it, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ ...tdStyle, color: '#A0AEC0' }}>{it.num}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{it.name}</td>
                    <td style={{ ...tdStyle, color: '#A0AEC0' }}>{it.unit}</td>
                    <td style={tdStyle}>{it.qty}</td>
                    <td style={tdStyle}>{fmt(it.price)}</td>
                    <td style={{ ...tdStyle, color: '#90cdf4', fontWeight: 600 }}>{fmt(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {isPayroll ? (
          <>
            {doc.totalGross && <TotalRow label="Итого начислено (брутто)" val={`${fmt(doc.totalGross)} сум`} />}
            {doc.totalTax   && <TotalRow label="Итого налогов (НДФЛ+ИНПС)" val={`${fmt(doc.totalTax)} сум`} color="#fc8181" />}
            {doc.totalNet   && <TotalRow label="💰 Итого к выплате (нетто)" val={`${fmt(doc.totalNet)} сум`} bold color="#48bb78" />}
          </>
        ) : hasItems && (
          <>
            {doc.subtotal && <TotalRow label="Итого" val={`${fmt(doc.subtotal)} сум`} />}
            {doc.vat && doc.vat !== '0' && <TotalRow label="НДС 12%" val={`${fmt(doc.vat)} сум`} color="#f6ad55" />}
            {doc.total && <TotalRow label="💰 ИТОГО К ОПЛАТЕ" val={`${fmt(doc.total)} сум`} bold color="#4F8EF7" />}
            {doc.totalWords && (
              <div style={{ fontSize: 12, color: '#A0AEC0', fontStyle: 'italic', paddingLeft: 4 }}>
                Прописью: {doc.totalWords}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {doc.footer && (
        <div style={{ color: '#A0AEC0', fontSize: 12, fontStyle: 'italic', borderTop: '1px solid #2D3748', paddingTop: 10, marginBottom: 14 }}>
          {doc.footer}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => {
          const blob = new Blob([buildText(doc)], { type: 'text/plain;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = `${doc.type}_${Date.now()}.txt`; a.click()
          URL.revokeObjectURL(url)
        }} style={{
          background: '#4F8EF7', color: '#fff', border: 'none', padding: '8px 16px',
          borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
        }}>⬇️ Скачать .txt</button>
        <button onClick={() => navigator.clipboard.writeText(buildText(doc))} style={{
          background: 'transparent', color: '#4F8EF7', border: '1px solid #4F8EF7',
          padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
        }}>📋 Копировать</button>
      </div>
    </div>
  )
}

function TotalRow({ label, val, bold, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 4px' }}>
      <span style={{ color: '#A0AEC0', fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 800 : 600, color: color || '#fff' }}>{val}</span>
    </div>
  )
}
