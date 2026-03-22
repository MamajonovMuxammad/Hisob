import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import DocumentsPage from './pages/DocumentsPage'
import IncomePage from './pages/IncomePage'
import TaxPage from './pages/TaxPage'
import EmployeesPage from './pages/EmployeesPage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'
import LandingPage from './pages/LandingPage'

const PAGES = {
  chat: ChatPage,
  documents: DocumentsPage,
  income: IncomePage,
  tax: TaxPage,
  employees: EmployeesPage,
  calendar: CalendarPage,
  settings: SettingsPage,
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('chat')
  const [chatInitMsg, setChatInitMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ background: '#0F1117', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Загрузка...</div>

  if (!session) return <LandingPage onLoggedIn={setSession} />

  const goToChat = (msg) => {
    setChatInitMsg(msg)
    setTab('chat')
  }

  const CurrentPage = PAGES[tab] || ChatPage

  return (
    <Layout activeTab={tab} setTab={setTab}>
      <CurrentPage
        onNavigate={goToChat}
        initMsg={chatInitMsg}
        clearInitMsg={() => setChatInitMsg('')}
      />
    </Layout>
  )
}
