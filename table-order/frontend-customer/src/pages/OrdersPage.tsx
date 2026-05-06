import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-700' },
  preparing: { label: '준비중', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' },
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    api.getOrders().then((res) => setOrders(res.orders || []))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600 hover:text-orange-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">주문 내역</h1>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">주문 내역이 없습니다</p>
          </div>
        )}

        {orders.map((order) => {
          const status = statusMap[order.status] || statusMap.pending
          return (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{order.order_number}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="space-y-1 mb-2">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-600">
                    <span>{item.menu_name} × {item.quantity}</span>
                    <span>{(item.unit_price * item.quantity).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleTimeString('ko-KR')}
                </span>
                <span className="font-bold text-orange-600">
                  {order.total_amount.toLocaleString()}원
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
