import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, ClipboardList } from 'lucide-react'
import { api } from '../utils/api'
import { addToCart, getCart, updateQuantity, getCartTotal, clearCart, CartItem } from '../utils/cart'

interface Menu {
  id: number
  name: string
  price: number
  description: string
  image_url: string
}

interface Category {
  id: number
  name: string
  menus: Menu[]
}

export default function MenuPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<number>(0)
  const [cart, setCart] = useState<CartItem[]>(getCart())
  const [showCart, setShowCart] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getMenus().then((res) => {
      setCategories(res.categories || [])
      if (res.categories?.length > 0) setActiveCategory(res.categories[0].id)
    })
  }, [])

  const handleAddToCart = (menu: Menu) => {
    const updated = addToCart({
      menuId: menu.id,
      name: menu.name,
      price: menu.price,
      imageUrl: menu.image_url,
    })
    setCart([...updated])
  }

  const handleQuantityChange = (menuId: number, qty: number) => {
    const updated = updateQuantity(menuId, qty)
    setCart([...updated])
  }

  const handleOrder = async () => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const res = await api.createOrder(
        cart.map((item) => ({ menu_id: item.menuId, quantity: item.quantity }))
      )
      clearCart()
      setCart([])
      setShowCart(false)
      setOrderSuccess(res.order_number)
      setTimeout(() => setOrderSuccess(null), 5000)
    } catch (err: any) {
      alert(err.message || '주문에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const currentMenus = categories.find((c) => c.id === activeCategory)?.menus || []
  const cartTotal = getCartTotal(cart)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">주문 완료!</h2>
          <p className="text-lg text-gray-600">주문번호: {orderSuccess}</p>
          <p className="text-sm text-gray-400 mt-4">잠시 후 메뉴 화면으로 돌아갑니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-800">🍽️ 메뉴</h1>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1 text-gray-600 hover:text-orange-500"
          >
            <ClipboardList size={20} />
            <span className="text-sm">주문내역</span>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto px-4 pb-2 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Menu grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {currentMenus.map((menu) => (
          <div
            key={menu.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <img
              src={menu.image_url || 'https://via.placeholder.com/200'}
              alt={menu.name}
              className="w-full h-32 object-cover"
            />
            <div className="p-3">
              <h3 className="font-semibold text-gray-800 text-sm truncate">{menu.name}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{menu.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-orange-600">
                  {menu.price.toLocaleString()}원
                </span>
                <button
                  onClick={() => handleAddToCart(menu)}
                  className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart button */}
      {cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-4 left-4 right-4 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-colors"
        >
          <ShoppingCart size={20} />
          <span className="font-semibold">
            장바구니 ({cartCount}) · {cartTotal.toLocaleString()}원
          </span>
        </button>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">장바구니</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.menuId} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                  <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-orange-600 font-semibold text-sm">
                      {(item.price * item.quantity).toLocaleString()}원
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item.menuId, item.quantity - 1)}
                      className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.menuId, item.quantity + 1)}
                      className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t sticky bottom-0 bg-white">
              <div className="flex justify-between mb-3">
                <span className="font-medium">총 금액</span>
                <span className="font-bold text-lg text-orange-600">
                  {cartTotal.toLocaleString()}원
                </span>
              </div>
              <button
                onClick={handleOrder}
                disabled={loading}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-lg"
              >
                {loading ? '주문 중...' : `${cartTotal.toLocaleString()}원 주문하기`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
