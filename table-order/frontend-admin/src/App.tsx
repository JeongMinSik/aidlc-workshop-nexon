import { useState } from 'react'
import { isLoggedIn, clearAdminToken } from './utils/api'
import LoginPage from './pages/LoginPage'
import OrderControlPage from './pages/OrderControlPage'
import TableManagementPage from './pages/TableManagementPage'
import MenuManagementPage from './pages/MenuManagementPage'
import DashboardPage from './pages/DashboardPage'
import {
  ClipboardList, LayoutGrid, UtensilsCrossed, BarChart3, LogOut
} from 'lucide-react'

type Tab = 'orders' | 'tables' | 'menus' | 'dashboard'

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [activeTab, setActiveTab] = useState<Tab>('orders')

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  const handleLogout = () => {
    clearAdminToken()
    setLoggedIn(false)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'orders', label: '주문 관제', icon: <ClipboardList size={18} /> },
    { id: 'tables', label: '테이블', icon: <LayoutGrid size={18} /> },
    { id: 'menus', label: '메뉴 관리', icon: <UtensilsCrossed size={18} /> },
    { id: 'dashboard', label: '대시보드', icon: <BarChart3 size={18} /> },
  ]

  return (
    <div className="min-h-screen bg-surface-900 text-white flex flex-col">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ClipboardList size={16} />
              </div>
              <span className="font-bold text-sm hidden sm:block">주문 관제 시스템</span>
            </div>
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">
        {activeTab === 'orders' && <OrderControlPage />}
        {activeTab === 'tables' && <TableManagementPage />}
        {activeTab === 'menus' && <MenuManagementPage />}
        {activeTab === 'dashboard' && <DashboardPage />}
      </main>
    </div>
  )
}

export default App
