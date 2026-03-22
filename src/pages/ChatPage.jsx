import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const HINTS = [
  'Выставить счёт-фактуру',
  'Рассчитать налог УСН',
  'Составить акт',
  'Рассчитать зарплату',
  'Составить договор услуг',
  'Что такое ИНПС?',
]

async function callAI(messages) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

function Message({ msg, index }) {
  const isAi = msg.role === 'ai'
  return (
    <div
      className="fade-up"
      style={{
        display: 'flex',
        gap: 12,
        flexDirection: isAi ? 'row' : 'row-reverse',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: isAi
          ? 'linear-gradient(135deg,#1e3a8a,#4F8EF7)'
          : 'linear-gradient(135deg,#553c9a,#805ad5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>
        {isAi ? '🤖' : '👤'}
      </div>
      <div style={{ maxWidth: '74%' }}>
        <div id={`pdf-chat-${index}`} className={isAi ? "markdown-body" : ""} style={{
          background: isAi ? '#171923' : '#1e2a4a',
          border: `1px solid ${isAi ? '#2D3748' : '#2563eb44'}`,
          borderRadius: isAi ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
          padding: '12px 16px',
          fontSize: 14, lineHeight: 1.75,
          whiteSpace: isAi ? 'normal' : 'pre-wrap',
        }}>
          {isAi ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown> : msg.text}
        </div>
        {isAi && msg.text.length > 200 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigator.clipboard.writeText(msg.text)}
            >📋 Скопировать</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const prtContent = document.getElementById(`pdf-chat-${index}`);
                const WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900');
                WinPrint.document.write(`<html><head><title>Документ</title><style>body{font-family:sans-serif;padding:40px;color:#000;line-height:1.6} table{width:100%;border-collapse:collapse;margin:20px 0} th,td{border:1px solid #333;padding:10px;text-align:left} h1,h2,h3{margin-bottom:10px}</style></head><body>${prtContent.innerHTML}</body></html>`);
                WinPrint.document.close();
                WinPrint.focus();
                WinPrint.setTimeout(() => { WinPrint.print(); WinPrint.close(); }, 250);
              }}
            >🖨️ Скачать PDF / Печать</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage({ initMsg, clearInitMsg }) {
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'Ассалому алейкум! 👋 Я ваш ИИ-бухгалтер для Узбекистана. Помогу с налогами, документами и учётом. Что нас интересует?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (initMsg) {
      setInput(initMsg)
      clearInitMsg?.()
    }
  }, [initMsg])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const send = async (text) => {
    const t = (text || input).trim()
    if (!t) return
    const newMsgs = [...msgs, { role: 'user', text: t }]
    setMsgs(newMsgs)
    setInput('')
    setLoading(true)
    try {
      const reply = await callAI(newMsgs)
      setMsgs(m => [...m, { role: 'ai', text: reply }])
    } catch (e) {
      setMsgs(m => [...m, {
        role: 'ai',
        text: `❌ Ошибка: ${e.message}\n\nПроверьте что переменная GEMINI_API_KEY указана в настройках Vercel.`,
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 0' }}>
        <div className="page-header">
          <h1 className="page-title">💬 ИИ-Бухгалтер</h1>
          <p className="page-subtitle">Задайте любой вопрос или попросите составить документ</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 28px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {msgs.map((m, i) => <Message key={i} msg={m} index={i} />)}

        {loading && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#1e3a8a,#4F8EF7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🤖</div>
            <div style={{
              background: '#171923', border: '1px solid #2D3748',
              borderRadius: '4px 14px 14px 14px',
              padding: '14px 18px',
            }} className="typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '14px 28px 24px',
        borderTop: '1px solid #2D3748',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
          {HINTS.map(h => (
            <button
              key={h}
              className="btn btn-ghost btn-sm"
              style={{ borderRadius: 20 }}
              onClick={() => send(h)}
            >{h}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            placeholder="Напишите вопрос или команду... (Enter — отправить)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{ minWidth: 110, flexShrink: 0 }}
          >
            Отправить ↗
          </button>
        </div>
      </div>
    </div>
  )
}
