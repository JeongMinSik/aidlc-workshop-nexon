import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ClipboardList, Clock, ChefHat, CheckCircle2, Trash2, X,
  AlertCircle, Loader2, ChevronDown
} from 'lucide-react'
import { adminApi } from '../utils/api'

interface OrderItem {
  menu_name: string
  quantity: number
  unit_price: number
}

interface Order {
  id?: number
  order_id?: number
  order_number: string
  table_id: number
  table_number: number
  items: OrderItem[]
  total_amount: number
  status: string
  created_at: string
}

interface TableGroup {
  table_id: number
  table_number: number
  orders: Order[]
  total_amount: number
  pending_count: number
  preparing_count: number
}

type StatusFilter = 'all' | 'pending' | 'preparing' | 'completed'
type ViewMode = 'table' | 'list'

export default function OrderControlPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef(0)

  const getOrderId = (order: Order) => order.order_id || order.id || 0

  // Initial load from API
  const loadOrders = useCallback(async (reset = false) => {
    if (loading) return
    setLoading(true)

    try {
      const offset = reset ? 0 : offsetRef.current
      const data = await adminApi.getOrders({ limit: 30, offset, status: filter })
      const newOrders: Order[] = (data.orders || []).map((o: any) => ({
        ...o,
        order_id: o.id || o.order_id,
      }))

      if (reset) {
        setOrders(newOrders)
        offsetRef.current = newOrders.length
      } else {
        setOrders((prev) => {
          const existingIds = new Set(prev.map(getOrderId))
          const unique = newOrders.filter((o) => !existingIds.has(getOrderId(o)))
          return [...prev, ...unique]
        })
        offsetRef.current = offset + newOrders.length
      }

      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (e) {
      console.error('Failed to load orders:', e)
    } finally {
      setLoading(false)
      setInitialLoaded(true)
    }
  }, [filter, loading])

  // Load on mount and filter change
  useEffect(() => {
    offsetRef.current = 0
    setHasMore(true)
    loadOrders(true)
  }, [filter])

  // SSE for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const es = new EventSource(`/api/admin/events?token=${token}`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_order') {
          const newOrder = { ...data.data, order_id: data.data.order_id || data.data.id }
          setOrders((prev) => {
            if (prev.some((o) => getOrderId(o) === getOrderId(newOrder))) return prev
            return [newOrder, ...prev]
          })
          setTotal((prev) => prev + 1)
        } else if (data.type === 'status_change') {
          setOrders((prev) =>
            prev.map((o) =>
              getOrderId(o) === data.data.order_id ? { ...o, status: data.data.status } : o
            )
          )
          // Update selected order if open
          setSelectedOrder((prev) =>
            prev && getOrderId(prev) === data.data.order_id
              ? { ...prev, status: data.data.status }
              : prev
          )
        } else if (data.type === 'order_deleted') {
          setOrders((prev) => prev.filter((o) => getOrderId(o) !== data.data.order_id))
          setTotal((prev) => Math.max(0, prev - 1))
        } else if (data.type === 'table_reset') {
          setOrders((prev) => prev.filter((o) => o.table_id !== data.data.table_id))
        }
      } catch (e) {
        // ignore
      }
    }

    eventSourceRef.current = es
    return () => { es.close() }
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && initialLoaded) {
          loadOrders(false)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, loading, initialLoaded, loadOrders])

  // Filter orders for display
  const filteredOrders = orders.filter((o) => filter === 'all' || o.status === filter)

  // Group by table
  const tableGroups: TableGroup[] = (() => {
    const map = new Map<number, TableGroup>()
    filteredOrders.forEach((order) => {
      const existing = map.get(order.table_id)
      if (existing) {
        existing.orders.push(order)
        existing.total_amount += order.total_amount
        if (order.status === 'pending') existing.pending_count++
        if (order.status === 'preparing') existing.preparing_count++
      } else {
        map.set(order.table_id, {
          table_id: order.table_id,
          table_number: order.table_number,
          orders: [order],
          total_amount: order.total_amount,
          pending_count: order.status === 'pending' ? 1 : 0,
          preparing_count: order.status === 'preparing' ? 1 : 0,
        })
      }
    })
    // Sort by table number
    return Array.from(map.values()).sort((a, b) => a.table_number - b.table_number)
  })()

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus)
    } catch (e: any) {
      alert('상태 변경 실패: ' + e.message)
    }
  }

  const handleDelete = async (orderId: number) => {
    try {
      await adminApi.deleteOrder(orderId)
      setDeleteConfirm(null)
      if (selectedOrder && getOrderId(selectedOrder) === orderId) setSelectedOrder(null)
    } catch (e: any) {
      alert('삭제 실패: ' + e.message)
    }
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: '대기중', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: <Clock size={14} /> },
    preparing: { label: '준비중', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: <ChefHat size={14} /> },
    completed: { label: '완료', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 size={14} /> },
  }

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header with filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList size={20} className="text-indigo-400" />
            실시간 주문 관제
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">주문 접수 → 준비 → 완료 상태를 관리합니다 (총 {total}건)</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-surface-800 rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              테이블별
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              전체목록
            </button>
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-surface-800 rounded-xl p-1 border border-white/5">
            {(['all', 'pending', 'preparing', 'completed'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all' ? '전체' : statusConfig[f].label}
                <span className="ml-1 font-mono">({counts[f]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table-grouped View */}
      {viewMode === 'table' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tableGroups.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
              <ClipboardList size={48} className="mb-3 opacity-30" />
              <p className="text-sm">주문이 없습니다</p>
              <p className="text-xs mt-1">새 주문이 들어오면 실시간으로 표시됩니다</p>
            </div>
          )}
          {tableGroups.map((group) => (
            <div
              key={group.table_id}
              className={`glass-light rounded-xl p-4 ${
                group.pending_count > 0 ? 'ring-1 ring-amber-500/30' : ''
              }`}
            >
              {/* Table Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">테이블 {group.table_number}</span>
                  {group.pending_count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      대기 {group.pending_count}
                    </span>
                  )}
                  {group.preparing_count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      준비 {group.preparing_count}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-white">₩{group.total_amount.toLocaleString()}</span>
              </div>

              {/* Orders in this table */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {group.orders.map((order) => {
                  const sc = statusConfig[order.status] || statusConfig.pending
                  const oid = getOrderId(order)
                  return (
                    <div
                      key={oid}
                      onClick={() => setSelectedOrder(order)}
                      className="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-all border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-slate-500 font-mono">{order.order_number}</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sc.bg} ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                      <div className="space-y-0.5 mb-2">
                        {(order.items || []).slice(0, 2).map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 truncate flex-1">{item.menu_name}</span>
                            <span className="text-slate-500 ml-2">×{item.quantity}</span>
                          </div>
                        ))}
                        {(order.items || []).length > 2 && (
                          <p className="text-[10px] text-slate-500">+{order.items.length - 2}개 더...</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">{formatTime(order.created_at)}</span>
                        <span className="text-xs font-bold text-white">₩{order.total_amount?.toLocaleString()}</span>
                      </div>
                      {/* Quick action buttons */}
                      <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(oid, 'preparing')}
                            className="flex-1 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 border border-blue-500/20"
                          >
                            <ChefHat size={11} /> 준비 시작
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleStatusChange(oid, 'completed')}
                            className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 border border-emerald-500/20"
                          >
                            <CheckCircle2 size={11} /> 완료
                          </button>
                        )}
                        {order.status !== 'completed' && (
                          <button
                            onClick={() => setDeleteConfirm(oid)}
                            className="py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] rounded-lg transition-all border border-red-500/20"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View (flat, all orders) */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredOrders.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
              <ClipboardList size={48} className="mb-3 opacity-30" />
              <p className="text-sm">주문이 없습니다</p>
              <p className="text-xs mt-1">새 주문이 들어오면 실시간으로 표시됩니다</p>
            </div>
          )}
          {filteredOrders.map((order, idx) => {
            const sc = statusConfig[order.status] || statusConfig.pending
            const oid = getOrderId(order)
            return (
              <div
                key={oid}
                onClick={() => setSelectedOrder(order)}
                className={`glass-light rounded-xl p-4 cursor-pointer hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all ${
                  order.status === 'pending' ? 'ring-1 ring-amber-500/30' : ''
                } ${selectedOrder && getOrderId(selectedOrder) === oid ? 'ring-2 ring-indigo-500/50' : ''}`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">T{order.table_number}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{order.order_number}</span>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${sc.bg} ${sc.color}`}>
                    {sc.icon}
                    {sc.label}
                  </span>
                </div>

                {/* Items Preview */}
                <div className="space-y-1 mb-3">
                  {(order.items || []).slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate flex-1">{item.menu_name}</span>
                      <span className="text-slate-500 ml-2">×{item.quantity}</span>
                    </div>
                  ))}
                  {(order.items || []).length > 3 && (
                    <p className="text-[10px] text-slate-500">+{order.items.length - 3}개 더...</p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-slate-500">{formatTime(order.created_at)}</span>
                  <span className="text-sm font-bold text-white">₩{order.total_amount?.toLocaleString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(oid, 'preparing')}
                      className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 border border-blue-500/20"
                    >
                      <ChefHat size={12} /> 준비 시작
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusChange(oid, 'completed')}
                      className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 border border-emerald-500/20"
                    >
                      <CheckCircle2 size={12} /> 완료
                    </button>
                  )}
                  {order.status !== 'completed' && (
                    <button
                      onClick={() => setDeleteConfirm(oid)}
                      className="py-2 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-all border border-red-500/20"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="flex items-center justify-center py-6">
        {loading && (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">주문 불러오는 중...</span>
          </div>
        )}
        {!loading && hasMore && initialLoaded && (
          <div className="flex items-center gap-1 text-slate-500">
            <ChevronDown size={14} />
            <span className="text-xs">스크롤하여 더 보기</span>
          </div>
        )}
        {!hasMore && initialLoaded && orders.length > 0 && (
          <span className="text-xs text-slate-600">모든 주문을 불러왔습니다</span>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="glass rounded-2xl p-6 w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">테이블 {selectedOrder.table_number}</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedOrder.order_number}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Status */}
            <div className="mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig[selectedOrder.status]?.bg} ${statusConfig[selectedOrder.status]?.color}`}>
                {statusConfig[selectedOrder.status]?.icon}
                {statusConfig[selectedOrder.status]?.label}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">주문 내역</h4>
              {(selectedOrder.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="text-sm text-white">{item.menu_name}</p>
                    <p className="text-xs text-slate-500">₩{item.unit_price?.toLocaleString()} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-white">₩{(item.unit_price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-3 border-t border-white/10">
              <span className="text-sm text-slate-400">합계</span>
              <span className="text-xl font-bold text-white">₩{selectedOrder.total_amount?.toLocaleString()}</span>
            </div>

            {/* Time */}
            <p className="text-xs text-slate-500 mt-2">
              주문 시각: {new Date(selectedOrder.created_at).toLocaleString('ko-KR')}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(getOrderId(selectedOrder), 'preparing')}
                  className="flex-1 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-blue-500/20"
                >
                  <ChefHat size={16} /> 준비 시작
                </button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button
                  onClick={() => handleStatusChange(getOrderId(selectedOrder), 'completed')}
                  className="flex-1 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-emerald-500/20"
                >
                  <CheckCircle2 size={16} /> 완료 처리
                </button>
              )}
              {selectedOrder.status !== 'completed' && (
                <button
                  onClick={() => setDeleteConfirm(getOrderId(selectedOrder))}
                  className="py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-all border border-red-500/20 flex items-center gap-2"
                >
                  <Trash2 size={16} /> 삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="glass rounded-2xl p-6 w-full max-w-sm animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">주문 삭제</h3>
                <p className="text-xs text-slate-400">이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-5">정말로 이 주문을 삭제하시겠습니까?</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
