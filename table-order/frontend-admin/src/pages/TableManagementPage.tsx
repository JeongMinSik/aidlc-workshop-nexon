import { useState, useEffect } from 'react'
import {
  LayoutGrid, Plus, RotateCcw, History, X, CheckCircle2, AlertCircle
} from 'lucide-react'
import { adminApi } from '../utils/api'

interface Table {
  id: number
  table_number: number
  session_id: string | null
  session_started_at: string | null
  has_active_session: boolean
  total_amount?: number
  order_count?: number
}

interface HistoryOrder {
  order_id: number
  order_number: string
  total_amount: number
  status: string
  created_at: string
  items: { menu_name: string; quantity: number; unit_price: number }[]
}

export default function TableManagementPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState('')
  const [newTablePassword, setNewTablePassword] = useState('')
  const [createError, setCreateError] = useState('')
  const [completeConfirm, setCompleteConfirm] = useState<Table | null>(null)
  const [historyTable, setHistoryTable] = useState<Table | null>(null)
  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>([])
  const [historyDate, setHistoryDate] = useState('')
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchTables = async () => {
    try {
      const res = await adminApi.getTables()
      setTables(res.tables || res || [])
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    try {
      await adminApi.createTable(parseInt(newTableNumber), newTablePassword)
      setShowCreate(false)
      setNewTableNumber('')
      setNewTablePassword('')
      fetchTables()
    } catch (err: any) {
      setCreateError(err.message || '생성 실패')
    }
  }

  const handleComplete = async (table: Table) => {
    try {
      await adminApi.completeTable(table.id)
      setCompleteConfirm(null)
      fetchTables()
    } catch (e: any) {
      alert('세션 종료 실패: ' + e.message)
    }
  }

  const handleViewHistory = async (table: Table) => {
    setHistoryTable(table)
    setHistoryLoading(true)
    try {
      const res = await adminApi.getTableHistory(table.id, historyDate || undefined)
      setHistoryOrders(res.orders || res || [])
    } catch (e) {
      setHistoryOrders([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleDateChange = async (date: string) => {
    setHistoryDate(date)
    if (historyTable) {
      setHistoryLoading(true)
      try {
        const res = await adminApi.getTableHistory(historyTable.id, date || undefined)
        setHistoryOrders(res.orders || res || [])
      } catch (e) {
        setHistoryOrders([])
      } finally {
        setHistoryLoading(false)
      }
    }
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <LayoutGrid size={20} className="text-indigo-400" />
            테이블 관리
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">테이블 등록, 세션 관리, 이용 완료 처리</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium rounded-xl transition-all border border-indigo-500/30 text-sm"
        >
          <Plus size={16} /> 테이블 추가
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <RotateCcw size={20} className="animate-spin mr-2" /> 로딩 중...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {tables.map((table) => (
            <div key={table.id} className="glass-light rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-white">T{table.table_number}</span>
                {table.has_active_session ? (
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full live-dot" />
                ) : (
                  <span className="w-2.5 h-2.5 bg-slate-600 rounded-full" />
                )}
              </div>

              {table.has_active_session ? (
                <div className="mb-3">
                  <p className="text-xs text-slate-400">이용중</p>
                  {table.order_count !== undefined && (
                    <p className="text-xs text-slate-500 mt-0.5">주문 {table.order_count}건</p>
                  )}
                  {table.total_amount !== undefined && table.total_amount > 0 && (
                    <p className="text-sm font-bold text-white mt-1">₩{table.total_amount.toLocaleString()}</p>
                  )}
                </div>
              ) : (
                <div className="mb-3">
                  <p className="text-xs text-slate-500">비어있음</p>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {table.has_active_session && (
                  <button
                    onClick={() => setCompleteConfirm(table)}
                    className="flex-1 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 border border-emerald-500/20"
                  >
                    <CheckCircle2 size={11} /> 완료
                  </button>
                )}
                <button
                  onClick={() => handleViewHistory(table)}
                  className="flex-1 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  <History size={11} /> 내역
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Table Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-sm animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">테이블 추가</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">테이블 번호</label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">비밀번호</label>
                <input
                  type="password"
                  value={newTablePassword}
                  onChange={(e) => setNewTablePassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••"
                  required
                />
              </div>
              {createError && (
                <p className="text-red-400 text-xs">{createError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all"
              >
                추가
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complete Confirmation Modal */}
      {completeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCompleteConfirm(null)}>
          <div className="glass rounded-2xl p-6 w-full max-w-sm animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">이용 완료</h3>
                <p className="text-xs text-slate-400">테이블 {completeConfirm.table_number}번</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              이 테이블의 세션을 종료하시겠습니까?<br />
              <span className="text-xs text-slate-500">현재 주문은 이력으로 이동됩니다.</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
              >
                취소
              </button>
              <button
                onClick={() => handleComplete(completeConfirm)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all"
              >
                완료 처리
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setHistoryTable(null)}>
          <div className="glass rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white">테이블 {historyTable.table_number} 주문 내역</h3>
                <p className="text-xs text-slate-500">과거 주문 이력을 조회합니다</p>
              </div>
              <button onClick={() => setHistoryTable(null)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Date Filter */}
            <div className="mb-4">
              <input
                type="date"
                value={historyDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 bg-surface-900/50 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* History List */}
            {historyLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <RotateCcw size={16} className="animate-spin mr-2" /> 로딩 중...
              </div>
            ) : historyOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <History size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">주문 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyOrders.map((order) => (
                  <div key={order.order_id} className="glass-light rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-400">{order.order_number}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div className="space-y-1 mb-2">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-300">{item.menu_name} ×{item.quantity}</span>
                          <span className="text-slate-400">₩{(item.unit_price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-xs text-slate-500">{order.status}</span>
                      <span className="text-sm font-bold text-white">₩{order.total_amount?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
