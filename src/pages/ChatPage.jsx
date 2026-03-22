import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '../lib/supabase'

const DEFAULT_MSG = { role: 'ai', text: 'Ассалому алейкум! 👋 Я ваш ИИ-бухгалтер для Узбекистана. Помогу с налогами, документами и учётом. Что вас интересует?' }

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
            >🖨️ Печать</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const element = document.getElementById(`pdf-chat-${index}`);
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
                  filename: `чат_hisob_ai.pdf`,
                  pagebreak: { mode: 'avoid-all' },
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                }).from(clone).save();
              }}
            >⬇️ Скачать PDF</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage({ initMsg, clearInitMsg }) {
  const [msgs, setMsgs] = useState([DEFAULT_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Chat History States
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const endRef = useRef(null)

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    const { data } = await supabase.from('chats').select('id, title').order('updated_at', { ascending: false })
    if (data) setChats(data)
  }

  const loadChat = async (id) => {
    const { data } = await supabase.from('chats').select('messages').eq('id', id).single()
    if (data) {
      setMsgs(data.messages)
      setActiveChatId(id)
    }
  }

  const newChat = () => {
    setMsgs([DEFAULT_MSG])
    setActiveChatId(null)
  }

  const deleteChat = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Удалить этот чат?')) return
    await supabase.from('chats').delete().eq('id', id)
    if (activeChatId === id) newChat()
    fetchChats()
  }

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

    // DB update
    let chatId = activeChatId
    if (!chatId) {
      const title = t.slice(0, 30) + (t.length > 30 ? '...' : '')
      const { data } = await supabase.from('chats').insert({ title, messages: newMsgs }).select('id').single()
      if (data) {
        chatId = data.id
        setActiveChatId(chatId)
        fetchChats()
      }
    } else {
      await supabase.from('chats').update({ messages: newMsgs, updated_at: new Date() }).eq('id', chatId)
    }

    try {
      const reply = await callAI(newMsgs)
      const finalMsgs = [...newMsgs, { role: 'ai', text: reply }]
      setMsgs(finalMsgs)
      if (chatId) await supabase.from('chats').update({ messages: finalMsgs }).eq('id', chatId)
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
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{
          width: 260, background: '#0F1117', borderRight: '1px solid #2D3748',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 16 }}>
            <button className="btn btn-primary" onClick={newChat} style={{ width: '100%' }}>
              + Новый диалог
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>История чатов</div>
            {chats.map(c => (
              <div
                key={c.id}
                onClick={() => loadChat(c.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 6,
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: c.id === activeChatId ? '#1e2a4a' : 'transparent',
                  color: c.id === activeChatId ? '#fff' : '#A0AEC0',
                  border: `1px solid ${c.id === activeChatId ? '#2563eb44' : 'transparent'}`
                }}
              >
                <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  💬 {c.title}
                </div>
                <button 
                  onClick={(e) => deleteChat(c.id, e)}
                  style={{ background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', opacity: c.id === activeChatId ? 1 : 0.4 }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#13151c' }}>
      
      {/* Header */}
      <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '◀' : '▶'}
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title" style={{ fontSize: 20 }}>💬 ИИ-Бухгалтер</h1>
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
      <div style={{ padding: '14px 28px 24px', borderTop: '1px solid #2D3748' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
          {HINTS.map(h => (
            <button key={h} className="btn btn-ghost btn-sm" style={{ borderRadius: 20 }} onClick={() => send(h)}>{h}</button>
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
          <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()} style={{ minWidth: 110, flexShrink: 0 }}>
            Отправить ↗
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
