import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Legend, Tooltip
} from 'recharts'
import {
  Activity, DollarSign, ShoppingBag, Zap, Square, TrendingUp,
  Radio, Flame, Timer, BarChart3, AlertTriangle, Users, Gauge, Loader2, ChevronDown
} from 'lucide-react'
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
  p50: number
  p95: number
  p99: number
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [metricsHistory, setMetricsHistory] = useState<MetricsPoint[]>([])
  const [currentOPS, setCurrentOPS] = useState(0)
  const [peakOPS, setPeakOPS] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [errorRate, setErrorRate] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [activeVUs, setActiveVUs] = useState(0)
  const [latencyP50, setLatencyP50] = useState(0)
  const [latencyP95, setLatencyP95] = useState(0)
  const [latencyP99, setLatencyP99] = useState(0)
  const [latencyAvg, setLatencyAvg] = useState(0)
  const [loadTestRunning, setLoadTestRunning] = useState(false)
  const [loadTestVUs, setLoadTestVUs] = useState(50)
  const [loadTestDuration, setLoadTestDuration] = useState(30)
  const [loadTestElapsed, setLoadTestElapsed] = useState(0)
  const [dashHasMore, setDashHasMore] = useState(true)
  const [dashLoading, setDashLoading] = useState(false)
  const [dashTotal, setDashTotal] = useState(0)
  const dashOffsetRef = useRef(0)
  const dashObserverRef = useRef<IntersectionObserver | null>(null)
  const dashLoadMoreRef = useRef<HTMLDivElement | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const orderKeyRef = useRef(0)

  // Load initial orders from API
  const loadDashOrders = useCallback(async (reset = false) => {
    if (dashLoading) return
    setDashLoading(true)
    try {
      const offset = reset ? 0 : dashOffsetRef.current
      const data = await adminApi.getOrders({ limit: 30, offset })
      const newOrders: Order[] = (data.orders || []).map((o: any) => ({
        ...o,
        order_id: o.id || o.order_id,
      }))
      if (reset) {
        setOrders(newOrders)
        dashOffsetRef.current = newOrders.length
      } else {
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.order_id))
          const unique = newOrders.filter((o) => !existingIds.has(o.order_id))
          return [...prev, ...unique]
        })
        dashOffsetRef.current = offset + newOrders.length
      }
      setDashTotal(data.total)
      setDashHasMore(data.hasMore)
    } catch (e) {
      // ignore
    } finally {
      setDashLoading(false)
    }
  }, [dashLoading])

  // Load orders on mount
  useEffect(() => {
    loadDashOrders(true)
  }, [])

  // Infinite scroll observer for dashboard
  useEffect(() => {
    if (dashObserverRef.current) dashObserverRef.current.disconnect()
    dashObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && dashHasMore && !dashLoading) {
          loadDashOrders(false)
        }
      },
      { threshold: 0.1 }
    )
    if (dashLoadMoreRef.current) {
      dashObserverRef.current.observe(dashLoadMoreRef.current)
    }
    return () => dashObserverRef.current?.disconnect()
  }, [dashHasMore, dashLoading, loadDashOrders])

  // Sync load test state from backend on mount
  useEffect(() => {
    const syncLoadTestStatus = async () => {
      try {
        const status = await adminApi.getLoadTestStatus()
        if (status.running) {
          setLoadTestRunning(true)
        }
      } catch (e) {
        // ignore - server might be down
      }
    }
    syncLoadTestStatus()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')

    // SSE connection for order events
    const orderES = new EventSource(`/api/admin/events?token=${token}`)
    orderES.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_order') {
          orderKeyRef.current += 1
          const orderWithKey = { ...data.data, _animKey: orderKeyRef.current }
          setOrders((prev) => [orderWithKey, ...prev].slice(0, 50))
        } else if (data.type === 'status_change') {
          setOrders((prev) =>
            prev.map((o) =>
              o.order_id === data.data.order_id ? { ...o, status: data.data.status } : o
            )
          )
        } else if (data.type === 'order_deleted') {
          setOrders((prev) => prev.filter((o) => o.order_id !== data.data.order_id))
        } else if (data.type === 'metrics') {
          // Also handle metrics from this stream as fallback
          handleMetricsUpdate(data.data)
        } else if (data.type === 'table_reset') {
          setOrders((prev) => prev.filter((o) => o.table_id !== data.data.table_id))
        }
      } catch (e) {
        // ignore
      }
    }

    // Dedicated SSE connection for metrics (separate stream, won't be blocked by order flood)
    const metricsES = new EventSource(`/api/admin/metrics/stream?token=${token}`)
    metricsES.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'metrics') {
          handleMetricsUpdate(data.data)
        }
      } catch (e) {
        // ignore
      }
    }

    eventSourceRef.current = orderES
    return () => {
      orderES.close()
      metricsES.close()
    }
  }, [])

  const handleMetricsUpdate = (m: any) => {
    setCurrentOPS(m.orders_per_second)
    setPeakOPS((prev) => Math.max(prev, m.orders_per_second))
    setTotalOrders(m.total_orders)
    setTotalRevenue(m.total_revenue)
    setErrorRate(m.error_rate || 0)
    setErrorCount(m.error_count || 0)
    setActiveVUs(m.active_vus || 0)
    setLatencyP50(m.latency_p50 || 0)
    setLatencyP95(m.latency_p95 || 0)
    setLatencyP99(m.latency_p99 || 0)
    setLatencyAvg(m.latency_avg || 0)

    // Sync load test running state from backend metrics
    const backendRunning = (m.active_vus || 0) > 0
    setLoadTestRunning((prev) => {
      if (backendRunning && !prev) return true
      if (!backendRunning && prev) {
        // Load test ended on backend - clean up timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setLoadTestElapsed(0)
        return false
      }
      return prev
    })

    setMetricsHistory((prev) => {
      const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const next = [...prev, { time: now, ops: m.orders_per_second, p50: m.latency_p50 || 0, p95: m.latency_p95 || 0, p99: m.latency_p99 || 0 }]
      return next.slice(-60)
    })
  }

  const handleStartLoadTest = async () => {
    try {
      await adminApi.startLoadTest(loadTestVUs, loadTestDuration)
      setLoadTestRunning(true)
      setLoadTestElapsed(0)
      setPeakOPS(0)

      timerRef.current = setInterval(() => {
        setLoadTestElapsed((prev) => prev + 1)
      }, 1000)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleStopLoadTest = async () => {
    try {
      await adminApi.stopLoadTest()
      setLoadTestRunning(false)
      setLoadTestElapsed(0)
      if (timerRef.current) clearInterval(timerRef.current)
    } catch (e) {
      // ignore
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    preparing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }

  const statusLabels: Record<string, string> = {
    pending: '대기',
    preparing: '조리중',
    completed: '완료',
  }

  const progressPercent = loadTestRunning ? (loadTestElapsed / loadTestDuration) * 100 : 0

  return (
    <div className="min-h-screen bg-surface-900 text-white p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">운영 대시보드</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full live-dot" />
              <span className="text-xs text-slate-400">실시간 모니터링</span>
            </div>
          </div>
        </div>
        {activeVUs > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
            <Flame size={14} className="text-red-400" />
            <span className="text-xs font-semibold text-red-400">부하테스트 진행중</span>
          </div>
        )}
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* OPS */}
        <div className="metric-card metric-green glass rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Activity size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Orders/sec</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400 font-mono animate-counter" key={currentOPS}>
            {currentOPS.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Peak: <span className="text-emerald-500 font-semibold">{peakOPS.toLocaleString()}</span></p>
        </div>

        {/* Total Orders */}
        <div className="metric-card metric-blue glass rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <ShoppingBag size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">총 주문</span>
          </div>
          <p className="text-3xl font-bold text-blue-400 font-mono animate-counter" key={totalOrders}>
            {totalOrders.toLocaleString()}
          </p>
        </div>

        {/* Revenue */}
        <div className="metric-card metric-purple glass rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">매출</span>
          </div>
          <p className="text-2xl font-bold text-purple-400 font-mono animate-counter" key={totalRevenue}>
            ₩{totalRevenue.toLocaleString()}
          </p>
        </div>

        {/* Load Test Control */}
        <div className={`metric-card ${loadTestRunning ? 'metric-red' : 'metric-orange'} glass rounded-2xl p-4`}>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Flame size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">부하테스트</span>
          </div>
          {!loadTestRunning ? (
            <button
              onClick={handleStartLoadTest}
              className="w-full mt-1 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.97]"
            >
              <Zap size={16} /> 시작
            </button>
          ) : (
            <div>
              <button
                onClick={handleStopLoadTest}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Square size={14} /> 중지
              </button>
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 text-center">
                {loadTestElapsed}s / {loadTestDuration}s
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Latency & Performance Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Latency P50 */}
        <div className="glass rounded-2xl p-4 border border-cyan-500/10">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Gauge size={14} className="text-cyan-400" />
            <span className="text-xs font-medium uppercase tracking-wider">P50 Latency</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400 font-mono" key={latencyP50}>
            {latencyP50.toFixed(1)}<span className="text-sm text-slate-500 ml-1">ms</span>
          </p>
        </div>

        {/* Latency P95 */}
        <div className="glass rounded-2xl p-4 border border-yellow-500/10">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Gauge size={14} className="text-yellow-400" />
            <span className="text-xs font-medium uppercase tracking-wider">P95 Latency</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400 font-mono" key={latencyP95}>
            {latencyP95.toFixed(1)}<span className="text-sm text-slate-500 ml-1">ms</span>
          </p>
        </div>

        {/* Latency P99 */}
        <div className="glass rounded-2xl p-4 border border-orange-500/10">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Gauge size={14} className="text-orange-400" />
            <span className="text-xs font-medium uppercase tracking-wider">P99 Latency</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${latencyP99 > 50 ? 'text-red-400' : 'text-orange-400'}`} key={latencyP99}>
            {latencyP99.toFixed(1)}<span className="text-sm text-slate-500 ml-1">ms</span>
          </p>
          {latencyP99 > 0 && latencyP99 <= 50 && (
            <p className="text-[10px] text-emerald-500 mt-1">✓ SLA 충족 (&lt;50ms)</p>
          )}
        </div>

        {/* Error Rate & VUs */}
        <div className="glass rounded-2xl p-4 border border-emerald-500/10">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <AlertTriangle size={14} className={errorRate > 0 ? 'text-red-400' : 'text-emerald-400'} />
            <span className="text-xs font-medium uppercase tracking-wider">에러율</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${errorRate > 1 ? 'text-red-400' : 'text-emerald-400'}`}>
            {errorRate.toFixed(2)}<span className="text-sm text-slate-500 ml-1">%</span>
          </p>
          {activeVUs > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Users size={10} className="text-slate-500" />
              <span className="text-[10px] text-slate-500">{activeVUs} VUs active</span>
            </div>
          )}
        </div>
      </div>

      {/* Load Test Config (collapsible) */}
      {!loadTestRunning && (
        <div className="glass rounded-2xl p-4 mb-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Timer size={14} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-300">부하테스트 설정</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">동시 사용자 (VUs)</label>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={loadTestVUs}
                onChange={(e) => setLoadTestVUs(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
              />
              <p className="text-right text-sm font-mono text-orange-400 mt-1">{loadTestVUs} VUs</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">지속 시간</label>
              <input
                type="range"
                min="10"
                max="120"
                step="10"
                value={loadTestDuration}
                onChange={(e) => setLoadTestDuration(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
              />
              <p className="text-right text-sm font-mono text-orange-400 mt-1">{loadTestDuration}초</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Throughput Chart */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-300">처리량 (Orders/sec)</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio size={10} className="text-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-500">LIVE</span>
            </div>
          </div>
          <div className="chart-gradient rounded-xl">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={metricsHistory}>
                <defs>
                  <linearGradient id="opsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="ops"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#opsGradient)"
                  animationDuration={200}
                  name="OPS"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Chart */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gauge size={14} className="text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-300">응답 시간 (ms)</h2>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" />P50</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />P95</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />P99</span>
            </div>
          </div>
          <div className="rounded-xl" style={{ background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.03) 0%, transparent 100%)' }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => [`${value.toFixed(2)} ms`]}
                />
                <Line type="monotone" dataKey="p50" stroke="#22d3ee" strokeWidth={2} dot={false} animationDuration={200} name="P50" />
                <Line type="monotone" dataKey="p95" stroke="#facc15" strokeWidth={2} dot={false} animationDuration={200} name="P95" />
                <Line type="monotone" dataKey="p99" stroke="#fb923c" strokeWidth={2} dot={false} animationDuration={200} name="P99" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300">실시간 주문</h2>
          <span className="text-xs text-slate-500 font-mono">{orders.length}건</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {orders.slice(0, 12).map((order, idx) => (
            <div
              key={order.order_id}
              className={`glass-light rounded-xl p-3 animate-slide-in-right ${
                order.status === 'pending' ? 'ring-1 ring-amber-500/30' : ''
              }`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-500">T{order.table_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
              <p className="font-mono text-xs text-slate-300 mb-1 truncate">{order.order_number}</p>
              {order.items && order.items.length > 0 && (
                <p className="text-[11px] text-slate-400 mb-1 truncate">
                  {order.items.map((item: any) => `${item.menu_name}×${item.quantity}`).join(', ')}
                </p>
              )}
              <p className="text-base font-bold text-white">
                ₩{order.total_amount?.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
