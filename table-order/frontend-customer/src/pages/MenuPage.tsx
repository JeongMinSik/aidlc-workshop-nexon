import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, ClipboardList, X } from 'lucide-react'
import { api } from '../utils/api'
import { addToCart, getCart, updateQuantity, getCartTotal, clearCart, CartItem } from '../utils/cart'
import { getTableInfo, saveToken } from '../utils/auth'

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
  const [addedItem, setAddedItem] = useState<number | null>(null)
  const tableInfo = getTableInfo()

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
    setAddedItem(menu.id)
    setTimeout(() => setAddedItem(null), 600)
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
      // If a new token was issued (session was created), save it
      if (res.token && tableInfo) {
        saveToken(res.token, {
          tableId: tableInfo.tableId,
          tableNumber: tableInfo.tableNumber,
          sessionId: res.session_id || null,
        })
      }
      clearCart()
      setCart([])
      setShowCart(false)
      setOrderSuccess(res.order_number)
      setTimeout(() => setOrderSuccess(null), 4000)
    } catch (err: any) {
      alert(err.message || '주문에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const currentMenus = categories.find((c) => c.id === activeCategory)?.menus || []
  const cartTotal = getCartTotal(cart)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartItemForMenu = (menuId: number) => cart.find(i => i.menuId === menuId)

  // Order success overlay
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce-in">
            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">주문 완료!</h2>
          <p className="text-gray-500 mb-1">주문번호</p>
          <p className="text-lg font-mono font-bold text-primary-600 bg-primary-50 inline-block px-4 py-2 rounded-xl">
            {orderSuccess}
          </p>
          <p className="text-sm text-gray-400 mt-6">조리가 완료되면 알려드릴게요 ✨</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="glass sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              Table {tableInfo?.tableNumber || ''}
            </h1>
            <p className="text-xs text-gray-400">메뉴를 선택해주세요</p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ClipboardList size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-600">주문내역</span>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto px-5 pb-3 gap-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Menu grid */}
      <div className="grid grid-cols-1 gap-4 p-5">
        {currentMenus.map((menu, idx) => {
          const inCart = cartItemForMenu(menu.id)
          return (
            <div
              key={menu.id}
              className="bg-white rounded-3xl shadow-soft overflow-hidden card-hover animate-fade-in-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex">
                {/* Image */}
                <div className="relative w-28 h-28 flex-shrink-0">
                  <img
                    src={menu.image_url || 'https://via.placeholder.com/200'}
                    alt={menu.name}
                    className="w-full h-full object-cover"
                  />
                  {addedItem === menu.id && (
                    <div className="absolute inset-0 bg-primary-500/80 flex items-center justify-center animate-fade-in">
                      <span className="text-white text-2xl animate-bounce-in">✓</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-[15px]">{menu.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{menu.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-extrabold text-gray-900">
                      {menu.price.toLocaleString()}
                      <span className="text-sm font-medium text-gray-400">원</span>
                    </span>

                    {inCart ? (
                      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-1 py-1">
                        <button
                          onClick={() => handleQuantityChange(menu.id, inCart.quantity - 1)}
                          className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                        >
                          <Minus size={14} className="text-gray-600" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-gray-800">{inCart.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(menu.id, inCart.quantity + 1)}
                          className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                        >
                          <Plus size={14} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(menu)}
                        className="w-9 h-9 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all"
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-5 left-5 right-5 z-40 animate-slide-up">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 px-6 rounded-2xl shadow-strong flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={20} />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="font-semibold">장바구니 보기</span>
            </div>
            <span className="font-bold text-lg">{cartTotal.toLocaleString()}원</span>
          </button>
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Cart header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">장바구니</h2>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {cart.map((item) => (
                <div key={item.menuId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{item.name}</p>
                    <p className="text-primary-600 font-bold text-sm mt-0.5">
                      {(item.price * item.quantity).toLocaleString()}원
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-full px-1 py-1 shadow-sm">
                    <button
                      onClick={() => handleQuantityChange(item.menuId, item.quantity - 1)}
                      className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Minus size={12} className="text-gray-600" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.menuId, item.quantity + 1)}
                      className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Plus size={12} className="text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart footer */}
            <div className="px-6 py-5 border-t border-gray-100 bg-white">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium">총 주문금액</span>
                <span className="text-2xl font-extrabold text-gray-900">
                  {cartTotal.toLocaleString()}
                  <span className="text-base font-medium text-gray-400">원</span>
                </span>
              </div>
              <button
                onClick={handleOrder}
                disabled={loading}
                className="w-full py-4 bg-gradient-warm text-white font-bold rounded-2xl transition-all disabled:opacity-50 text-lg shadow-glow active:scale-[0.98]"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    주문 처리 중...
                  </span>
                ) : `${cartTotal.toLocaleString()}원 주문하기`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
