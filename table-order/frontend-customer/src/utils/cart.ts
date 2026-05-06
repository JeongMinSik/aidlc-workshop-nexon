const CART_KEY = 'cart_items'

export interface CartItem {
  menuId: number
  name: string
  price: number
  quantity: number
  imageUrl: string
}

export function getCart(): CartItem[] {
  const data = localStorage.getItem(CART_KEY)
  return data ? JSON.parse(data) : []
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const cart = getCart()
  const existing = cart.find((i) => i.menuId === item.menuId)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({ ...item, quantity: 1 })
  }
  saveCart(cart)
  return cart
}

export function updateQuantity(menuId: number, quantity: number): CartItem[] {
  let cart = getCart()
  if (quantity <= 0) {
    cart = cart.filter((i) => i.menuId !== menuId)
  } else {
    const item = cart.find((i) => i.menuId === menuId)
    if (item) item.quantity = quantity
  }
  saveCart(cart)
  return cart
}

export function clearCart() {
  localStorage.removeItem(CART_KEY)
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}
