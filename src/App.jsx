import { useState } from 'react'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import DocumentsPage from './pages/DocumentsPage'
import IncomePage from './pages/IncomePage'
import TaxPage from './pages/TaxPage'
import EmployeesPage from './pages/EmployeesPage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'

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
  const [tab, setTab] = useState('chat')
  const [chatInitMsg, setChatInitMsg] = useState('')

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
