import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '../lib/supabase'
import DocumentCard from '../components/DocumentCard'
import { useToast } from '../components/Toast'

const DEFAULT_MSG = {
  role: 'ai',
  text: 'Ассалому алейкум! 👋 Я ваш ИИ-бухгалтер для Узбекистана.\nПомогу с налогами, документами и учётом.\n\n💡 **Новое:** Вы можете прикрепить скриншот или документ — я его проанализирую!',
}

const HINTS = [
  '📄 Выставить счёт',
  '✅ Составить акт',
  '🧮 Рассчитать налог',
  '💼 Рассчитать зарплату',
  '📝 Составить договор',
]

const ALLOWED_MIME = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// ─── File → base64 ───
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Parse AI response ───
function parseAIResponse(text) {
  const result = { type: 'text', data: text, actions: [], plainText: text }

  // Parse document
  const docMatch = text.match(/\[DOCUMENT\]([\s\S]*?)\[\/DOCUMENT\]/)
  if (docMatch) {
    try {
      result.type = 'document'
      result.data = JSON.parse(docMatch[1].trim())
    } catch {}
  }

  // Parse action buttons
  const actMatch = text.match(/\[ACTIONS\]([\s\S]*?)\[\/ACTIONS\]/)
  if (actMatch) {
    try { result.actions = JSON.parse(actMatch[1].trim()) } catch {}
  }

  // Clean text
  result.plainText = text
    .replace(/\[DOCUMENT\][\s\S]*?\[\/DOCUMENT\]/g, '')
    .replace(/\[ACTIONS\][\s\S]*?\[\/ACTIONS\]/g, '')
    .trim()

  return result
}

// ─── File Preview chip ───
function FileChip({ file, onRemove, compact }) {
  const isImage = file.type.startsWith('image/')
  const [thumb, setThumb] = useState(null)

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file)
      setThumb(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file, isImage])

  if (compact) {
    // In message bubble
    return isImage && thumb ? (
      <img src={thumb} alt={file.name}
        style={{ maxWidth: 240, maxHeight: 160, borderRadius: 8, objectFit: 'cover', display: 'block' }} />
    ) : (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px',
        fontSize: 13,
      }}>
        {file.type === 'application/pdf' ? '📄' : '📝'} {file.name}
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6,
      background: '#1a2133', border: '1px solid #2D3748', borderRadius: 10,
      padding: isImage ? 4 : '6px 10px', overflow: 'hidden',
    }}>
      {isImage && thumb ? (
        <img src={thumb} alt={file.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 7 }} />
      ) : (
        <>
          <span style={{ fontSize: 22 }}>{file.type === 'application/pdf' ? '📄' : '📝'}</span>
          <span style={{ fontSize: 12, color: '#E2E8F0', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </span>
        </>
      )}
      {onRemove && (
        <button onClick={onRemove} style={{
          position: 'absolute', top: -4, right: -4,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fc8181', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 11, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700,
        }}>✕</button>
      )}
    </div>
  )
}

// ─── Single Message bubble ───
function Message({ msg, onAction }) {
  const isAi = msg.role === 'ai'
  const parsed = isAi ? parseAIResponse(msg.text) : { type: 'text', plainText: msg.text, actions: [] }
  const ref = useRef(null)

  return (
    <div className="fade-up" style={{
      display: 'flex', gap: 10,
      flexDirection: isAi ? 'row' : 'row-reverse',
      maxWidth: '100%',
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: isAi
          ? 'linear-gradient(135deg,#1e3a8a,#4F8EF7)'
          : 'linear-gradient(135deg,#553c9a,#805ad5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
      }}>
        {isAi ? '🤖' : '👤'}
      </div>

      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* File previews in message */}
        {msg.files?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {msg.files.map((f, i) => <FileChip key={i} file={f} compact />)}
          </div>
        )}

        {/* Bubble */}
        {(parsed.plainText || parsed.type === 'document') && (
          <div ref={ref} style={{
            background: isAi ? '#171923' : 'linear-gradient(135deg,#1e3a8a,#2563eb)',
            border: `1px solid ${isAi ? '#2D3748' : 'transparent'}`,
            borderRadius: isAi ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
            padding: '12px 16px',
          }}>
            {parsed.type === 'document' && <DocumentCard doc={parsed.data} />}

            {parsed.plainText && (
              <div className="markdown-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.plainText}</ReactMarkdown>
              </div>
            )}

            {/* Download PDF (AI messages only) */}
            {isAi && parsed.plainText && (
              <div style={{ marginTop: 8 }}>
                <button onClick={() => {
                  import('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
                    .catch(() => {})
                  const el = ref.current?.querySelector('.markdown-body')
                  if (!el || !window.html2pdf) return
                  const clone = el.cloneNode(true)
                  clone.style.cssText = 'background:#fff;color:#000;padding:40px;font-size:12px;'
                  window.html2pdf().set({
                    margin: 10, filename: 'hisob_ai.pdf',
                    html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' }
                  }).from(clone).save()
                }} style={{
                  background: 'none', border: '1px solid #2D3748', borderRadius: 6,
                  color: '#A0AEC0', cursor: 'pointer', fontSize: 11, padding: '3px 8px',
                  fontFamily: 'inherit',
                }}>⬇️ PDF</button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {parsed.actions?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 2 }}>
            {parsed.actions.map((action, i) => (
              <button key={i} onClick={() => onAction(action)} style={{
                background: '#172040', border: '1px solid #2563eb55',
                borderRadius: 20, padding: '6px 14px', color: '#90cdf4',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1e3a8a'; e.currentTarget.style.borderColor = '#4F8EF7' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#172040'; e.currentTarget.style.borderColor = '#2563eb55' }}
              >
                ▶ {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ChatPage ───
export default function ChatPage({ initMsg, clearInitMsg }) {
  const toast = useToast()
  const [msgs, setMsgs] = useState([DEFAULT_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)

  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const endRef = useRef(null)
  const fileRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { fetchChats() }, [])

  const fetchChats = async () => {
    const { data } = await supabase.from('chats').select('id, title').order('updated_at', { ascending: false })
    if (data) setChats(data)
  }

  const loadChat = async (id) => {
    const { data } = await supabase.from('chats').select('messages').eq('id', id).single()
    if (data) { setMsgs(data.messages); setActiveChatId(id) }
  }

  const newChat = () => { setMsgs([DEFAULT_MSG]); setActiveChatId(null); setAttachedFiles([]) }

  const deleteChat = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Удалить этот чат?')) return
    await supabase.from('chats').delete().eq('id', id)
    if (activeChatId === id) newChat()
    fetchChats()
  }

  useEffect(() => {
    if (initMsg) { setInput(initMsg); clearInitMsg?.() }
  }, [initMsg])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  // ─── File handling ───
  const validateAndAddFiles = useCallback((newFiles) => {
    const fileArr = Array.from(newFiles)
    const errors = []
    const valid = []

    for (const f of fileArr) {
      if (f.size > MAX_FILE_SIZE) {
        errors.push(`"${f.name}" слишком большой. Максимум 10MB`)
        continue
      }
      if (!ALLOWED_MIME.includes(f.type)) {
        errors.push(`"${f.name}" — неподдерживаемый формат. Используйте: jpg, png, gif, webp, pdf, txt`)
        continue
      }
      valid.push(f)
    }

    errors.forEach(e => toast(e, 'error'))

    setAttachedFiles(prev => {
      const merged = [...prev, ...valid]
      if (merged.length > 3) {
        toast('Максимум 3 файла за раз', 'error')
        return merged.slice(0, 3)
      }
      return merged
    })
  }, [toast])

  const removeFile = (i) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))

  // ─── Drag & Drop ───
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e) => {
    e.preventDefault(); setIsDragging(false)
    validateAndAddFiles(e.dataTransfer.files)
  }

  // ─── Send message ───
  const send = async (text) => {
    const t = (text || input).trim()
    if (!t && attachedFiles.length === 0) return

    // Encode files
    let filesPayload = []
    let filesForMsg = [...attachedFiles]
    if (attachedFiles.length > 0) {
      try {
        filesPayload = await Promise.all(
          attachedFiles.map(async f => ({
            base64: await fileToBase64(f),
            mime_type: f.type,
          }))
        )
      } catch {
        toast('Ошибка чтения файла', 'error'); return
      }
    }

    const userText = t || '(файл)'
    const newMsgs = [...msgs, { role: 'user', text: userText, files: filesForMsg }]
    setMsgs(newMsgs)
    setInput('')
    setAttachedFiles([])
    setLoading(true)

    // Save to DB (without file blob in messages)
    const msgsForDb = newMsgs.map(m => ({ role: m.role, text: m.text }))

    let chatId = activeChatId
    if (!chatId) {
      const title = (userText).slice(0, 30) + (userText.length > 30 ? '...' : '')
      const { data } = await supabase.from('chats').insert({ title, messages: msgsForDb }).select('id').single()
      if (data) { chatId = data.id; setActiveChatId(chatId); fetchChats() }
    } else {
      await supabase.from('chats').update({ messages: msgsForDb, updated_at: new Date() }).eq('id', chatId)
    }

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, text: m.text })),
          files: filesPayload,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const finalMsgs = [...newMsgs, { role: 'ai', text: data.text }]
      setMsgs(finalMsgs)
      const finalForDb = finalMsgs.map(m => ({ role: m.role, text: m.text }))
      if (chatId) await supabase.from('chats').update({ messages: finalForDb }).eq('id', chatId)
    } catch (e) {
      toast('Ошибка соединения ✗', 'error')
      setMsgs(m => [...m, {
        role: 'ai',
        text: `❌ Ошибка: ${e.message}\n\nПроверьте что переменная GEMINI_API_KEY указана в настройках Vercel.`,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (action) => {
    setInput(action)
    inputRef.current?.focus()
    // Auto-send after brief delay
    setTimeout(() => send(action), 100)
  }

  const canSend = !loading && (input.trim().length > 0 || attachedFiles.length > 0)

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>

      {/* Chat history sidebar */}
      {sidebarOpen && (
        <div style={{
          width: 256, background: '#0F1117', borderRight: '1px solid #2D3748',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{ padding: 14 }}>
            <button className="btn btn-primary" onClick={newChat} style={{ width: '100%' }}>
              + Новый диалог
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
              История
            </div>
            {chats.map(c => (
              <div key={c.id} onClick={() => loadChat(c.id)} style={{
                padding: '9px 10px', borderRadius: 8, marginBottom: 4,
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: c.id === activeChatId ? '#1e2a4a' : 'transparent',
                color: c.id === activeChatId ? '#fff' : '#A0AEC0',
                border: `1px solid ${c.id === activeChatId ? '#2563eb44' : 'transparent'}`,
                transition: 'all .15s',
              }}>
                <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  💬 {c.title}
                </div>
                <button onClick={e => deleteChat(c.id, e)}
                  style={{ background: 'none', border: 'none', color: '#fc8181', cursor: 'pointer', opacity: c.id === activeChatId ? 1 : 0.4, padding: '0 2px' }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main area */}
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', height: '100%',
          background: isDragging ? 'rgba(79,142,247,0.05)' : '#13151c',
          border: isDragging ? '2px dashed #4F8EF7' : '2px dashed transparent',
          transition: 'all .2s', position: 'relative',
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(79,142,247,0.08)', backdropFilter: 'blur(2px)',
            pointerEvents: 'none',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📎</div>
              <div style={{ fontSize: 16, color: '#4F8EF7', fontWeight: 700 }}>Перетащите файл сюда</div>
              <div style={{ fontSize: 13, color: '#A0AEC0', marginTop: 4 }}>JPG, PNG, PDF, TXT — до 10MB</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ padding: '16px 22px 0', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>💬 ИИ-Бухгалтер</h1>
            <div style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2 }}>
              Gemini AI · Анализирует документы и изображения
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 22px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {msgs.map((m, i) => (
            <Message key={i} msg={m} onAction={handleAction} />
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,#1e3a8a,#4F8EF7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>🤖</div>
              <div style={{
                background: '#171923', border: '1px solid #2D3748',
                borderRadius: '4px 14px 14px 14px', padding: '14px 18px',
              }} className="typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '12px 22px 20px', borderTop: '1px solid #2D3748', flexShrink: 0 }}>

          {/* Hints */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {HINTS.map(h => (
              <button key={h} className="btn btn-ghost btn-sm" style={{ borderRadius: 20, fontSize: 12 }}
                onClick={() => send(h)}>{h}</button>
            ))}
          </div>

          {/* File previews */}
          {attachedFiles.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              {attachedFiles.map((f, i) => (
                <FileChip key={i} file={f} onRemove={() => removeFile(i)} />
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {/* Attach button */}
            <button
              title="Прикрепить файл (JPG, PNG, PDF, TXT · до 10MB · макс 3 файла)"
              onClick={() => fileRef.current?.click()}
              style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: attachedFiles.length > 0 ? '#172040' : 'transparent',
                border: `1px solid ${attachedFiles.length > 0 ? '#4F8EF7' : '#2D3748'}`,
                color: attachedFiles.length > 0 ? '#4F8EF7' : '#A0AEC0',
                cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s', position: 'relative',
              }}
            >
              📎
              {attachedFiles.length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#4F8EF7', color: '#fff',
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {attachedFiles.length}
                </span>
              )}
            </button>
            <input
              ref={fileRef} type="file" multiple
              accept="image/*,.pdf,.txt,.jpg,.jpeg,.png,.gif,.webp"
              style={{ display: 'none' }}
              onChange={e => { validateAndAddFiles(e.target.files); e.target.value = '' }}
            />

            {/* Text input */}
            <input
              ref={inputRef}
              className="input"
              placeholder="Напишите вопрос или прикрепите файл... (Enter — отправить)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              style={{ flex: 1 }}
            />

            {/* Send button */}
            <button
              className="btn btn-primary"
              onClick={() => send()}
              disabled={!canSend}
              style={{ minWidth: 110, height: 42, flexShrink: 0 }}
            >
              {loading ? '...' : 'Отправить ↗'}
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#4A5568', marginTop: 7, textAlign: 'center' }}>
            📎 Drag & Drop файла в область чата · JPG, PNG, PDF, TXT · до 10MB · до 3 файлов
          </div>
        </div>
      </div>
    </div>
  )
}
