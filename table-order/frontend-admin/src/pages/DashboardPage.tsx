import { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Activity, DollarSign, ShoppingBag, Clock, Zap, Square } from 'lucide-react'
import { adminApi } from '../utils/api'

interface Order {
  order_id: number
  order_number: string
  table_id: number
  table_number: number
  items: any[]
  total_amount: number
  status: string
  created_at: string
}

interface MetricsPoint {
  time: string
  ops: number
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [metricsHistory, setMetricsHistory] = useState<MetricsPoint[]>([])
  const [currentOPS, setCurrentOPS] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loadTestRunning, setLoadTestRunning] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Connect to SSE for real-time events
    const token = localStorage.getItem('admin_token')
    const es = new EventSource(`/api/admin/events?token=${token}`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_order') {
          setOrders((prev) => [data.data, ...prev].slice(0, 50))
        } else if (data.type === 'status_change') {
          setOrders((prev) =>
            prev.map((o) =>
              o.order_id === data.data.order_id ? { ...o, status: data.data.status } : o
            )
          )
        } else if (data.type === 'order_deleted') {
          setOrders((prev) => prev.filter((o) => o.order_id !== data.data.order_id))
        } else if (data.type === 'metrics') {
          const m = data.data
          setCurrentOPS(m.orders_per_second)
          setTotalOrders(m.total_orders)
          setTotalRevenue(m.total_revenue)
          setMetricsHistory((prev) => {
            const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            const next = [...prev, { time: now, ops: m.orders_per_second }]
            return next.slice(-60) // Keep last 60 seconds
          })
        } else if (data.type === 'table_reset') {
          setOrders((prev) => prev.filter((o) => o.table_id !== data.data.table_id))
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    eventSourceRef.current = es
    return () => es.close()
  }, [])

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, status)
    } catch (e) {
      // handled by SSE
    }
  }

  const handleDelete = async (orderId: number) => {
    if (!confirm('이 주문을 삭제하시겠습니까?')) return
    try {
      await adminApi.deleteOrder(orderId)
    } catch (e) {
      // handled by SSE
    }
  }

  const handleStartLoadTest = async () => {
    try {
      await adminApi.startLoadTest(30, 30)
      setLoadTestRunning(true)
      setTimeout(() => setLoadTestRunning(false), 30000)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleStopLoadTest = async () => {
    try {
      await adminApi.stopLoadTest()
      setLoadTestRunning(false)
    } catch (e) {
      // ignore
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    preparing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  }

  const statusLabels: Record<string, string> = {
    pending: '대기중',
    preparing: '준비중',
    completed: '완료',
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Activity size={16} />
            <span className="text-xs uppercase">Orders/sec</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{currentOPS.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <ShoppingBag size={16} />
            <span className="text-xs uppercase">Total Orders</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{totalOrders.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <DollarSign size={16} />
            <span className="text-xs uppercase">Revenue</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">₩{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap size={16} />
              <span className="text-xs uppercase">Load Test</span>
            </div>
          </div>
          {!loadTestRunning ? (
            <button
              onClick={handleStartLoadTest}
              className="w-full mt-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={16} /> 부하테스트 시작
            </button>
          ) : (
            <button
              onClick={handleStopLoadTest}
              className="w-full mt-1 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 animate-pulse"
            >
              <Square size={16} /> 중지 (실행중...)
            </button>
          )}
        </div>
      </div>

      {/* Real-time Chart */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
        <h2 className="text-sm font-medium text-slate-400 mb-3">📈 실시간 주문량 (Orders/sec)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={metricsHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="ops"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              animationDuration={200}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Grid */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">🛒 실시간 주문</h2>
        <div className="grid grid-cols-3 gap-3">
          {orders.slice(0, 12).map((order) => (
            <div
              key={order.order_id}
              className={`bg-slate-800 rounded-xl p-3 border ${
                order.status === 'pending' ? 'border-yellow-500/50 animate-pulse' : 'border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Table {order.table_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
              <p className="font-mono text-sm text-white mb-1">{order.order_number}</p>
              <p className="text-lg font-bold text-emerald-400">
                ₩{order.total_amount?.toLocaleString()}
              </p>
              <div className="flex gap-1 mt-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(order.order_id, 'preparing')}
                    className="flex-1 text-xs py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    준비시작
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleStatusChange(order.order_id, 'completed')}
                    className="flex-1 text-xs py-1 bg-green-600 hover:bg-green-700 rounded transition-colors"
                  >
                    완료
                  </button>
                )}
                <button
                  onClick={() => handleDelete(order.order_id)}
                  className="text-xs py-1 px-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
