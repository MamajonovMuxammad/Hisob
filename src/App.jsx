import { useState, useEffect } from 'react'
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
  const [hasVisited, setHasVisited] = useState(() => localStorage.getItem('hisob_visited') === 'true')
  const [tab, setTab] = useState('chat')
  const [chatInitMsg, setChatInitMsg] = useState('')

  const startApp = () => {
    localStorage.setItem('hisob_visited', 'true')
    setHasVisited(true)
  }

  if (!hasVisited) return <LandingPage onStart={startApp} />

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
