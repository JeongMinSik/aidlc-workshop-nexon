import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, ChefHat, CheckCircle2, ClipboardList } from 'lucide-react'
import { api } from '../utils/api'

interface OrderItem {
  menu_name: string
  quantity: number
  unit_price: number
}

interface Order {
  id: number
  order_number: string
  status: string
  total_amount: number
  created_at: string
  items: OrderItem[]
}

const statusConfig: Record<string, { label: string; icon: any; bg: string; text: string; border: string }> = {
  pending: { label: '접수 대기', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  preparing: { label: '조리 중', icon: ChefHat, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  completed: { label: '완료', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getOrders()
      .then((res) => setOrders(res.orders || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="glass sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center px-5 py-4 gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">주문 내역</h1>
        </div>
      </header>

      <div className="p-5 space-y-4">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <ClipboardList size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">아직 주문 내역이 없어요</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2.5 bg-primary-500 text-white rounded-full text-sm font-semibold"
            >
              메뉴 보러가기
            </button>
          </div>
        )}

        {orders.map((order, idx) => {
          const status = statusConfig[order.status] || statusConfig.pending
          const StatusIcon = status.icon
          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-5 shadow-soft animate-fade-in-up border border-gray-100"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Order header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono text-xs text-gray-400">{order.order_number}</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                  <StatusIcon size={13} />
                  <span className="text-xs font-semibold">{status.label}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      {item.menu_name}
                      <span className="text-gray-400 ml-1">×{item.quantity}</span>
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {(item.unit_price * item.quantity).toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-end items-center pt-3 border-t border-gray-100">
                <span className="text-lg font-extrabold text-gray-900">
                  {order.total_amount.toLocaleString()}
                  <span className="text-sm font-medium text-gray-400">원</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
